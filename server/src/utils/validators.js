/**
 * 轻量输入验证器（零依赖）
 * 用法：
 *   const v = validate(body, {
 *     email: { required: true, test: isEmail, message: 'Valid email is required' },
 *     password: { required: true, test: (v) => v.length >= 8, message: 'Password must be at least 8 chars' },
 *   });
 *   if (!v.ok) return error(res, 'Validation failed', 400, v.errors);
 */
/* eslint-disable no-restricted-syntax, no-continue -- 遍历 schema 条目需用 for...of + continue */

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const emailRegex = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

const isEmail = (v) => typeof v === 'string' && emailRegex.test(v);
const isUsername = (v) => typeof v === 'string' && usernameRegex.test(v);
const isPassword = (v) => typeof v === 'string' && v.length >= 8;
const isObjectId = (v) => typeof v === 'string' && objectIdRegex.test(v);
const isLevel = (v) => ['beginner', 'intermediate', 'advanced'].includes(v);
const isQuestionType = (v) => ['multiple_choice', 'fill_blank', 'listening'].includes(v);
const isBoolean = (v) => typeof v === 'boolean';
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isArrayOfStrings = (v) => Array.isArray(v) && v.every((i) => typeof i === 'string');
const isUrl = (v) => typeof v === 'string' && (v === '' || /^https?:\/\/\S+$/i.test(v));

/**
 * 校验 body，schema 定义如下：
 * {
 *   fieldName: {
 *     required?: boolean,        // 必填（undefined/null/'' 视为缺失）
 *     test?: (value) => boolean, // 自定义校验
 *     message: string,           // 错误提示
 *   }
 * }
 * @returns {{ ok: true } | { ok: false, errors: Record<string,string> }}
 */
function validate(body, schema) {
  const errors = {};
  for (const [field, rule] of Object.entries(schema)) {
    const value = body ? body[field] : undefined;
    const missing = value === undefined || value === null || value === '';

    if (rule.required && missing) {
      errors[field] = rule.message || `${field} is required`;
      continue;
    }
    if (!missing && rule.test && !rule.test(value)) {
      errors[field] = rule.message || `${field} is invalid`;
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

module.exports = {
  validate,
  isEmail,
  isUsername,
  isPassword,
  isObjectId,
  isLevel,
  isQuestionType,
  isBoolean,
  isNumber,
  isArrayOfStrings,
  isUrl,
};
