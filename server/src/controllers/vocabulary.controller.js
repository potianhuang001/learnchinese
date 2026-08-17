/**
 * 词汇本控制器
 * - addVocabulary:  收藏词汇（User.vocabulary 追加词汇 ID，自动去重）
 * - getVocabulary:  获取用户收藏列表（只能查自己或管理员）
 */
const { User, Vocabulary } = require('../models');
const { success, error } = require('../utils/response');
const { validate, isObjectId } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/vocabulary/add （需登录）
 * body: { wordId }
 * 将词汇加入当前用户收藏；已收藏则直接返回现有列表
 */
const addVocabulary = asyncHandler(async (req, res) => {
  const v = validate(req.body, {
    wordId: { required: true, test: isObjectId, message: 'A valid wordId is required' },
  });
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  const { wordId } = req.body;
  const userId = req.user._id;

  const word = await Vocabulary.exists({ _id: wordId });
  if (!word) return error(res, 'Vocabulary word not found', 404);

  const user = await User.findById(userId);
  if (!user.vocabulary.some((id) => id.toString() === wordId)) {
    user.vocabulary.push(wordId);
    await user.save();
  }

  return success(res, { vocabulary: user.vocabulary }, 201);
});

/**
 * GET /api/vocabulary/:userId （需登录，仅本人或管理员）
 * 返回用户收藏的词汇完整信息
 */
const getVocabulary = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isObjectId(userId)) return error(res, 'Invalid user id', 400);

  const isSelf = req.user._id.toString() === userId;
  const isAdmin = req.user.role === 'admin';
  if (!isSelf && !isAdmin) return error(res, 'You can only view your own vocabulary', 403);

  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  const words = await Vocabulary.find({ _id: { $in: user.vocabulary } })
    .populate('lessonId', 'title level')
    .sort({ createdAt: -1 });

  return success(res, { vocabulary: words, count: words.length });
});

/**
 * DELETE /api/vocabulary/:wordId （需登录）
 * 将词汇从当前用户收藏中移除
 */
const removeVocabulary = asyncHandler(async (req, res) => {
  const { wordId } = req.params;
  if (!isObjectId(wordId)) return error(res, 'Invalid word id', 400);

  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) return error(res, 'User not found', 404);

  user.vocabulary = user.vocabulary.filter((id) => id.toString() !== wordId);
  await user.save();

  return success(res, { vocabulary: user.vocabulary });
});

module.exports = { addVocabulary, getVocabulary, removeVocabulary };
