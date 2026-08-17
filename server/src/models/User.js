/**
 * User 模型
 * - 用户账号：注册/登录、角色区分（user / admin）、学习进度、词汇收藏
 * - passwordHash 在序列化（toJSON）时自动剔除，避免泄露
 */
const mongoose = require('mongoose');

// 用户的学习进度快照（冗余缓存，便于个人中心快速展示）
// 详细记录（含 timeSpent）保存在独立的 Progress 集合中
const progressEntrySchema = new mongoose.Schema(
  {
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    completed: { type: Boolean, default: false },
    score: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w.+-]+@[\w-]+\.[\w.-]+$/, 'Please provide a valid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // 管理端可禁用用户（登录时校验）
    isDisabled: { type: Boolean, default: false },
    // 学习进度快照（lessonId -> completed/score/lastAccessed）
    progress: { type: [progressEntrySchema], default: [] },
    // 收藏的词汇（关联 Vocabulary 集合）
    vocabulary: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' }],
      default: [],
    },
    // 会员信息（付费订阅）
    membership: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
      status: { type: String, enum: ['none', 'active', 'expired'], default: 'none' },
      startedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// 索引：username / email 唯一索引由字段定义自动创建
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
