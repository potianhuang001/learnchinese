/**
 * 支付控制器
 * - GET   /api/payments/plans            套餐列表
 * - POST  /api/payments/orders           创建订单（返回支付参数）
 * - GET   /api/payments/orders/:id       查询订单
 * - POST  /api/payments/orders/:id/pay   开发模式模拟支付成功
 * - POST  /api/payments/orders/:id/cancel 取消订单
 * - POST  /api/payments/notify/wechat    微信支付回调（商户后台调用）
 * - POST  /api/payments/notify/alipay    支付宝回调（商户后台调用）
 */
const { User, Plan, Order } = require('../models');
const { success, error } = require('../utils/response');
const { isObjectId } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');

/** 套餐列表（仅返回 active 套餐） */
const listPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ active: true }).sort({ sortOrder: 1 }).lean();
  return success(res, { plans });
});

/** 创建订单：选套餐 → 生成订单 + 支付参数 */
const createOrder = asyncHandler(async (req, res) => {
  const { planId, provider } = req.body;
  if (!isObjectId(planId)) return error(res, 'Invalid plan id', 400);

  const plan = await Plan.findOne({ _id: planId, active: true });
  if (!plan) return error(res, 'Plan not found or inactive', 404);

  const order = await Order.create({
    orderNo: paymentService.genOrderNo(),
    user: req.user._id,
    plan: plan._id,
    planSnapshot: {
      name: plan.name,
      nameEn: plan.nameEn,
      price: plan.price,
      currency: plan.currency,
      durationDays: plan.durationDays,
    },
    amount: plan.price,
    currency: plan.currency,
    provider:
      provider === 'alipay'
        ? 'alipay'
        : provider === 'wechat'
          ? 'wechat'
          : provider === 'stripe'
            ? 'stripe'
            : provider === 'paypal'
              ? 'paypal'
              : 'dev',
  });

  // 生成支付参数（真实渠道未配置时自动降级 dev）
  const pay = await paymentService.createPayment(order);
  order.provider = pay.provider;
  order.providerInfo = pay.payParams;
  await order.save();

  return success(res, { order, pay }, 201);
});

/** 查询订单（仅本人或管理员） */
const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id).populate('plan', 'name nameEn durationDays');
  if (!order) return error(res, 'Order not found', 404);
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return error(res, 'Forbidden', 403);
  }
  return success(res, { order });
});

/** 用户提交二维码支付凭证（进入待审核） */
const confirmQrPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { payerName, note } = req.body;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  if (String(order.user) !== String(req.user._id)) return error(res, 'Forbidden', 403);
  if (order.status !== 'pending') return error(res, 'Order is not pending', 400);
  if (order.provider !== 'qr') return error(res, 'Order is not QR payment', 400);

  order.status = 'awaiting_confirm';
  order.providerInfo = {
    ...(order.providerInfo || {}),
    payerName: payerName || '',
    note: note || '',
    confirmedAt: new Date(),
  };
  await order.save();
  return success(res, { order });
});

/** 管理员：列出订单（支持按状态筛选） */
const listOrders = asyncHandler(async (req, res) => {
  const { status = '', page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'username email')
      .populate('plan', 'name nameEn durationDays')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return success(res, {
    orders,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
  });
});

/** 管理员：确认收款并开通会员 */
const verifyOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  if (order.status === 'paid') return success(res, { order });
  if (order.status !== 'pending' && order.status !== 'awaiting_confirm') {
    return error(res, 'Order cannot be verified', 400);
  }

  await settlePaidOrder(order, order.provider, `QR-${Date.now()}`);
  return success(res, { order: await Order.findById(id).populate('plan', 'name nameEn') });
});

/** 管理员：驳回订单 */
const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  if (order.status !== 'pending' && order.status !== 'awaiting_confirm') {
    return error(res, 'Order cannot be rejected', 400);
  }

  order.status = 'cancelled';
  order.providerInfo = {
    ...(order.providerInfo || {}),
    rejectReason: reason || 'Rejected by admin',
    rejectedAt: new Date(),
  };
  await order.save();
  return success(res, { order });
});

/** 开发模式模拟支付成功（PAYMENT_MODE=dev 时调用） */
const devPay = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id).populate('plan');
  if (!order) return error(res, 'Order not found', 404);
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return error(res, 'Forbidden', 403);
  }
  if (order.status !== 'pending') return error(res, 'Order is not pending', 400);

  await settlePaidOrder(order, 'dev', `DEV${Date.now()}`);
  return success(res, { order: await Order.findById(id) });
});

