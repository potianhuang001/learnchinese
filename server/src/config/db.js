/**
 * Database connection
 * Connects to MongoDB using Mongoose with production-ready options.
 */
const mongoose = require('mongoose');
const env = require('./env');

/**
 * Establish the MongoDB connection.
 * @returns {Promise<mongoose.Connection>} The active mongoose connection.
 */
async function connectDB() {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production', // avoid index churn in prod
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Gracefully disconnect for tests / shutdown hooks.
 */
async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
