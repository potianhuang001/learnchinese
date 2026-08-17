/**
 * 题目路由（公开）
 * GET /api/questions?lessonId=<id> 获取某课程全部练习题
 */
const express = require('express');
const { getQuestions } = require('../controllers/question.controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getQuestions);

module.exports = router;
