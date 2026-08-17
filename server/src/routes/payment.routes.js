/**
 * 支付路由
 * 前缀 /api/payments
 */
const express = require('express');
const {
  listPlans,
  createOrder,
  getOrder,
  devPay,
  cancelOrder,
  confirmQrPayment,
  listOrders,
  verifyOrder,
  rejectOrder,
  wechatNotify,
  alipayNotify,
  stripeNotify,
  paypalCapture,
} = require('../controllers/payment.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 套餐（公开）
router.get('/plans', listPlans);

// 订单（需登录）
router.post('/orders', requireAuth, createOrder);
router.get('/orders', requireAuth, requireAdmin, listOrders);
router.get('/orders/:id', requireAuth, getOrder);
router.post('/orders/:id/pay', requireAuth, devPay);
router.post('/orders/:id/cancel', requireAuth, cancelOrder);
router.post('/orders/:id/confirm-qr', requireAuth, confirmQrPayment);

// 管理员审核订单
router.post('/orders/:id/verify', requireAuth, requireAdmin, verifyOrder);
router.post('/orders/:id/reject', requireAuth, requireAdmin, rejectOrder);

// 支付回调（商户服务器调用，不走登录）
router.post('/notify/wechat', wechatNotify);
router.post('/notify/alipay', alipayNotify);
router.post('/notify/stripe', express.raw({ type: 'application/json' }), stripeNotify);

// PayPal 订单捕获（前端支付成功后调用）
router.post('/orders/:id/capture-paypal', requireAuth, paypalCapture);

module.exports = router;
