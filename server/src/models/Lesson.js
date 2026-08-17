/**
 * Lesson 模型
 * - 课程按难度分级（beginner / intermediate / advanced），order 决定展示顺序
 * - content.vocabulary 为课程内的词汇快照（用于课程详情展示）
 * - 独立 Vocabulary 集合中的词条通过 lessonId 关联，供用户收藏
 * - quiz 关联本课程的小测验题目（Question 集合）
 */
const mongoose = require('mongoose');

// 课程内嵌词汇条目
const vocabularyItemSchema = new mongoose.Schema(
  {
    word: { type: String, required: [true, 'Word is required'], trim: true },
    pinyin: { type: String, required: [true, 'Pinyin is required'], trim: true },
    translation: { type: String, required: [true, 'Translation is required'], trim: true },
    example: { type: String, default: '' },
  },
  { _id: true },
);

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Lesson title is required'], trim: true },
    description: {
      type: String,
      required: [true, 'Lesson description is required'],
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: [true, 'Level is required'],
      index: true,
    },
    // 课程排序（同级内按 order 升序展示）
    order: { type: Number, required: [true, 'Order is required'], unique: true },
    content: {
      pinyin: { type: String, default: '' },
      characters: { type: String, default: '' },
      vocabulary: { type: [vocabularyItemSchema], default: [] },
      grammar: { type: String, default: '' },
      dialogue: { type: String, default: '' },
    },
    audioUrl: { type: String, default: '' },
    // 视频教学（手绘/实录视频，支持 MP4 / YouTube / B站 嵌入）
    video: {
      type: {
        type: String,
        enum: ['', 'mp4', 'youtube', 'bilibili'],
        default: '',
      },
      url: { type: String, default: '' },
      title: { type: String, default: '' },
    },
    // 关联的小测验题目
    quiz: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      default: [],
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

module.exports = mongoose.model('Lesson', lessonSchema);
