/**
 * JWT 工具
 * - signToken: 签发 token，payload 包含 sub(用户ID) 和 role
 * - verifyToken: 校验并解析 token
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * 签发 JWT
 * @param {string} userId 用户 ObjectId
 * @param {string} role 用户角色
 * @returns {string} token
 */
function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * 校验 JWT
 * @param {string} token
 * @returns {object} 解码后的 payload（含 sub、role、iat、exp）
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
