/**
 * 管理端路由（全部需管理员权限）
 * POST   /api/admin/lessons       新增课程
 * PUT    /api/admin/lessons/:id   更新课程
 * DELETE /api/admin/lessons/:id   删除课程（级联清理）
 * GET    /api/admin/users         用户列表
 * PUT    /api/admin/users/:id     禁用/启用用户
 * GET    /api/admin/stats         数据统计
 */
const express = require('express');
const {
  createLesson,
  updateLesson,
  deleteLesson,
  listUsers,
  toggleUser,
  getStats,
} = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 该路由组下所有接口都要求管理员身份
router.use(requireAuth, requireAdmin);

router.post('/lessons', createLesson);
router.put('/lessons/:id', updateLesson);
router.delete('/lessons/:id', deleteLesson);

router.get('/users', listUsers);
router.put('/users/:id', toggleUser);

router.get('/stats', getStats);

module.exports = router;
