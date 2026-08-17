/**
 * 题目控制器（公开接口）
 * - getQuestions: 按 lessonId 获取该课程的全部练习题（会员课程需解锁）
 */
const { Lesson, Question } = require('../models');
const { success, error } = require('../utils/response');
const { isObjectId } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const { getLessonAccess } = require('../utils/membership');

/**
 * GET /api/questions?lessonId=<id>
 * 返回该课程全部题目；若 lesson 不存在则 404
 * 会员课程（中级/高级）未解锁时返回 403，提示开通会员
 */
const getQuestions = asyncHandler(async (req, res) => {
  const { lessonId } = req.query;
  if (!lessonId) return error(res, 'lessonId query parameter is required', 400);
  if (!isObjectId(lessonId)) return error(res, 'Invalid lessonId', 400);

  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return error(res, 'Lesson not found', 404);

  const access = getLessonAccess(lesson, req.user);
  if (access.locked) {
    return error(res, 'This lesson requires an active membership', 403, {
      code: 'MEMBERSHIP_REQUIRED',
      premium: true,
    });
  }

  const questions = await Question.find({ lessonId }).sort({ createdAt: 1 });
  return success(res, { questions, count: questions.length });
});

module.exports = { getQuestions };
