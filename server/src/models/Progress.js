/**
 * Progress 模型
 * - 用户学习进度的详细记录（含学习时长 timeSpent，单位：秒）
 * - 同一 (userId, lessonId) 组合唯一，多次练习做累计更新
 * - User.progress 中的内嵌快照与本集合保持同步（由 API 层维护）
 */
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    completed: { type: Boolean, default: false },
    score: { type: Number, min: 0, max: 100, default: 0 },
    timeSpent: { type: Number, min: 0, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
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

// 每个用户对每门课程只有一条进度记录
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
