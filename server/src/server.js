/**
 * Server entry point
 * Connects to MongoDB then starts the HTTP server.
 */
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { runSeed } = require('./seed/seed');
const app = require('./app');

async function start() {
  await connectDB();

  // 首次启动自动灌库（幂等，可设 AUTO_SEED=false 关闭）
  if (env.AUTO_SEED !== 'false') {
    runSeed().catch((err) => console.error('[SEED] auto-seed skipped:', err.message));
  }

  app.listen(env.PORT, () => {
    console.log(`[SERVER] LearnChinese API running at http://localhost:${env.PORT}`);
    console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
  });
}

start();
