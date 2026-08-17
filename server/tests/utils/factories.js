/**
 * 测试数据工厂
 * 提供创建 User / Lesson / Question / Vocabulary 的快捷方法，
 * 以及登录辅助函数，让集成测试保持简洁。
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { User, Lesson, Question, Vocabulary } = require('../../src/models');
const { signToken } = require('../../src/utils/jwt');

/** 生成一个唯一的测试邮箱（避免用例间唯一索引冲突） */
function uniqueEmail(prefix = 'user') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/**
 * 创建用户（写入数据库）
 * @param {object} overrides 覆盖默认字段，如 { role: 'admin', isDisabled: true }
 * @returns {Promise<{ user: User, password: string, token: string }>}
 */
async function createUser(overrides = {}) {
  const password = overrides.password || 'password123';
  const data = {
    username: `tester_${Math.random().toString(36).slice(2, 8)}`,
    email: uniqueEmail(),
    passwordHash: await bcrypt.hash(password, 4), // 测试用低 cost 加速
    role: 'user',
    isDisabled: false,
    progress: [],
    vocabulary: [],
    ...overrides,
  };
  const user = await User.create(data);
  const token = signToken(user._id.toString(), user.role);
  return { user, password, token };
}

/**
 * 创建课程（写入数据库）
 * @param {object} overrides 覆盖默认字段
 * @returns {Promise<Lesson>}
 */
async function createLesson(overrides = {}) {
  const seq = Math.floor(Math.random() * 100000);
  const data = {
    title: `Lesson ${seq}`,
    description: 'Test lesson description',
    level: 'beginner',
    order: seq,
    content: {
      pinyin: 'nǐ hǎo',
      characters: '你好',
      vocabulary: [
        { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello', example: '你好！' },
      ],
      grammar: 'Basic greeting.',
      dialogue: 'A: 你好！ B: 你好！',
    },
    audioUrl: '',
    quiz: [],
    ...overrides,
  };
  return Lesson.create(data);
}

/**
 * 创建题目（写入数据库）
 * @param {object} overrides 覆盖默认字段（lessonId 必传）
 * @returns {Promise<Question>}
 */
async function createQuestion(overrides = {}) {
  const data = {
    type: 'multiple_choice',
    prompt: 'What does 你好 mean?',
    options: ['hello', 'goodbye', 'thanks', 'sorry'],
    correctAnswer: 'hello',
    lessonId: overrides.lessonId,
    explanation: '你好 means hello.',
    audioUrl: '',
    ...overrides,
  };
  return Question.create(data);
}

/**
 * 创建独立词汇（写入 Vocabulary 集合，供收藏测试）
 * @param {object} overrides 覆盖默认字段（lessonId 必传）
 * @returns {Promise<Vocabulary>}
 */
async function createVocabulary(overrides = {}) {
  const data = {
    word: '学习',
    pinyin: 'xuéxí',
    translation: 'to study',
    example: '我在学习中文。',
    audioUrl: '',
    lessonId: overrides.lessonId,
    ...overrides,
  };
  return Vocabulary.create(data);
}

/**
 * 通过 API 注册新用户（返回响应体，用于认证流程测试）
 * @param {object} payload 注册请求体
 */
async function registerViaApi(request, payload) {
  return request.post('/api/auth/register').send(payload);
}

/** 通过 API 登录（返回响应体） */
async function loginViaApi(request, payload) {
  return request.post('/api/auth/login').send(payload);
}

/** 生成一个合法的 ObjectId（供不存在资源的用例使用） */
function randomObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

module.exports = {
  uniqueEmail,
  createUser,
  createLesson,
  createQuestion,
  createVocabulary,
  registerViaApi,
  loginViaApi,
  randomObjectId,
};
