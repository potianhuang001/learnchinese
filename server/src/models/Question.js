/**
 * Question 模型
 * - 练习题：单选 multiple_choice / 填空 fill_blank / 听力 listening
 * - correctAnswer 存答案字符串：选择题为选项原文，填空/听力为答案文本
 * - audioUrl 仅供听力题使用（音频可放占位 URL）
 */
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['multiple_choice', 'fill_blank', 'listening'],
      required: [true, 'Question type is required'],
    },
    prompt: { type: String, required: [true, 'Question prompt is required'], trim: true },
    // 选择题选项（其他题型为空数组）
    options: { type: [String], default: [] },
    correctAnswer: { type: String, required: [true, 'Correct answer is required'], trim: true },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    explanation: { type: String, default: '' },
    // 听力题专用音频地址
    audioUrl: { type: String, default: '' },
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

// 测验抽题常用查询：按 lessonId + type
questionSchema.index({ lessonId: 1, type: 1 });

module.exports = mongoose.model('Question', questionSchema);
