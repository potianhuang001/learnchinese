/**
 * 认证与授权中间件
 * - requireAuth: 校验 Bearer token，挂载 req.user（完整 User 文档）
 * - requireAdmin: 在 requireAuth 之后使用，校验管理员角色
 */
const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/** 从 Authorization 头提取 Bearer token */
function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** 认证：要求有效登录态 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return error(res, 'Authentication required', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return error(res, 'Invalid or expired token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) return error(res, 'User account no longer exists', 401);
  if (user.isDisabled) return error(res, 'Account has been disabled', 403);

  req.user = user; // 挂载完整用户文档供后续使用
  next();
});

/** 授权：要求管理员角色（需先经过 requireAuth） */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 'Admin access required', 403);
  }
  next();
}

/** 可选认证：有有效 token 则挂载 req.user，无 token / token 无效则不拦截 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(); // 无效 token 按匿名处理
  }

  const user = await User.findById(payload.sub);
  if (!user || user.isDisabled) return next();

  req.user = user;
  next();
});

module.exports = { requireAuth, requireAdmin, optionalAuth };
