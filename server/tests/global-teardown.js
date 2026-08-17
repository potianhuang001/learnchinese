/**
 * Jest 全局 Teardown
 * - 停止 globalSetup 中启动的内存 MongoDB 实例
 */
module.exports = async () => {
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
    // eslint-disable-next-line no-console
    console.log('[test] MongoMemoryServer stopped');
  }
};
