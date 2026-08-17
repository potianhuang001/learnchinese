/**
 * 管理端控制器（所有路由均需 requireAuth + requireAdmin）
 * - 课程 CRUD（创建时自动同步 Vocabulary 集合与 Question 集合）
 * - 用户管理（列表 / 禁用启用）
 * - 数据统计
 */
const { User, Lesson, Question, Vocabulary, Progress, Order, Plan } = require('../models');
const { success, error } = require('../utils/response');
const { validate, isObjectId, isLevel, isBoolean } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

/**
 * 将课程内嵌词汇同步到独立 Vocabulary 集合（收藏用）
 * 策略：删除该课程旧词汇 → 批量插入新词汇（幂等，无残留）
 */
async function syncLessonVocabulary(lessonId, items) {
  await Vocabulary.deleteMany({ lessonId });
  if (!Array.isArray(items) || items.length === 0) return;
  const docs = items
    .filter((i) => i && i.word && i.pinyin && i.translation)
    .map((i) => ({
      word: i.word,
      pinyin: i.pinyin,
      translation: i.translation,
      example: i.example || '',
      audioUrl: i.audioUrl || '',
      lessonId,
    }));
  if (docs.length) await Vocabulary.insertMany(docs);
}

/**
 * 将题目数组同步到 Question 集合，并更新 Lesson.quiz 关联
 * 策略：删除该课程旧题目 → 批量创建新题目 → 更新 lesson.quiz
 */
async function replaceLessonQuestions(lessonId, questions) {
  await Question.deleteMany({ lessonId });
  if (!Array.isArray(questions) || questions.length === 0) {
    await Lesson.updateOne({ _id: lessonId }, { $set: { quiz: [] } });
    return;
  }
  const docs = questions
    .filter((q) => q && q.type && q.prompt && q.correctAnswer)
    .map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      audioUrl: q.audioUrl || '',
      lessonId,
    }));
  const created = await Question.insertMany(docs);
  await Lesson.updateOne({ _id: lessonId }, { $set: { quiz: created.map((q) => q._id) } });
}

/** 课程内容体校验（创建/更新共用） */
function validateLessonBody(body) {
  return validate(body, {
    title: {
      test: (v) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= 200,
      message: 'title must be 1-200 characters',
    },
    description: {
      test: (v) => typeof v === 'string' && v.trim().length > 0,
      message: 'description is required',
    },
    level: { test: isLevel, message: 'level must be beginner | intermediate | advanced' },
    order: {
      test: (v) => Number.isInteger(v) && v >= 1,
      message: 'order must be a positive integer',
    },
    audioUrl: {
      test: (v) => v === undefined || v === '' || /^https?:\/\/\S+$/i.test(v),
      message: 'audioUrl must be a valid URL',
    },
    content: {
      test: (v) => v === undefined || (typeof v === 'object' && v !== null && !Array.isArray(v)),
      message: 'content must be an object',
    },
    questions: {
      test: (v) => v === undefined || Array.isArray(v),
      message: 'questions must be an array',
    },
    video: {
      test: (v) =>
        v === undefined ||
        (typeof v === 'object' && v !== null && ['', 'mp4', 'youtube', 'bilibili'].includes(v.type || '')),
      message: 'video must be an object with type in mp4 | youtube | bilibili',
    },
  });
}

/**
 * POST /api/admin/lessons
 * body: { title, description, level, order, content?, audioUrl?, questions? }
 * content.vocabulary 自动同步到 Vocabulary 集合；questions 自动创建并关联
 */
const createLesson = asyncHandler(async (req, res) => {
  const v = validateLessonBody(req.body);
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);
  const { title, description, level, order, content = {}, audioUrl = '', questions, video } =
    req.body;

  // order 唯一性检查
  const dup = await Lesson.exists({ order });
  if (dup) return error(res, `A lesson with order ${order} already exists`, 409);

  const lesson = await Lesson.create({
    title: title.trim(),
    description: description.trim(),
    level,
    order,
    content,
    audioUrl,
    video:
      video && video.type
        ? { type: video.type, url: video.url || '', title: video.title || '' }
        : { type: '', url: '', title: '' },
  });

  // 同步词汇与题目
  await syncLessonVocabulary(lesson._id, content.vocabulary);
  await replaceLessonQuestions(lesson._id, questions);

  return success(res, { lesson }, 201);
});

/**
 * PUT /api/admin/lessons/:id
 * body: 任意可选字段，与创建一致；questions 提供时整体替换
 */
const updateLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid lesson id', 400);

  const v = validateLessonBody(req.body);
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  const lesson = await Lesson.findById(id);
  if (!lesson) return error(res, 'Lesson not found', 404);

  const { title, description, level, order, content, audioUrl, questions, video } = req.body;

  // order 变更时的唯一性检查
  if (order !== undefined && order !== lesson.order) {
    const dup = await Lesson.exists({ order, _id: { $ne: id } });
    if (dup) return error(res, `A lesson with order ${order} already exists`, 409);
  }

  if (title !== undefined) lesson.title = title.trim();
  if (description !== undefined) lesson.description = description.trim();
  if (level !== undefined) lesson.level = level;
  if (order !== undefined) lesson.order = order;
  if (content !== undefined) lesson.content = content;
  if (audioUrl !== undefined) lesson.audioUrl = audioUrl;
  if (video !== undefined) {
    lesson.video = video && video.type
      ? { type: video.type, url: video.url || '', title: video.title || '' }
      : { type: '', url: '', title: '' };
  }
  await lesson.save();

  // 同步词汇与题目（仅在提供时）
  if (content !== undefined) await syncLessonVocabulary(lesson._id, content.vocabulary);
  if (questions !== undefined) await replaceLessonQuestions(lesson._id, questions);

  const updated = await Lesson.findById(id).populate('quiz');
  return success(res, { lesson: updated });
});

/**
 * DELETE /api/admin/lessons/:id
 * 级联删除：课程 → 关联题目 / 词汇 / 进度记录
 */
const deleteLesson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid lesson id', 400);

  const lesson = await Lesson.findByIdAndDelete(id);
  if (!lesson) return error(res, 'Lesson not found', 404);

  await Promise.all([
    Question.deleteMany({ lessonId: id }),
    Vocabulary.deleteMany({ lessonId: id }),
    Progress.deleteMany({ lessonId: id }),
    // 从所有用户的内嵌 progress 快照中移除该课程
    User.updateMany({ 'progress.lessonId': id }, { $pull: { progress: { lessonId: id } } }),
    // 从所有用户的词汇收藏中移除该课程的词汇
    Vocabulary.find({ lessonId: id }).then((words) => {
      const ids = words.map((w) => w._id);
      if (ids.length)
        return User.updateMany(
          { vocabulary: { $in: ids } },
          { $pull: { vocabulary: { $in: ids } } },
        );
      return null;
    }),
  ]);

  return success(res, { message: 'Lesson deleted' });
});

/**
 * GET /api/admin/users?page=&limit=&search=
 * 用户列表（可按 username/email 搜索）
 */
const listUsers = asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', search = '' } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = search
    ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  return success(res, { users, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 });
});

/**
 * PUT /api/admin/users/:id
 * body: { isDisabled: boolean } —— 禁用/启用用户
 * 禁止管理员禁用自己的账号
 */
const toggleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid user id', 400);

  const v = validate(req.body, {
    isDisabled: { required: true, test: isBoolean, message: 'isDisabled must be a boolean' },
  });
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  if (req.user._id.toString() === id) return error(res, 'You cannot disable your own account', 400);

  const user = await User.findById(id);
  if (!user) return error(res, 'User not found', 404);

  user.isDisabled = req.body.isDisabled;
  await user.save();

  return success(res, { user: user.toJSON() });
});

/**
 * GET /api/admin/stats
 * 基础统计：用户数 / 课程数 / 题目数 / 词汇数 / 完成进度数 / 学习总时长 / 会员与营收
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    userCount,
    lessonCount,
    questionCount,
    vocabularyCount,
    progressCount,
    activeProgress,
    totalTimeSpent,
    memberCount,
    paidOrderCount,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    Lesson.countDocuments(),
    Question.countDocuments(),
    Vocabulary.countDocuments(),
    Progress.countDocuments(),
    Progress.countDocuments({ completed: true }),
    Progress.aggregate([{ $group: { _id: null, total: { $sum: '$timeSpent' } } }]),
    // 有效会员（status=active 且未过期）
    User.countDocuments({ 'membership.status': 'active', 'membership.expiresAt': { $gt: new Date() } }),
    Order.countDocuments({ status: 'paid' }),
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return success(res, {
    stats: {
      userCount,
      lessonCount,
      questionCount,
      vocabularyCount,
      progressCount,
      completedLessons: activeProgress,
      completionRate: progressCount ? Math.round((activeProgress / progressCount) * 100) : 0,
      totalTimeSpent: totalTimeSpent.length ? totalTimeSpent[0].total : 0,
      memberCount,
      paidOrderCount,
      revenue: revenueAgg.length ? revenueAgg[0].total : 0, // 单位：分
    },
  });
});

module.exports = { createLesson, updateLesson, deleteLesson, listUsers, toggleUser, getStats };
