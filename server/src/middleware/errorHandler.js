/**
 * Centralized error handling middleware
 * - notFound: catches unmatched routes → 404
 * - errorHandler: converts thrown errors into consistent JSON responses
 */
const { error } = require('../utils/response');
const env = require('../config/env');

/** 404 handler for unknown routes */
function notFound(req, res) {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Global error handler (must have 4 args for Express to recognize it).
 * Mongoose validation / cast errors are normalized to 400; everything
 * else falls back to 500 with a generic message (details logged).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate key error
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}. Please use a different ${field}.`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired. Please log in again.';
  }

  if (status >= 500 && env.NODE_ENV !== 'test') {
    console.error('[ERROR]', err);
  }

  return error(res, message, status);
}

module.exports = { notFound, errorHandler };
