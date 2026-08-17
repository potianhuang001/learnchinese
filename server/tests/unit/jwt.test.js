/**
 * 单元测试：JWT 工具
 * 覆盖 signToken / verifyToken 的正常签发、校验与异常场景。
 */
const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../../src/utils/jwt');
const env = require('../../src/config/env');

describe('JWT utils', () => {
  const userId = '64b1f2c3d4e5f6a7b8c9d0e1';

  describe('signToken', () => {
    test('签发包含 sub 与 role 的 token', () => {
      const token = signToken(userId, 'user');
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature

      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.sub).toBe(userId);
      expect(decoded.role).toBe('user');
    });

    test('签发 token 带过期时间', () => {
      const token = signToken(userId, 'admin');
      const decoded = jwt.verify(token, env.JWT_SECRET);
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyToken', () => {
    test('合法 token 解析成功', () => {
      const token = signToken(userId, 'user');
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe(userId);
      expect(decoded.role).toBe('user');
    });

    test('篡改的 token 抛错', () => {
      const token = signToken(userId, 'user');
      const tampered = `${token.slice(0, -4)}abcd`;
      expect(() => verifyToken(tampered)).toThrow();
    });

    test('用错误密钥签发的 token 校验失败', () => {
      const foreign = jwt.sign({ sub: userId, role: 'user' }, 'wrong_secret');
      expect(() => verifyToken(foreign)).toThrow();
    });

    test('非字符串输入抛错', () => {
      expect(() => verifyToken(undefined)).toThrow();
      expect(() => verifyToken(null)).toThrow();
      expect(() => verifyToken('')).toThrow();
    });
  });
});
