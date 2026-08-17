/**
 * Jest 测试环境准备（每个测试文件执行前加载）
 * - beforeAll：使用内存 MongoDB URI 连接 mongoose
 * - beforeEach：清空所有集合，保证用例之间数据隔离
 * - afterAll：断开 mongoose 连接
 */
const mongoose = require('mongoose');

/** 清空全部集合（保证每个用例从干净状态开始） */
async function clearDatabase() {
  const collections = mongoose.connection.collections;
  const clears = Object.values(collections).map((col) => col.deleteMany({}));
  await Promise.all(clears);
}

beforeAll(async () => {
  const uri = process.env.MONGOMS_URI;
  if (!uri) {
    throw new Error('MONGOMS_URI 未设置，请检查 tests/global-setup.js 是否正常执行');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});
