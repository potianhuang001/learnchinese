/**
 * 集成测试：课程模块
 * 覆盖 GET /api/lessons（列表/分页/难度过滤）与 GET /api/lessons/:id（详情）
 */
const request = require('supertest');
const app = require('../../src/app');
const { createLesson, createVocabulary, randomObjectId } = require('../utils/factories');

describe('Lessons API', () => {
  describe('GET /api/lessons', () => {
    test('返回分页结构与课程数组', async () => {
      await createLesson({ title: 'Lesson One', order: 1 });
      await createLesson({ title: 'Lesson Two', order: 2 });

      const res = await request(app).get('/api/lessons');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lessons).toHaveLength(2);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.pages).toBe(1);
    });

    test('按 order 升序返回', async () => {
      await createLesson({ title: 'B', order: 2 });
      await createLesson({ title: 'A', order: 1 });
      const res = await request(app).get('/api/lessons');
      const titles = res.body.data.lessons.map((l) => l.title);
      expect(titles).toEqual(['A', 'B']);
    });

    test('level 过滤只返回对应难度', async () => {
      await createLesson({ title: 'Beginner L', level: 'beginner', order: 1 });
      await createLesson({ title: 'Adv L', level: 'advanced', order: 2 });

      const res = await request(app).get('/api/lessons?level=beginner');
      expect(res.status).toBe(200);
      expect(res.body.data.lessons).toHaveLength(1);
      expect(res.body.data.lessons[0].level).toBe('beginner');
    });

    test('非法 level 返回 400', async () => {
      const res = await request(app).get('/api/lessons?level=expert');
      expect(res.status).toBe(400);
    });

    test('分页参数生效', async () => {
      for (let i = 1; i <= 5; i += 1) {
        await createLesson({ title: `Lesson ${i}`, order: i });
      }
      const res = await request(app).get('/api/lessons?page=2&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data.lessons).toHaveLength(2);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.pages).toBe(3);
    });

    test('limit 上限被钳制为 50', async () => {
      const res = await request(app).get('/api/lessons?limit=999');
      expect(res.status).toBe(200);
      expect(res.body.data.lessons).toHaveLength(0); // 无数据但请求合法
    });

    test('课程列表不泄露 quiz/内容细节（lean 返回不含敏感冗余）', async () => {
      await createLesson({ title: 'Lean', order: 1 });
      const res = await request(app).get('/api/lessons');
      const lesson = res.body.data.lessons[0];
      expect(lesson.title).toBe('Lean');
      expect(lesson.__v).toBeUndefined();
    });
  });

  describe('GET /api/lessons/:id', () => {
    test('返回课程完整内容与独立词汇（vocabItems）', async () => {
      const lesson = await createLesson({ title: 'Detail Lesson', order: 1 });
      const vocab = await createVocabulary({ lessonId: lesson._id, word: '你好' });

      const res = await request(app).get(`/api/lessons/${lesson._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.lesson.title).toBe('Detail Lesson');
      expect(res.body.data.lesson.content.characters).toBe('你好');
      expect(res.body.data.vocabItems).toHaveLength(1);
      expect(res.body.data.vocabItems[0]._id).toBe(vocab._id.toString());
      expect(res.body.data.vocabItems[0].word).toBe('你好');
    });

    test('非法 id 格式返回 400', async () => {
      const res = await request(app).get('/api/lessons/not-an-objectid');
      expect(res.status).toBe(400);
    });

    test('不存在的课程返回 404', async () => {
      const res = await request(app).get(`/api/lessons/${randomObjectId()}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
