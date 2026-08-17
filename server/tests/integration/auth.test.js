/**
 * 集成测试：认证模块
 * 覆盖 POST /api/auth/register、POST /api/auth/login、GET /api/auth/me
 */
const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const { createUser, uniqueEmail } = require('../utils/factories');

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    test('注册成功返回 token 与用户信息（不含 passwordHash）', async () => {
      const payload = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
      };
      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('newuser');
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.role).toBe('user');

      // 数据库确实写入且密码已加密
      const saved = await User.findOne({ email: 'newuser@test.com' }).select('+passwordHash');
      expect(saved).not.toBeNull();
      expect(saved.passwordHash).not.toBe(payload.password);
    });

    test('邮箱重复返回 409', async () => {
      const email = uniqueEmail();
      await createUser({ email });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'another', email, password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already/i);
    });

    test('用户名重复返回 409', async () => {
      const { user } = await createUser();
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: user.username, email: uniqueEmail(), password: 'password123' });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already/i);
    });

    test('非法邮箱返回 400 + details', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validname', email: 'not-an-email', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.details.email).toBeDefined();
    });

    test('密码不足 8 位返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validname', email: 'a@b.com', password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.details.password).toBeDefined();
    });

    test('缺少必填字段返回 400', async () => {
      const res = await request(app).post('/api/auth/register').send({});
      expect(res.status).toBe(400);
      expect(Object.keys(res.body.details || {})).toEqual(
        expect.arrayContaining(['username', 'email', 'password']),
      );
    });
  });

  describe('POST /api/auth/login', () => {
    test('正确凭据登录成功', async () => {
      const { password } = await createUser({ email: 'login@test.com' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('密码错误返回 401', async () => {
      await createUser({ email: 'wrongpw@test.com' });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrongpw@test.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    test('用户不存在返回 401（不泄露账号是否存在）', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'password123' });
      expect(res.status).toBe(401);
    });

    test('非法邮箱格式返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'bad-email', password: 'password123' });
      expect(res.status).toBe(400);
    });

    test('被禁用账号返回 403', async () => {
      await createUser({ email: 'disabled@test.com', isDisabled: true });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'disabled@test.com', password: 'password123' });
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/disabled/i);
    });
  });

  describe('GET /api/auth/me', () => {
    test('携带有效 token 返回当前用户', async () => {
      const { user, token } = await createUser({ email: 'me@test.com' });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user._id).toBe(user._id.toString());
      expect(res.body.data.user.email).toBe('me@test.com');
    });

    test('无 token 返回 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    test('无效 token 返回 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|expired/i);
    });
  });
});
