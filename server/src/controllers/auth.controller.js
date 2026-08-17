/**
 * 认证控制器
 * - register: 用户注册（邮箱+密码），bcrypt 加密存储
 * - login:    用户登录，签发 JWT
 * - getMe:    获取当前登录用户信息
 */
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { success, error } = require('../utils/response');
const { signToken } = require('../utils/jwt');
const { validate, isEmail, isUsername, isPassword } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * body: { username, email, password }
 */
const register = asyncHandler(async (req, res) => {
  const v = validate(req.body, {
    username: {
      required: true,
      test: isUsername,
      message: 'Username must be 3-30 characters (letters, numbers, underscore)',
    },
    email: { required: true, test: isEmail, message: 'A valid email is required' },
    password: {
      required: true,
      test: isPassword,
      message: 'Password must be at least 8 characters',
    },
  });
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  const { username, email, password } = req.body;

  // 唯一性预检查（避免直接撞 E11000 返回不友好错误）
  const existing = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
  if (existing) {
    const msg =
      existing.username === username ? 'Username is already taken' : 'Email is already registered';
    return error(res, msg, 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email: email.toLowerCase(), passwordHash });

  const token = signToken(user._id, user.role);
  return success(res, { token, user: user.toJSON() }, 201);
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
const login = asyncHandler(async (req, res) => {
  const v = validate(req.body, {
    email: { required: true, test: isEmail, message: 'A valid email is required' },
    password: { required: true, message: 'Password is required' },
  });
  if (!v.ok) return error(res, 'Validation failed', 400, v.errors);

  const { email, password } = req.body;
  // 需要 passwordHash，因此显式 select
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) return error(res, 'Invalid email or password', 401);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return error(res, 'Invalid email or password', 401);

  if (user.isDisabled) return error(res, 'Account has been disabled', 403);

  const token = signToken(user._id, user.role);
  return success(res, { token, user: user.toJSON() });
});

/**
 * GET /api/auth/me （需登录）
 * 返回当前登录用户信息
 */
const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user.toJSON() });
});

module.exports = { register, login, getMe };
