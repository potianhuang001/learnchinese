/**
 * 认证路由
 * POST /api/auth/register  注册
 * POST /api/auth/login     登录
 * GET  /api/auth/me        当前用户（需登录）
 */
const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;
