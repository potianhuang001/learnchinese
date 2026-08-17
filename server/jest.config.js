/**
 * Jest 测试配置
 * - 使用 mongodb-memory-server 提供内存 MongoDB（无需本地安装）
 * - globalSetup/globalTeardown：启动/停止内存数据库实例
 * - setupFilesAfterEnv：每个测试文件前连接 mongoose、每个用例前清库
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-after-env.js'],
  verbose: true,
  testTimeout: 30000,
};
