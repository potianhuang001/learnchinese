/**
 * Order 模型 — 会员订单
 * - provider: dev（开发模拟）/ wechat（微信支付）/ alipay（支付宝）
 * - 支付成功后回调将 status 置为 paid，并激活用户会员
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // 业务订单号（对外展示）
    orderNo: { type: String, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    // 下单时的套餐快照（防止套餐价格后续变动影响历史订单）
    planSnapshot: {
      name: { type: String, required: true },
      nameEn: { type: String, default: '' },
      price: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      durationDays: { type: Number, required: true },
    },
    amount: { type: Number, required: true, min: 0 }, // 分
    currency: { type: String, default: 'USD' },
    provider: { type: String, enum: ['dev', 'wechat', 'alipay', 'stripe', 'paypal', 'qr'], default: 'dev' },
    status: {
      type: String,
      enum: ['pending', 'awaiting_confirm', 'paid', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    // 支付渠道返回的交易号 / 支付参数
    providerTradeNo: { type: String, default: '' },
    providerInfo: { type: Object, default: {} },
    paidAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('Order', orderSchema);
