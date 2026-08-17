/**
 * 进度控制器
 * - updateProgress: 更新/创建进度记录（Progress 集合 + User.progress 快照双写）
 * - getProgress:    查询用户全部课程进度（只能查自己或管理员）
 *
 * 双写策略：
 * - Progress 集合：详细记录（completed/score 取最高/timeSpent 累计/lastAccessed）
 * - User.progress 内嵌数组：个人中心展示用的轻量快照
 */
const { User, Lesson, Progress } = require('../models');
const { success, error } = require('../utils/response');
const { validate, isObjectId, isBoolean, isNumber } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/progress/update （需登录）
 * body: { lessonId, completed?, score?, timeSpent? }
 * 说明：score 保留历史最高分；timeSpent 按秒累计；completed 可标记为 true
 */
const updateProgress = asyncHandler(async (req, res) => {
  const v = validate(req.body, {
    lessonId: { required: true, test: isObjectId, message: 'A valid lessonId is required' },
    completed: { test: isBoolean, message: 'completed must be a boolean' },
    score: {
      test: (x) => isNumber(x) && x >= 0 && x <= 100,
      message: 'score must be a number between 0 and 100',
    },
    timeSpent: {
      test: (x) => isNumber(x) && x >= 0,
      message: 'timeSpent must be a non-negative number (seconds)',
    },
  });
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  const { lessonId, completed, score, timeSpent } = req.body;
  const userId = req.user._id;

  const lesson = await Lesson.exists({ _id: lessonId });
  if (!lesson) return error(res, 'Lesson not found', 404);

  const now = new Date();

  // 1) 更新 Progress 集合（详细记录）
  const progress = await Progress.findOneAndUpdate(
    { userId, lessonId },
    {
      $set: {
        completed: completed === true,
        lastAccessed: now,
      },
      $max: { score: score || 0 },
      $inc: { timeSpent: timeSpent || 0 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // 2) 同步 User.progress 快照
  const user = await User.findById(userId);
  const entry = user.progress.find((p) => p.lessonId.toString() === lessonId.toString());
  if (entry) {
    if (completed === true) entry.completed = true;
    if (score !== undefined) entry.score = Math.max(entry.score, score);
    entry.lastAccessed = now;
  } else {
    user.progress.push({
      lessonId,
      completed: completed === true,
      score: score || 0,
      lastAccessed: now,
    });
  }
  await user.save();

  return success(res, { progress }, 201);
});

/**
 * GET /api/progress/:userId （需登录，仅本人或管理员）
 * 返回该用户所有课程的进度记录（含课程标题/难度）
 */
const getProgress = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isObjectId(userId)) return error(res, 'Invalid user id', 400);

  // 只能查看自己的进度，管理员可查看任意用户
  const isSelf = req.user._id.toString() === userId;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin) return error(res, 'You can only view your own progress', 403);

  const progress = await Progress.find({ userId })
    .populate('lessonId', 'title level order')
    .sort({ lastAccessed: -1 });

  // 汇总统计
  const stats = progress.reduce(
    (acc, p) => {
      if (p.completed) acc.completedLessons += 1;
      acc.totalTimeSpent += p.timeSpent;
      acc.averageScore += p.score;
      return acc;
    },
    { totalLessons: progress.length, completedLessons: 0, totalTimeSpent: 0, averageScore: 0 },
  );
  if (progress.length) stats.averageScore = Math.round(stats.averageScore / progress.length);

  return success(res, { progress, stats });
});

module.exports = { updateProgress, getProgress };
