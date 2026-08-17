/**
 * asyncHandler
 * 包装 async 路由处理器，把抛出的异常统一交给 next() 传入全局错误中间件，
 * 避免每个 controller 手写 try/catch。
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
