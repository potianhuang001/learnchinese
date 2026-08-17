/**
 * Server entry point
 * Connects to MongoDB then starts the HTTP server.
 */
const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`[SERVER] LearnChinese API running at http://localhost:${env.PORT}`);
    console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
  });
}

start();
