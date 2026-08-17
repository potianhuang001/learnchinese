/**
 * Plan 模型 — 会员套餐
 * - 按月/季/年订阅，price 单位为「分」（避免浮点误差）
 * - active 控制是否可购买，sortOrder 控制展示顺序
 */
const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Plan name is required'], trim: true },
    nameEn: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    descriptionEn: { type: String, default: '', trim: true },
    // 价格（分）
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    currency: { type: String, default: 'USD' },
    // 会员时长（天）
    durationDays: { type: Number, required: [true, 'Duration is required'], min: 1 },
    // 权益列表（展示用）
    features: { type: [String], default: [] },
    featuresEn: { type: [String], default: [] },
    badge: { type: String, default: '' },
    badgeEn: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
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

planSchema.index({ active: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', planSchema);
