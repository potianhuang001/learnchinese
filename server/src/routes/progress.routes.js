/**
 * 进度路由（需登录）
 * POST /api/progress/update     更新/创建进度
 * GET  /api/progress/:userId    查询用户进度（仅本人或管理员）
 */
const express = require('express');
const { updateProgress, getProgress } = require('../controllers/progress.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/update', requireAuth, updateProgress);
router.get('/:userId', requireAuth, getProgress);

module.exports = router;
