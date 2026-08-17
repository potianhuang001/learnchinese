/**
 * API response helpers
 * Provide a consistent JSON envelope: { success, data | message, ... }
 */

/**
 * Send a success response.
 */
function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Send an error response.
 */
function error(res, message, status = 400, details = undefined) {
  const body = { success: false, message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, error };
