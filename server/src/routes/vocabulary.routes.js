/**
 * 词汇本路由（需登录）
 * POST   /api/vocabulary/add      收藏词汇
 * GET    /api/vocabulary/:userId  获取收藏列表（仅本人或管理员）
 * DELETE /api/vocabulary/:wordId  移除收藏
 */
const express = require('express');
const {
  addVocabulary,
  getVocabulary,
  removeVocabulary,
} = require('../controllers/vocabulary.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/add', requireAuth, addVocabulary);
router.get('/:userId', requireAuth, getVocabulary);
router.delete('/:wordId', requireAuth, removeVocabulary);

module.exports = router;
