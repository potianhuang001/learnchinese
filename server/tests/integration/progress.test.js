/**
 * 集成测试：学习进度模块
 * 覆盖 POST /api/progress/update（双写 + 去重累计）与 GET /api/progress/:userId
 */
const request = require('supertest');
const app = require('../../src/app');
const { User, Progress, Lesson } = require('../../src/models');
const { createUser, createLesson, randomObjectId } = require('../utils/factories');

describe('Progress API', () => {
  describe('POST /api/progress/update', () => {
    test('未登录返回 401', async () => {
      const lesson = await createLesson();
      const res = await request(app)
        .post('/api/progress/update')
        .send({ lessonId: lesson._id.toString() });
      expect(res.status).toBe(401);
    });

    test('首次更新创建 Progress 记录并同步 User 快照', async () => {
      const { user, token } = await createUser();
      const lesson = await createLesson();

      const res = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: lesson._id.toString(), completed: true, score: 80, timeSpent: 120 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.completed).toBe(true);
      expect(res.body.data.progress.score).toBe(80);
      expect(res.body.data.progress.timeSpent).toBe(120);

      // Progress 集合落库
      const saved = await Progress.findOne({ userId: user._id, lessonId: lesson._id });
      expect(saved).not.toBeNull();

      // User 快照同步
      const fresh = await User.findById(user._id);
      expect(fresh.progress).toHaveLength(1);
      expect(fresh.progress[0].completed).toBe(true);
      expect(fresh.progress[0].score).toBe(80);
    });

    test('再次更新：score 取最高、timeSpent 累计', async () => {
      const { token } = await createUser();
      const lesson = await createLesson();
      const base = { lessonId: lesson._id.toString() };

      await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, score: 60, timeSpent: 30 });
      const res2 = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, score: 90, timeSpent: 20 });

      expect(res2.status).toBe(201);
      expect(res2.body.data.progress.score).toBe(90); // 取最高
      expect(res2.body.data.progress.timeSpent).toBe(50); // 30 + 20 累计

      // 只有一条记录（唯一索引）
      const count = await Progress.countDocuments({ lessonId: lesson._id });
      expect(count).toBe(1);
    });

    test('更低分数不会覆盖最高分', async () => {
      const { token } = await createUser();
      const lesson = await createLesson();
      const base = { lessonId: lesson._id.toString() };

      await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, score: 90 });
      const res2 = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...base, score: 40 });

      expect(res2.body.data.progress.score).toBe(90);
    });

    test('不存在的课程返回 404', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: randomObjectId() });
      expect(res.status).toBe(404);
    });

    test('非法 lessonId 返回 400', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: 'bad-id' });
      expect(res.status).toBe(400);
    });

    test('score 超出 0-100 返回 400', async () => {
      const { token } = await createUser();
      const lesson = await createLesson();
      const res = await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: lesson._id.toString(), score: 150 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/progress/:userId', () => {
    test('用户可查看自己的进度与统计', async () => {
      const { user, token } = await createUser();
      const lesson = await createLesson({ title: 'Progress Lesson', order: 1 });

      await request(app)
        .post('/api/progress/update')
        .set('Authorization', `Bearer ${token}`)
        .send({ lessonId: lesson._id.toString(), completed: true, score: 100, timeSpent: 60 });

      const res = await request(app)
        .get(`/api/progress/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.progress).toHaveLength(1);
      expect(res.body.data.progress[0].lessonId.title).toBe('Progress Lesson'); // populate
      expect(res.body.data.stats.completedLessons).toBe(1);
      expect(res.body.data.stats.totalTimeSpent).toBe(60);
      expect(res.body.data.stats.averageScore).toBe(100);
    });

    test('用户不能查看他人进度（403）', async () => {
      const { user: other } = await createUser();
      const { token } = await createUser();

      const res = await request(app)
        .get(`/api/progress/${other._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    test('管理员可查看任意用户进度', async () => {
      const { user: target } = await createUser();
      const { token: adminToken } = await createUser({ role: 'admin' });

      const res = await request(app)
        .get(`/api/progress/${target._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stats.totalLessons).toBe(0);
    });

    test('未登录返回 401', async () => {
      const { user } = await createUser();
      const res = await request(app).get(`/api/progress/${user._id}`);
      expect(res.status).toBe(401);
    });

    test('非法 userId 返回 400', async () => {
      const { token } = await createUser();
      const res = await request(app)
        .get('/api/progress/not-an-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });
});
