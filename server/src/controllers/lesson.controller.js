/**
 * 课程控制器（公开接口）
 * - listLessons:  按难度/分页获取课程列表（含 premium/locked 状态）
 * - getLessonById: 获取课程详情（含内嵌词汇、关联题目 ID；会员课程未解锁时隐藏视频）
 */
const { Lesson, Vocabulary } = require('../models');
const { success, error } = require('../utils/response');
const { isLevel, isObjectId } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { getLessonAccess } = require('../utils/membership');

/** 为课程文档附加 premium/locked 访问状态（不会修改数据库） */
function attachAccess(lesson, user) {
  const access = getLessonAccess(lesson, user);
  lesson.premium = access.premium;
  lesson.locked = access.locked;
  return lesson;
}

/**
 * GET /api/lessons?level=beginner&page=1&limit=10
 * 按 level 过滤（可选），按 order 升序排序，返回分页结果
 */
const listLessons = asyncHandler(async (req, res) => {
  const { level, page = '1', limit = '10' } = req.query;

  const filter = {};
  if (level) {
    if (!isLevel(level)) return error(res, 'level must be beginner | intermediate | advanced', 400);
    filter.level = level;
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

  const [lessons, total] = await Promise.all([
    Lesson.find(filter)
      .select('-content -quiz -__v') // 列表不返回内容详情/题目/版本号（详情接口才有）
      .sort({ order: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Lesson.countDocuments(filter),
  ]);

  // 附加会员访问状态
  const enriched = lessons.map((l) => attachAccess(l, req.user));

  return success(res, {
    lessons: enriched,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

/**
 * GET /api/lessons/:id
 * 返回课程完整内容（含 content.vocabulary / grammar / dialogue）
 * 额外返回 vocabItems：该课程在独立 Vocabulary 集合中的词汇文档（带 _id，供收藏使用）
 * 会员课程未解锁（locked=true）时：不返回 video 内容，quiz 返回空
 */
const getLessonById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid lesson id', 400);

  // lean()：使 attachAccess 附加的 premium/locked 能直接进入 JSON 输出
  const lesson = await Lesson.findById(id).lean();
  if (!lesson) return error(res, 'Lesson not found', 404);

  attachAccess(lesson, req.user);

  // 锁定课程：隐藏视频，quiz 置空（练习/测验由 questions 接口统一拦截）
  if (lesson.locked) {
    lesson.video = { type: '', url: '', title: '' };
    lesson.quiz = [];
  }

  const vocabItems = await Vocabulary.find({ lessonId: id }).lean();

  return success(res, { lesson, vocabItems });
});

module.exports = { listLessons, getLessonById };