/** 取消订单 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return error(res, 'Invalid order id', 400);

  const order = await Order.findById(id);
  if (!order) return error(res, 'Order not found', 404);
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return error(res, 'Forbidden', 403);
  }
  if (order.status !== 'pending') return error(res, 'Order is not pending', 400);

  order.status = 'cancelled';
  await order.save();
  return success(res, { order });
});

/* ---------------- 回调 ---------------- */

/** 订单支付成功后的统一结算：更新订单 + 激活会员 */
async function settlePaidOrder(order, provider, providerTradeNo) {
  const plan = await Plan.findById(order.plan);
  if (!plan) throw new Error('Plan not found during settlement');

  order.status = 'paid';
  order.provider = provider;
  order.providerTradeNo = providerTradeNo;
  order.paidAt = new Date();
  await order.save();

  // 激活 / 顺延会员
  const user = await User.findById(order.user);
  if (!user) return;
  const now = new Date();
  let base = now;
  if (user.membership?.status === 'active' && user.membership.expiresAt > now) {
    base = new Date(user.membership.expiresAt); // 续费顺延
  }
  user.membership = {
    planId: plan._id,
    status: 'active',
    startedAt:
      user.membership?.status === 'active' && user.membership.startedAt
        ? user.membership.startedAt
        : now,
    expiresAt: new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000),
  };
  await user.save();
}

/** 微信支付回调（APIv3） */
const wechatNotify = asyncHandler(async (req, res) => {
  if (paymentService.resolveProvider('wechat') !== 'wechat') {
    // 未配置真实微信支付：直接应答成功避免商户重试
    return res.json({ code: 'SUCCESS', message: 'OK' });
  }
  const event = paymentService.verifyWechatNotify(req.body, req.headers);
  if (!event) return res.status(401).json({ code: 'FAIL', message: 'signature error' });

  const { out_trade_no: outTradeNo, transaction_id: tradeNo, trade_state: state } =
    event.resource?.plaintext || event;
  if (state && state !== 'SUCCESS') return res.json({ code: 'SUCCESS', message: 'OK' });

  const order = await Order.findOne({ orderNo: outTradeNo });
  if (!order) return res.status(404).json({ code: 'FAIL', message: 'order not found' });
  if (order.status === 'paid') return res.json({ code: 'SUCCESS', message: 'OK' }); // 幂等

  await settlePaidOrder(order, 'wechat', tradeNo || '');
  return res.json({ code: 'SUCCESS', message: 'OK' });
});

/** 支付宝异步回调 */
const alipayNotify = asyncHandler(async (req, res) => {
  if (paymentService.resolveProvider('alipay') !== 'alipay') {
    return res.send('success');
  }
  const params = req.body;
  if (!paymentService.verifyAlipayNotify(params)) return res.status(401).send('fail');

  const order = await Order.findOne({ orderNo: params.out_trade_no });
  if (!order) return res.status(404).send('fail');
  if (order.status === 'paid') return res.send('success');

  if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
    await settlePaidOrder(order, 'alipay', params.trade_no || '');
  }
  return res.send('success');
});

/** Stripe webhook */
const stripeNotify = asyncHandler(async (req, res) => {
  if (paymentService.resolveProvider('stripe') !== 'stripe') {
    return res.json({ received: true });
  }
  const sig = req.headers['stripe-signature'];
  // Use rawBody for signature verification (captured by express.json verify hook)
  const event = paymentService.verifyStripeNotify(req.rawBody || JSON.stringify(req.body), sig);
  if (!event) return res.status(400).json({ error: 'Invalid signature' });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = await Order.findOne({ orderNo: session.client_reference_id });
    if (order && order.status !== 'paid') {
      await settlePaidOrder(order, 'stripe', session.payment_intent || session.id);
    }
  }
  return res.json({ received: true });
});

/** PayPal 支付成功后跳转回前端，前端再调用此接口捕获订单 */
const paypalCapture = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params;
  const { paypalOrderId } = req.body;
  if (!isObjectId(orderId) || !paypalOrderId) {
    return error(res, 'Invalid order or paypal order id', 400);
  }
  const order = await Order.findById(orderId);
  if (!order) return error(res, 'Order not found', 404);
  if (String(order.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return error(res, 'Forbidden', 403);
  }
  if (order.status === 'paid') return success(res, { order });

  const capture = await paymentService.capturePayPalOrder(paypalOrderId);
  if (capture.status === 'COMPLETED') {
    await settlePaidOrder(order, 'paypal', paypalOrderId);
    return success(res, { order: await Order.findById(orderId) });
  }
  return error(res, 'PayPal capture failed', 400);
});

module.exports = {
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
};
