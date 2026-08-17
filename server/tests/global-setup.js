/**
 * Jest 全局 Setup
 * - 将 mongod 二进制下载目录固定到 E 盘（用户要求：所有缓存/文件不落 C 盘）
 * - 启动内存 MongoDB 实例，URI 写入 process.env.MONGOMS_URI 供测试使用
 */
const fs = require('fs');
const path = require('path');

// 必须在 require mongodb-memory-server 之前设置下载目录
// mongodb-memory-server 默认下载到用户主目录 .cache，这里重定向到 E 盘
// 注意：指向 "clean" 目录（预置已解压的 mongod.exe 且无 .lock 文件），
//       避免下载/校验/解压过程中 unlink 触发沙箱 safe-delete 拦截
const E_CACHE_DIR = 'E:/cache/mongodb-binaries-clean';
process.env.MONGOMS_DOWNLOAD_DIR = E_CACHE_DIR;

module.exports = async () => {
  // 确保下载目录存在
  fs.mkdirSync(E_CACHE_DIR, { recursive: true });

  // 延迟 require：必须在设置环境变量之后加载
  const { MongoMemoryServer } = require('mongodb-memory-server');

  const mongod = await MongoMemoryServer.create({
    instance: { storageEngine: 'wiredTiger' },
  });

  // 将实例挂在 globalThis 供 global-teardown 停止
  globalThis.__MONGOD__ = mongod;
  process.env.MONGOMS_URI = mongod.getUri();

  // eslint-disable-next-line no-console
  console.log(`[test] MongoMemoryServer started: ${process.env.MONGOMS_URI}`);
};
