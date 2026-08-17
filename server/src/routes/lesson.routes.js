/**
 * 课程路由（公开）
 * GET /api/lessons     课程列表（?level=&page=&limit=）
 * GET /api/lessons/:id 课程详情
 */
const express = require('express');
const { listLessons, getLessonById } = require('../controllers/lesson.controller');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, listLessons);
router.get('/:id', optionalAuth, getLessonById);

module.exports = router;
