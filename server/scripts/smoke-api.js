/**
 * 临时冒烟测试：不依赖 MongoDB，验证路由挂载、认证拦截、输入校验
 * 运行：node scripts/smoke-api.js
 */
/* eslint-disable import/no-extraneous-dependencies -- 开发验证脚本，supertest 属 devDependencies 属合理用法 */

const request = require('supertest');
const app = require('../src/app');

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.log(`  FAIL  ${name} -> ${e.message}`);
    process.exitCode = 1;
  }
}

(async () => {
  console.log('=== API 冒烟测试（无需 MongoDB）===');

  await check('GET /api/health -> 200', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || !res.body.success) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/lessons/abc (bad id) -> 400', async () => {
    const res = await request(app).get('/api/lessons/abc');
    if (res.status !== 400) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/lessons?level=bad -> 400', async () => {
    const res = await request(app).get('/api/lessons?level=expert');
    if (res.status !== 400) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/questions (missing lessonId) -> 400', async () => {
    const res = await request(app).get('/api/questions');
    if (res.status !== 400) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/questions?lessonId=bad -> 400', async () => {
    const res = await request(app).get('/api/questions?lessonId=xyz');
    if (res.status !== 400) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/progress/:id (no token) -> 401', async () => {
    const res = await request(app).get('/api/progress/000000000000000000000000');
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('POST /api/progress/update (no token) -> 401', async () => {
    const res = await request(app)
      .post('/api/progress/update')
      .send({ lessonId: '000000000000000000000000' });
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/vocabulary/:id (no token) -> 401', async () => {
    const res = await request(app).get('/api/vocabulary/000000000000000000000000');
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/admin/stats (no token) -> 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/admin/users (no token) -> 401', async () => {
    const res = await request(app).get('/api/admin/users');
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('POST /api/auth/register (empty body) -> 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    if (res.status !== 400 || !res.body.details) throw new Error(`got ${res.status}`);
  });

  await check('POST /api/auth/login (empty body) -> 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    if (res.status !== 400) throw new Error(`got ${res.status}`);
  });

  await check('POST /api/vocabulary/add (no token) -> 401', async () => {
    const res = await request(app)
      .post('/api/vocabulary/add')
      .send({ wordId: '000000000000000000000000' });
    if (res.status !== 401) throw new Error(`got ${res.status}`);
  });

  await check('GET /api/nonexistent -> 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    if (res.status !== 404) throw new Error(`got ${res.status}`);
  });

  console.log(process.exitCode ? '=== 存在失败用例 ===' : '=== 全部通过 ===');
})();
