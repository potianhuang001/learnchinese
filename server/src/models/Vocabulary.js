/**
 * Vocabulary 模型
 * - 独立词汇表：用户收藏的目标集合（User.vocabulary 存储本集合的 _id）
 * - 同一词汇可被多门课程引用（lessonId 指向课程）
 */
const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema(
  {
    word: { type: String, required: [true, 'Word is required'], trim: true },
    pinyin: { type: String, required: [true, 'Pinyin is required'], trim: true },
    translation: { type: String, required: [true, 'Translation is required'], trim: true },
    example: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
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

// 同一课程下词汇不重复
vocabularySchema.index({ lessonId: 1, word: 1 }, { unique: true });

module.exports = mongoose.model('Vocabulary', vocabularySchema);
