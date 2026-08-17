/**
 * 种子数据脚本（内容完全版）
 * - 创建管理员账号（env 中配置，默认 admin / admin123456）
 * - 完整课程体系 24 节：初级 10（免费）/ 中级 8 / 高级 6
 * - 会员套餐：月卡 $4.99 / 季卡 $11.99 / 年卡 $29.99（USD cents）
 * - 幂等：默认按 order 去重；`node src/seed/seed.js --reset` 重建课程数据
 *
 * 用法：node src/seed/seed.js [--reset]
 */
/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue -- 顺序执行的数据脚本，逐条 await 是必要且清晰的 */

const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const { User, Lesson, Question, Vocabulary, Progress, Plan } = require('../models');

const RESET = process.argv.includes('--reset');

/* ---------------- 会员套餐（价格单位：USD cents） ---------------- */

const plansData = [
  {
    name: '月卡',
    nameEn: 'Monthly',
    description: '按月订阅，随时取消',
    descriptionEn: 'Pay monthly, cancel anytime',
    price: 499,
    durationDays: 30,
    badge: '',
    features: ['解锁全部中级/高级课程', '视频教学与手绘笔顺动画', '全部练习与单元测验', '学习进度完整记录'],
    featuresEn: [
      'Unlock all intermediate & advanced lessons',
      'Video lessons & hand-drawn stroke animations',
      'All practice exercises and unit quizzes',
      'Full learning progress tracking',
    ],
    sortOrder: 1,
  },
  {
    name: '季卡',
    nameEn: 'Quarterly',
    description: '三个月会员，立省 20%',
    descriptionEn: '3 months, save 20%',
    price: 1199,
    durationDays: 90,
    badge: '热卖',
    badgeEn: 'Popular',
    features: ['解锁全部中级/高级课程', '视频教学与手绘笔顺动画', '全部练习与单元测验', '学习进度完整记录'],
    featuresEn: [
      'Unlock all intermediate & advanced lessons',
      'Video lessons & hand-drawn stroke animations',
      'All practice exercises and unit quizzes',
      'Full learning progress tracking',
    ],
    sortOrder: 2,
  },
  {
    name: '年卡',
    nameEn: 'Yearly',
    description: '一年会员，立省 50%',
    descriptionEn: '12 months, save 50%',
    price: 2999,
    durationDays: 365,
    badge: '最划算',
    badgeEn: 'Best Value',
    features: ['解锁全部中级/高级课程', '视频教学与手绘笔顺动画', '全部练习与单元测验', '学习进度完整记录', '新课程优先体验'],
    featuresEn: [
      'Unlock all intermediate & advanced lessons',
      'Video lessons & hand-drawn stroke animations',
      'All practice exercises and unit quizzes',
      'Full learning progress tracking',
      'Early access to new lessons',
    ],
    sortOrder: 3,
  },
];

/* ---------------- 完整课程体系（24 节） ---------------- */

const BILI_INTRO = {
  type: 'bilibili',
  url: 'https://www.bilibili.com/video/BV1A1ojYiEe7/',
  title: '自我介绍示范视频',
};
const BILI_DAY = {
  type: 'bilibili',
  url: 'https://www.bilibili.com/video/BV1DW411Q75u/',
  title: '我的一天（Vlog 示范）',
};

const lessonsData = [
  /* ================ 初级 Beginner（order 1-10，免费） ================ */
  {
    title: 'Greetings & Introductions',
    description: 'Say hello, introduce yourself, and ask names — your very first Chinese conversation.',
    level: 'beginner',
    order: 1,
    content: {
      pinyin: 'nǐ hǎo, wǒ jiào...',
      characters: '你好，我叫……',
      vocabulary: [
        { word: '你', pinyin: 'nǐ', translation: 'you', example: '你好！' },
        { word: '好', pinyin: 'hǎo', translation: 'good', example: '你好！' },
        { word: '我', pinyin: 'wǒ', translation: 'I / me', example: '我叫李华。' },
        { word: '叫', pinyin: 'jiào', translation: 'to be called', example: '你叫什么名字？' },
        { word: '名字', pinyin: 'míngzi', translation: 'name', example: '你叫什么名字？' },
      ],
      grammar:
        'Basic word order: Subject + Verb + Object. 我叫李华 (Wǒ jiào Lǐ Huá) = "I am called Li Hua."\n' +
        'The particle 吗 (ma) turns any statement into a yes/no question: 你好吗？(How are you?)',
      dialogue: 'A: 你好！我叫李华。你叫什么名字？\nB: 你好！我叫 Amy。\nA: 你好吗？\nB: 我很好，谢谢！',
    },
    video: BILI_INTRO,
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'How do you say "Hello" in Chinese?',
        options: ['再见', '你好', '谢谢', '对不起'],
        correctAnswer: '你好',
        explanation: '你好 (nǐ hǎo) means hello.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which sentence means "My name is Li Hua"?',
        options: ['我叫李华', '你好李华', '李华是谁', '我爱李华'],
        correctAnswer: '我叫李华',
        explanation: '我叫李华 = I am called Li Hua.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 你___什么名字？(What is your name?)',
        options: [],
        correctAnswer: '叫',
        explanation: '叫 (jiào) means "to be called".',
      },
    ],
  },
  {
    title: 'Numbers 1-10 & Asking Prices',
    description: 'Count from 1 to 10, build bigger numbers, and ask how much things cost.',
    level: 'beginner',
    order: 2,
    content: {
      pinyin: 'yī, èr, sān, sì, wǔ, liù, qī, bā, jiǔ, shí',
      characters: '一二三四五六七八九十',
      vocabulary: [
        { word: '一', pinyin: 'yī', translation: 'one', example: '一个苹果' },
        { word: '二', pinyin: 'èr', translation: 'two', example: '两个杯子' },
        { word: '五', pinyin: 'wǔ', translation: 'five', example: '五块钱' },
        { word: '十', pinyin: 'shí', translation: 'ten', example: '十块钱' },
        { word: '多少', pinyin: 'duōshao', translation: 'how much / how many', example: '这个多少钱？' },
        { word: '钱', pinyin: 'qián', translation: 'money', example: '多少钱？' },
      ],
      grammar:
        'Numbers 11-19 = 十 + digit (十一 = 11, 十五 = 15). Tens are digit + 十 (二十 = 20, 二十五 = 25).\n' +
        '"How much?" = 多少钱？Answer with number + 块 (kuài, colloquial measure for yuan): 三块钱。',
      dialogue: 'A: 这个苹果多少钱？\nB: 三块钱。\nA: 好，我要两个。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'What number is 五?',
        options: ['5', '6', '4', '10'],
        correctAnswer: '5',
        explanation: '五 (wǔ) = five.',
      },
      {
        type: 'multiple_choice',
        prompt: 'How do you ask "How much does it cost?"',
        options: ['多少钱？', '叫什么？', '在哪里？', '你好吗？'],
        correctAnswer: '多少钱？',
        explanation: '多少钱 (duōshao qián) = how much money.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 这个苹果三___钱。(The apple is 3 yuan.)',
        options: [],
        correctAnswer: '块',
        explanation: '块 (kuài) is the colloquial measure word for yuan.',
      },
    ],
  },
  {
    title: 'The Four Tones of Mandarin',
    description: 'Master the four tones with minimal pairs — the foundation of clear pronunciation.',
    level: 'beginner',
    order: 3,
    content: {
      pinyin: 'tiān / lái / hǎo / shì',
      characters: '天 · 来 · 好 · 是',
      vocabulary: [
        { word: '天', pinyin: 'tiān', translation: 'day / sky (1st tone, high & flat)', example: '今天' },
        { word: '来', pinyin: 'lái', translation: 'to come (2nd tone, rising)', example: '请来！' },
        { word: '好', pinyin: 'hǎo', translation: 'good (3rd tone, dip & rise)', example: '你好！' },
        { word: '是', pinyin: 'shì', translation: 'to be (4th tone, falling)', example: '我是学生。' },
        { word: '练', pinyin: 'liàn', translation: 'to practice (4th tone)', example: '每天练习。' },
      ],
      grammar:
        'Tone 1 (ā): high and flat, like singing a note.\n' +
        'Tone 2 (á): rising, like asking "huh?"\n' +
        'Tone 3 (ǎ): dips down then rises.\n' +
        'Tone 4 (à): sharp fall, like a firm "No!"\n' +
        'Neutral tone (a): light and quick, common on second syllables (谢谢 xièxie).',
      dialogue: 'A: 天 (tiān) — sky, first tone.\nB: 天，天，天。\nA: 好 (hǎo) — good, third tone.\nB: 好，好，好！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'Which tone is high and flat?',
        options: ['1st tone (ā)', '2nd tone (á)', '3rd tone (ǎ)', '4th tone (à)'],
        correctAnswer: '1st tone (ā)',
        explanation: 'The 1st tone is held high and flat.',
      },
      {
        type: 'multiple_choice',
        prompt: 'What tone does 好 (hǎo) have?',
        options: ['1st', '2nd', '3rd', '4th'],
        correctAnswer: '3rd',
        explanation: '好 is third tone: dips down, then rises.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the tone mark: 来 (l_i, to come) is 2nd tone.',
        options: [],
        correctAnswer: 'á',
        explanation: 'lái — rising second tone.',
      },
    ],
  },
  {
    title: 'Question Words: What, Who, Where',
    description: 'Ask anything with the five essential question words 什么 / 谁 / 哪 / 怎么 / 多少.',
    level: 'beginner',
    order: 4,
    content: {
      pinyin: 'zhè shì shénme?',
      characters: '这是什么？',
      vocabulary: [
        { word: '什么', pinyin: 'shénme', translation: 'what', example: '这是什么？' },
        { word: '谁', pinyin: 'shéi', translation: 'who', example: '他是谁？' },
        { word: '哪', pinyin: 'nǎ', translation: 'which', example: '哪个好？' },
        { word: '怎么', pinyin: 'zěnme', translation: 'how', example: '怎么说？' },
        { word: '多少', pinyin: 'duōshao', translation: 'how much', example: '多少钱？' },
      ],
      grammar:
        'Question words stay in the sentence where the answer would go — no word order change needed!\n' +
        '这是什么？= What is this? → 这是苹果。(This is an apple.)\n' +
        'Note: with question words you never add 吗.',
      dialogue: 'A: 这是什么？\nB: 这是苹果。\nA: 哪个是水？\nB: 这个。\nA: 多少钱？\nB: 两块钱。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'Which word means "who"?',
        options: ['谁', '什么', '哪', '怎么'],
        correctAnswer: '谁',
        explanation: '谁 (shéi) = who.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 这是什么意思？怎么___？(How do you say it?)',
        options: [],
        correctAnswer: '说',
        explanation: '怎么说 (zěnme shuō) = how do you say.',
      },
      {
        type: 'multiple_choice',
        prompt: '"多少钱？" asks about...',
        options: ['price', 'time', 'name', 'place'],
        correctAnswer: 'price',
        explanation: '多少钱 = how much money / what price.',
      },
    ],
  },
  {
    title: 'Polite Expressions',
    description: 'Thank, apologize, and say goodbye like a native — the keys to smooth conversations.',
    level: 'beginner',
    order: 5,
    content: {
      pinyin: 'xièxie! duìbuqǐ. zàijiàn!',
      characters: '谢谢！对不起。再见。',
      vocabulary: [
        { word: '谢谢', pinyin: 'xièxie', translation: 'thank you', example: '谢谢你！' },
        { word: '请', pinyin: 'qǐng', translation: 'please', example: '请坐。' },
        { word: '对不起', pinyin: 'duìbuqǐ', translation: 'sorry', example: '对不起，我晚了。' },
        { word: '再见', pinyin: 'zàijiàn', translation: 'goodbye', example: '明天见！再见！' },
        { word: '不客气', pinyin: 'bú kèqi', translation: "you're welcome", example: 'A:谢谢！ B:不客气。' },
      ],
      grammar:
        '谢谢 → 不客气 (thanks → you are welcome)\n' +
        '对不起 → 没关系 (sorry → it does not matter)\n' +
        'Add 好 in 你好，明天 in 明天见 (see you tomorrow) to make farewells warmer.',
      dialogue: 'A: 谢谢你！\nB: 不客气。\nA: 对不起，我来晚了。\nB: 没关系。\nA: 再见！\nB: 再见，明天见！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'Someone says 谢谢 to you. The polite reply is...',
        options: ['不客气', '对不起', '再见', '你好'],
        correctAnswer: '不客气',
        explanation: '不客气 = you are welcome.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which phrase means "sorry"?',
        options: ['对不起', '不客气', '谢谢', '再见'],
        correctAnswer: '对不起',
        explanation: '对不起 (duìbuqǐ) = sorry.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 明天___！(See you tomorrow!)',
        options: [],
        correctAnswer: '见',
        explanation: '明天见 = see you tomorrow.',
      },
    ],
  },
  {
    title: 'Food & Drinks',
    description: 'Name everyday foods and drinks, and say what you want to eat and drink.',
    level: 'beginner',
    order: 6,
    content: {
      pinyin: 'wǒ yào hē shuǐ',
      characters: '我要喝水。',
      vocabulary: [
        { word: '吃', pinyin: 'chī', translation: 'to eat', example: '我要吃饭。' },
        { word: '喝', pinyin: 'hē', translation: 'to drink', example: '我要喝水。' },
        { word: '水', pinyin: 'shuǐ', translation: 'water', example: '一杯水' },
        { word: '苹果', pinyin: 'píngguǒ', translation: 'apple', example: '一个苹果' },
        { word: '米饭', pinyin: 'mǐfàn', translation: 'cooked rice', example: '我要米饭。' },
        { word: '菜', pinyin: 'cài', translation: 'dish / vegetable', example: '这个菜好吃。' },
      ],
      grammar:
        '要 (yào) = want: 我要水 (I want water), 我要吃饭 (I want to eat).\n' +
        'Measure words: 一杯水 (a glass of water), 一个苹果 (an apple), 一碗米饭 (a bowl of rice).',
      dialogue: 'A: 你要吃什么？\nB: 我要米饭和菜。\nA: 要喝水吗？\nB: 好，一杯水，谢谢！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"我要喝水" means...',
        options: ['I want to drink water', 'I want to eat rice', 'I like apples', 'This is water'],
        correctAnswer: 'I want to drink water',
        explanation: '喝 (hē) = drink, 水 (shuǐ) = water.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 一___水 (a glass of water).',
        options: [],
        correctAnswer: '杯',
        explanation: '杯 (bēi) is the measure word for cups/glasses.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "rice (cooked)"?',
        options: ['米饭', '菜', '水', '苹果'],
        correctAnswer: '米饭',
        explanation: '米饭 (mǐfàn) = cooked rice.',
      },
    ],
  },
  {
    title: 'Telling the Time',
    description: 'Read clocks, say the time, and use 上午 / 中午 / 下午 like a local.',
    level: 'beginner',
    order: 7,
    content: {
      pinyin: 'xiànzài jǐ diǎn?',
      characters: '现在几点？',
      vocabulary: [
        { word: '点', pinyin: 'diǎn', translation: "o'clock", example: '三点' },
        { word: '半', pinyin: 'bàn', translation: 'half past', example: '三点半' },
        { word: '上午', pinyin: 'shàngwǔ', translation: 'morning (before noon)', example: '上午九点' },
        { word: '中午', pinyin: 'zhōngwǔ', translation: 'noon', example: '中午十二点' },
        { word: '下午', pinyin: 'xiàwǔ', translation: 'afternoon', example: '下午三点' },
      ],
      grammar:
        '现在几点？= What time is it? Answer: 三点 (3:00), 三点半 (3:30), 三点十五 (3:15).\n' +
        '2:45 is expressed as 差一刻三点 (a quarter to three) in formal speech, or simply 两点四十五.',
      dialogue: 'A: 现在几点？\nB: 十点半。\nA: 中午吃什么？\nB: 十二点吃饭，下午去上课。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"三点半" means...',
        options: ['3:30', '3:00', '3:15', '3:45'],
        correctAnswer: '3:30',
        explanation: '半 (bàn) = half past.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 现在几___？(What time is it?)',
        options: [],
        correctAnswer: '点',
        explanation: '点 (diǎn) is the hour unit.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "afternoon"?',
        options: ['下午', '上午', '中午', '半天'],
        correctAnswer: '下午',
        explanation: '下午 (xiàwǔ) = afternoon.',
      },
    ],
  },
  {
    title: 'Days, Weeks & Dates',
    description: 'Talk about today, tomorrow, and weekend plans using days of the week.',
    level: 'beginner',
    order: 8,
    content: {
      pinyin: 'jīntiān xīngqīsān',
      characters: '今天星期三。',
      vocabulary: [
        { word: '今天', pinyin: 'jīntiān', translation: 'today', example: '今天星期三。' },
        { word: '明天', pinyin: 'míngtiān', translation: 'tomorrow', example: '明天见！' },
        { word: '后天', pinyin: 'hòutiān', translation: 'the day after tomorrow', example: '后天去上课。' },
        { word: '周', pinyin: 'zhōu', translation: 'week', example: '下周 / 周一' },
        { word: '日', pinyin: 'rì', translation: 'day / date', example: '十月一日' },
      ],
      grammar:
        'Days: 星期一/周一 (Mon) ... 星期六/周六 (Sat), 星期天/周日 (Sun).\n' +
        'Dates: month + 日/号 — 十月一日 (Oct 1st). 号 (hào) is more colloquial than 日.',
      dialogue: 'A: 今天星期几？\nB: 今天星期三。\nA: 明天有空吗？\nB: 有！明天见。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"星期三" means...',
        options: ['Wednesday', 'Tuesday', 'Thursday', 'Sunday'],
        correctAnswer: 'Wednesday',
        explanation: '星期三 (xīngqīsān) = Wednesday.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 明___见！(See you tomorrow!)',
        options: [],
        correctAnswer: '天',
        explanation: '明天 (míngtiān) = tomorrow.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which phrase means "next week"?',
        options: ['下周', '今天', '后天', '周日'],
        correctAnswer: '下周',
        explanation: '下周 (xiàzhōu) = next week.',
      },
    ],
  },
  {
    title: 'Weather & Seasons',
    description: 'Describe sunny, rainy, hot and cold days — perfect for small talk.',
    level: 'beginner',
    order: 9,
    content: {
      pinyin: 'jīntiān hěn rè',
      characters: '今天很热。',
      vocabulary: [
        { word: '天气', pinyin: 'tiānqì', translation: 'weather', example: '今天天气好。' },
        { word: '热', pinyin: 'rè', translation: 'hot', example: '今天很热。' },
        { word: '下雨', pinyin: 'xiàyǔ', translation: 'to rain', example: '今天下雨。' },
        { word: '季', pinyin: 'jì', translation: 'season', example: '四个季节' },
        { word: '气', pinyin: 'qì', translation: 'air / atmosphere', example: '天气' },
      ],
      grammar:
        '很 (hěn) links adjectives: 今天很热 (Today is hot). No 是 needed!\n' +
        'Common mistake: ✗ 今天是热 → ✓ 今天很热。',
      dialogue: 'A: 今天天气怎么样？\nB: 很好！不冷不热。\nA: 明天呢？\nB: 明天可能下雨。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'Which is correct for "Today is hot"?',
        options: ['今天很热', '今天是热', '热今天', '今天热是'],
        correctAnswer: '今天很热',
        explanation: 'Use 很 (not 是) to link subject and adjective.',
      },
      {
        type: 'multiple_choice',
        prompt: '"天气" means...',
        options: ['weather', 'sky', 'air', 'season'],
        correctAnswer: 'weather',
        explanation: '天气 (tiānqì) = weather.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 今天很___。(Today is very hot.)',
        options: [],
        correctAnswer: '热',
        explanation: '热 (rè) = hot.',
      },
    ],
  },
  {
    title: 'Shopping Basics',
    description: 'Ask prices, count money, and complete simple purchases with 要 / 给 / 块.',
    level: 'beginner',
    order: 10,
    content: {
      pinyin: 'wǒ yào yí gè',
      characters: '我要这个。',
      vocabulary: [
        { word: '要', pinyin: 'yào', translation: 'to want', example: '我要这个。' },
        { word: '给', pinyin: 'gěi', translation: 'to give', example: '给我两个。' },
        { word: '块', pinyin: 'kuài', translation: 'yuan (colloquial)', example: '五块钱' },
        { word: '卖', pinyin: 'mài', translation: 'to sell', example: '这里卖苹果。' },
        { word: '钱', pinyin: 'qián', translation: 'money', example: '给钱。' },
      ],
      grammar:
        '我要…… = I want ... (most useful shopping phrase)\n' +
        '给我 + number + measure word + noun: 给我两个苹果。\n' +
        'Here you can pay cash or scan: 可以给钱，也可以扫码。',
      dialogue: 'A: 这个多少钱？\nB: 五块钱。\nA: 好，我要两个。给，十块。\nB: 谢谢！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"给我两个" means...',
        options: ['Give me two', 'I want money', 'Two yuan', 'Sell me two'],
        correctAnswer: 'Give me two',
        explanation: '给 (gěi) = give, 两个 = two.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我___这个。(I want this one.)',
        options: [],
        correctAnswer: '要',
        explanation: '要 (yào) = to want.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "to sell"?',
        options: ['卖', '买', '给', '要'],
        correctAnswer: '卖',
        explanation: '卖 (mài) = to sell. Tip: 卖 has "more" on top — selling out.',
      },
    ],
  },

  /* ================ 中级 Intermediate（order 11-18，会员） ================ */
  {
    title: 'Daily Routines & Schedules',
    description: 'Narrate your whole day: waking up, work, meals, and bedtime.',
    level: 'intermediate',
    order: 11,
    content: {
      pinyin: 'wǒ měitiān qī diǎn qǐchuáng',
      characters: '我每天七点起床。',
      vocabulary: [
        { word: '每天', pinyin: 'měitiān', translation: 'every day', example: '我每天七点起床。' },
        { word: '起床', pinyin: 'qǐchuáng', translation: 'to get up', example: '我七点起床。' },
        { word: '上班', pinyin: 'shàngbān', translation: 'to go to work', example: '我八点上班。' },
        { word: '睡觉', pinyin: 'shuìjiào', translation: 'to sleep', example: '我十一点睡觉。' },
        { word: '时间', pinyin: 'shíjiān', translation: 'time', example: '没有时间。' },
        { word: '累', pinyin: 'lèi', translation: 'tired', example: '今天很累。' },
      ],
      grammar:
        'Frequency words (每天, 常常, 有时候) go before the verb: 我每天七点起床。\n' +
        'Sequence a day with 先……然后……最后…… (first... then... finally...).',
      dialogue: 'A: 你每天几点起床？\nB: 我每天七点起床，八点上班。\nA: 晚上呢？\nB: 先吃晚饭，然后看书，最后十一点睡觉。',
    },
    video: BILI_DAY,
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"我每天七点起床" means...',
        options: ['I get up at 7 every day', 'I sleep at 7', 'I go to work at 7', 'I eat at 7'],
        correctAnswer: 'I get up at 7 every day',
        explanation: '每天 = every day, 七点 = 7 o\'clock, 起床 = get up.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我十一点___。(I sleep at 11.)',
        options: [],
        correctAnswer: '睡觉',
        explanation: '睡觉 (shuìjiào) = to sleep.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "tired"?',
        options: ['累', '忙', '饿', '高兴'],
        correctAnswer: '累',
        explanation: '累 (lèi) = tired.',
      },
    ],
  },
  {
    title: 'Ordering in a Restaurant',
    description: 'Order dishes, call the waiter, and pay the bill with confidence.',
    level: 'intermediate',
    order: 12,
    content: {
      pinyin: 'fúwùyuán, diǎn cài!',
      characters: '服务员，点菜！',
      vocabulary: [
        { word: '菜单', pinyin: 'càidān', translation: 'menu', example: '请给我菜单。' },
        { word: '点菜', pinyin: 'diǎn cài', translation: 'to order food', example: '我们点菜吧。' },
        { word: '好吃', pinyin: 'hǎochī', translation: 'delicious', example: '这个很好吃！' },
        { word: '服务员', pinyin: 'fúwùyuán', translation: 'waiter / server', example: '服务员，买单！' },
        { word: '碗', pinyin: 'wǎn', translation: 'bowl (measure)', example: '一碗面' },
        { word: '账', pinyin: 'zhàng', translation: 'bill / account', example: '结账！' },
      ],
      grammar:
        'Polite requests: 请给我菜单 (please give me the menu).\n' +
        'We-form suggestion with 吧: 我们点菜吧 (let\'s order).\n' +
        'Paying: 买单 / 结账 both mean "check please".',
      dialogue: 'A: 服务员，请给我菜单。\nB: 好的。\nA: 我们要一碗面、两个菜。\nB: 好的，马上来。\nA: （吃完）买单！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"我要一碗面" means...',
        options: ['I want a bowl of noodles', 'I want a cup of tea', 'I want the menu', 'I want to pay'],
        correctAnswer: 'I want a bowl of noodles',
        explanation: '一碗面 = one bowl of noodles.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 请给我菜___。(Please give me the menu.)',
        options: [],
        correctAnswer: '单',
        explanation: '菜单 (càidān) = menu.',
      },
      {
        type: 'multiple_choice',
        prompt: 'How do you call for the bill?',
        options: ['买单！', '点菜！', '好吃！', '菜单！'],
        correctAnswer: '买单！',
        explanation: '买单 (mǎidān) = bill please.',
      },
    ],
  },
  {
    title: 'Getting Around: Transport',
    description: 'Take taxis and subways, and understand directions on the move.',
    level: 'intermediate',
    order: 13,
    content: {
      pinyin: 'qǐng dào huǒchēzhàn',
      characters: '请到火车站。',
      vocabulary: [
        { word: '车', pinyin: 'chē', translation: 'vehicle / car', example: '打车 / 火车' },
        { word: '站', pinyin: 'zhàn', translation: 'station / stop', example: '到站了。' },
        { word: '到', pinyin: 'dào', translation: 'to arrive', example: '到火车站。' },
        { word: '左转', pinyin: 'zuǒzhuǎn', translation: 'turn left', example: '到路口左转。' },
        { word: '右', pinyin: 'yòu', translation: 'right', example: '右手边' },
        { word: '直走', pinyin: 'zhízǒu', translation: 'go straight', example: '直走五百米。' },
      ],
      grammar:
        'Taxi phrase: 请到 + destination (please go to ...).\n' +
        '到 (dào) marks arrival or destination: 到了 (we\'ve arrived).\n' +
        'Compass directions: 左 (left), 右 (right), 直 (straight).',
      dialogue: 'A: 师傅，请到火车站。\nB: 好，直走然后左转。\nA: 多长时间？\nB: 十分钟到。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"请到火车站" is used when...',
        options: ['taking a taxi', 'ordering food', 'shopping', 'calling someone'],
        correctAnswer: 'taking a taxi',
        explanation: '请到 + place = please take me to ...',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 到路口左___。(At the intersection, turn left.)',
        options: [],
        correctAnswer: '转',
        explanation: '左转 (zuǒzhuǎn) = turn left.',
      },
      {
        type: 'multiple_choice',
        prompt: 'What does 站 mean?',
        options: ['station / stop', 'street', 'ticket', 'car'],
        correctAnswer: 'station / stop',
        explanation: '站 (zhàn) = station or stop.',
      },
    ],
  },
  {
    title: 'Phone Calls & Messages',
    description: 'Answer calls, leave messages, and chat naturally on WeChat.',
    level: 'intermediate',
    order: 14,
    content: {
      pinyin: 'wèi, nǐ hǎo!',
      characters: '喂，你好！',
      vocabulary: [
        { word: '电话', pinyin: 'diànhuà', translation: 'telephone', example: '接电话。' },
        { word: '话语', pinyin: 'huàyǔ', translation: 'words / speech', example: '礼貌话语' },
        { word: '话', pinyin: 'huà', translation: 'speech / words', example: '说话' },
        { word: '留言', pinyin: 'liúyán', translation: 'to leave a message', example: '请留言。' },
        { word: '汇', pinyin: 'huì', translation: 'to gather / remit', example: '汇总信息' },
      ],
      grammar:
        'Answer the phone with 喂 (wèi) — the phone-only greeting.\n' +
        '"May I speak to..." = 请问，……在吗？\n' +
        'Taking a message: 他不在，请留言 (He\'s not here, please leave a message).',
      dialogue: 'A: 喂，你好！请问李华在吗？\nB: 他现在不在。\nA: 那我一会儿再打。谢谢！\nB: 不客气，再见！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'How do Chinese speakers answer the phone?',
        options: ['喂', '你好吗', '再见', '对不起'],
        correctAnswer: '喂',
        explanation: '喂 (wèi) is the standard phone greeting.',
      },
      {
        type: 'multiple_choice',
        prompt: '"请留言" means...',
        options: ['please leave a message', 'please call again', 'please hang up', 'please speak louder'],
        correctAnswer: 'please leave a message',
        explanation: '留言 (liúyán) = leave a message.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 请问，李华在___？(Is Li Hua there?)',
        options: [],
        correctAnswer: '吗',
        explanation: '在吗 = are you / is he there.',
      },
    ],
  },
  {
    title: 'Hobbies & Free Time',
    description: 'Talk about what you love doing — sports, music, movies, and reading.',
    level: 'intermediate',
    order: 15,
    content: {
      pinyin: 'wǒ xǐhuan kàn shū',
      characters: '我喜欢看书。',
      vocabulary: [
        { word: '爱', pinyin: 'ài', translation: 'to love / like', example: '我爱看书。' },
        { word: '看', pinyin: 'kàn', translation: 'to watch / read', example: '看电影' },
        { word: '画', pinyin: 'huà', translation: 'to draw / painting', example: '我爱画画。' },
        { word: '音乐', pinyin: 'yīnyuè', translation: 'music', example: '听音乐' },
        { word: '累', pinyin: 'lèi', translation: 'tired', example: '累了就休息。' },
      ],
      grammar:
        'Likes: 爱 / 喜欢 + activity. 我爱运动 (I love sports).\n' +
        'Degree adverbs: 很爱 (love very much), 有点儿喜欢 (kind of like).\n' +
        'Expressing ability: 会 (huì) — 我会画画 (I can draw).',
      dialogue: 'A: 你周末喜欢做什么？\nB: 我喜欢看书、听音乐。你呢？\nA: 我爱运动，也爱画画。\nB: 很有意思！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"我喜欢看书" means...',
        options: ['I like reading', 'I like music', 'I can draw', 'I love movies'],
        correctAnswer: 'I like reading',
        explanation: '看书 (kàn shū) = read books.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which phrase means "listen to music"?',
        options: ['听音乐', '看电影', '看书', '画画'],
        correctAnswer: '听音乐',
        explanation: '听 (tīng) = listen.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我___画画。(I can draw.)',
        options: [],
        correctAnswer: '会',
        explanation: '会 (huì) expresses learned ability.',
      },
    ],
  },
  {
    title: 'Banking & Money',
    description: 'Withdraw, deposit, and exchange money at a Chinese bank.',
    level: 'intermediate',
    order: 16,
    content: {
      pinyin: 'wǒ yào qǔ qián',
      characters: '我要取钱。',
      vocabulary: [
        { word: '取', pinyin: 'qǔ', translation: 'to withdraw / fetch', example: '取钱' },
        { word: '存', pinyin: 'cún', translation: 'to deposit / save', example: '存钱' },
        { word: '卡', pinyin: 'kǎ', translation: 'card', example: '银行卡' },
        { word: '账', pinyin: 'zhàng', translation: 'account / bill', example: '查账' },
        { word: '汇', pinyin: 'huì', translation: 'to remit / exchange', example: '汇率' },
        { word: '块', pinyin: 'kuài', translation: 'yuan (colloquial)', example: '一百块' },
      ],
      grammar:
        'Verb + 钱 patterns: 取钱 (withdraw), 存钱 (deposit), 换钱 (exchange).\n' +
        'Polite service requests: 我要…… / 请帮我……\n' +
        '汇率 (huìlǜ) = exchange rate — essential for travelers.',
      dialogue: 'A: 你好，我要取钱。\nB: 请用卡。请输入密码。\nA: 好。请问今天汇率怎么样？\nB: 请看屏幕。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"取钱" means...',
        options: ['to withdraw money', 'to deposit money', 'to count money', 'to pay a bill'],
        correctAnswer: 'to withdraw money',
        explanation: '取 (qǔ) = withdraw, 钱 = money.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "exchange rate"?',
        options: ['汇率', '账户', '存款', '价格'],
        correctAnswer: '汇率',
        explanation: '汇率 (huìlǜ) = exchange rate.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 请用银行___。(Please use your bank card.)',
        options: [],
        correctAnswer: '卡',
        explanation: '卡 (kǎ) = card.',
      },
    ],
  },
  {
    title: 'School & Learning',
    description: 'Discuss classes, teachers, tests, and campus life.',
    level: 'intermediate',
    order: 17,
    content: {
      pinyin: 'wǒ shì lǎoshī',
      characters: '我是老师。',
      vocabulary: [
        { word: '老师', pinyin: 'lǎoshī', translation: 'teacher', example: '李老师' },
        { word: '课', pinyin: 'kè', translation: 'class / lesson', example: '上中文课' },
        { word: '练习', pinyin: 'liànxí', translation: 'to practice / exercise', example: '每天练习。' },
        { word: '字', pinyin: 'zì', translation: 'character / word', example: '写汉字' },
        { word: '级', pinyin: 'jí', translation: 'level / grade', example: '初级班' },
      ],
      grammar:
        '上 + subject + 课: 上中文课 (take Chinese class).\n' +
        'Grade levels: 初级 / 中级 / 高级 (beginner / intermediate / advanced).\n' +
        '练习 + noun or verb: 练习汉字, 练习说话。',
      dialogue: 'A: 你上什么课？\nB: 我上中文课，中级班。\nA: 难吗？\nB: 有点难，但是每天练习写汉字，进步很快。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"练习" means...',
        options: ['to practice', 'to test', 'to teach', 'to study'],
        correctAnswer: 'to practice',
        explanation: '练习 (liànxí) = to practice.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我上中文___。(I take Chinese class.)',
        options: [],
        correctAnswer: '课',
        explanation: '课 (kè) = class/lesson.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Beginner level in Chinese is...',
        options: ['初级', '中级', '高级', '年级'],
        correctAnswer: '初级',
        explanation: '初级 (chūjí) = beginner level.',
      },
    ],
  },
  {
    title: 'Making Friends & Small Talk',
    description: 'Break the ice, exchange contact info, and keep conversations flowing.',
    level: 'intermediate',
    order: 18,
    content: {
      pinyin: 'wǒmen zuò péngyou ba!',
      characters: '我们做朋友吧！',
      vocabulary: [
        { word: '朋友', pinyin: 'péngyou', translation: 'friend', example: '我的朋友' },
        { word: '认识', pinyin: 'rènshi', translation: 'to know / meet (someone)', example: '很高兴认识你！' },
        { word: '一起', pinyin: 'yìqǐ', translation: 'together', example: '我们一起去。' },
        { word: '聊', pinyin: 'liáo', translation: 'to chat', example: '我们聊聊天。' },
        { word: '话', pinyin: 'huà', translation: 'words / talk', example: '说中文话' },
      ],
      grammar:
        '很高兴认识你 = Nice to meet you (lit. very happy to know you).\n' +
        '一起 (together) goes before the verb: 我们一起吃饭。\n' +
        'Suggesting activities with 吧: 我们做朋友吧！',
      dialogue: 'A: 你好！我叫小明。很高兴认识你！\nB: 我也很高兴认识你！\nA: 我们一起吃饭吧？\nB: 好啊！边吃边聊。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"很高兴认识你" means...',
        options: ['Nice to meet you', 'See you later', 'Thank you very much', 'Let\'s chat'],
        correctAnswer: 'Nice to meet you',
        explanation: '认识 (rènshi) = to meet/know someone.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Where does 一起 go? "We eat together."',
        options: ['我们一起吃饭', '我们吃饭一起', '一起我们吃饭', '我们一吃饭起'],
        correctAnswer: '我们一起吃饭',
        explanation: '一起 goes before the verb.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我们边吃边___。(We chat while eating.)',
        options: [],
        correctAnswer: '聊',
        explanation: '聊 (liáo) = to chat.',
      },
    ],
  },

  /* ================ 高级 Advanced（order 19-24，会员） ================ */
  {
    title: 'Travel & Directions',
    description: 'Navigate Chinese cities: asking directions, distances, and landmarks.',
    level: 'advanced',
    order: 19,
    content: {
      pinyin: 'qǐngwèn, huǒchēzhàn zěnme zǒu?',
      characters: '请问，火车站怎么走？',
      vocabulary: [
        { word: '请问', pinyin: 'qǐngwèn', translation: 'excuse me, may I ask', example: '请问，怎么走？' },
        { word: '火车站', pinyin: 'huǒchēzhàn', translation: 'train station', example: '去火车站。' },
        { word: '怎么走', pinyin: 'zěnme zǒu', translation: 'how to get there', example: '火车站怎么走？' },
        { word: '直走', pinyin: 'zhízǒu', translation: 'go straight', example: '直走五百米。' },
        { word: '左转', pinyin: 'zuǒzhuǎn', translation: 'turn left', example: '然后左转。' },
      ],
      grammar:
        '怎么走 asks for a route; 在哪儿 asks for location.\n' +
        'Distance + 米/公里: 直走五百米 (go straight 500 meters).\n' +
        '然后 (then) links steps in directions.',
      dialogue: 'A: 请问，火车站怎么走？\nB: 直走五百米，然后左转。\nA: 远吗？\nB: 不远，十分钟就到。\nA: 谢谢！\nB: 不客气。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: 'What does 火车站 mean?',
        options: ['train station', 'bus stop', 'airport', 'subway'],
        correctAnswer: 'train station',
        explanation: '火车站 (huǒchēzhàn) = train station.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 直走五百米，然后左___。',
        options: [],
        correctAnswer: '转',
        explanation: '左转 (zuǒzhuǎn) = turn left.',
      },
      {
        type: 'multiple_choice',
        prompt: 'How do you politely start asking for directions?',
        options: ['请问', '再见', '好吃', '谢谢'],
        correctAnswer: '请问',
        explanation: '请问 (qǐngwèn) = excuse me, may I ask.',
      },
    ],
  },
  {
    title: 'Business Chinese: Meetings & Email',
    description: 'Professional phrases for meetings, deadlines, and email communication.',
    level: 'advanced',
    order: 20,
    content: {
      pinyin: 'wǒmen xiàzhōu kāihuì',
      characters: '我们下周开会。',
      vocabulary: [
        { word: '开会', pinyin: 'kāihuì', translation: 'to have a meeting', example: '我们下周开会。' },
        { word: '下周', pinyin: 'xiàzhōu', translation: 'next week', example: '下周开会。' },
        { word: '邮件', pinyin: 'yóujiàn', translation: 'email', example: '请查收邮件。' },
        { word: '日期', pinyin: 'rìqī', translation: 'date / deadline', example: '截止日期是周五。' },
        { word: '合作', pinyin: 'hézuò', translation: 'cooperation', example: '合作愉快！' },
        { word: '议', pinyin: 'yì', translation: 'discuss / proposal', example: '建议 / 会议' },
      ],
      grammar:
        'Time expressions: 下周 (next week), 上周 (last week), 这周 (this week).\n' +
        'Suggestions: 我们……吧 (let\'s ...): 我们开会吧。\n' +
        'Business email openers: 您好，请查收附件 (Hello, please see the attachment).',
      dialogue: 'A: 我们下周开会，你有时间吗？\nB: 有，周二上午怎么样？\nA: 好，我会发邮件确认日期。\nB: 好的，合作愉快！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"我们下周开会" means...',
        options: ['We have a meeting next week', 'We have a meeting today', 'The meeting was last week', 'The meeting is cancelled'],
        correctAnswer: 'We have a meeting next week',
        explanation: '下周 = next week, 开会 = have a meeting.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 截止日___是周五。(The deadline is Friday.)',
        options: [],
        correctAnswer: '期',
        explanation: '日期 (rìqī) = date.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which word means "cooperation"?',
        options: ['合作', '会议', '合同', '邮件'],
        correctAnswer: '合作',
        explanation: '合作 (hézuò) = cooperation.',
      },
    ],
  },
  {
    title: 'Expressing Opinions & Debating',
    description: 'Agree, disagree, and defend your viewpoint with nuance — HSK 4-5 level discourse.',
    level: 'advanced',
    order: 21,
    content: {
      pinyin: 'wǒ rènwéi zhège guāndiǎn hěn yǒu dàolǐ',
      characters: '我认为这个观点很有道理。',
      vocabulary: [
        { word: '认为', pinyin: 'rènwéi', translation: 'to believe / think', example: '我认为你是对的。' },
        { word: '观点', pinyin: 'guāndiǎn', translation: 'viewpoint', example: '你的观点是什么？' },
        { word: '道理', pinyin: 'dàolǐ', translation: 'reason / sense', example: '有道理！' },
        { word: '然', pinyin: 'rán', translation: 'however / so (literary)', example: '然而 / 当然' },
        { word: '议论', pinyin: 'yìlùn', translation: 'to discuss / comment', example: '大家议论纷纷。' },
      ],
      grammar:
        'Opinion starters: 我认为 / 我觉得 / 依我看 (in my view).\n' +
        'Conceding then countering: 虽然……但是…… (although... however...).\n' +
        'Agreeing partially: 有道理，不过…… (fair point, but ...).',
      dialogue: 'A: 我认为线上学习更有效。\nB: 有道理，不过我认为面对面交流也很重要。\nA: 虽然你说的有道理，但是数据显示线上学习进度更快。\nB: 那我们求同存异吧！',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"有道理" is used to...',
        options: ['agree something makes sense', 'strongly disagree', 'change the topic', 'end a debate'],
        correctAnswer: 'agree something makes sense',
        explanation: '有道理 (yǒu dàolǐ) = that makes sense.',
      },
      {
        type: 'multiple_choice',
        prompt: 'Which pattern means "although... however..."?',
        options: ['虽然……但是……', '因为……所以……', '又……又……', '一边……一边……'],
        correctAnswer: '虽然……但是……',
        explanation: '虽然 X 但是 Y = although X, however Y.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我___你是对的。(I think you are right.)',
        options: [],
        correctAnswer: '认为',
        explanation: '认为 (rènwéi) = to believe/think.',
      },
    ],
  },
  {
    title: 'Chengyu: Four-Character Idioms',
    description: 'Understand and use idioms that unlock native-level Chinese.',
    level: 'advanced',
    order: 22,
    content: {
      pinyin: 'yīmíng jīngrén, shìbàn gōngbèi',
      characters: '一鸣惊人，事半功倍',
      vocabulary: [
        { word: '一鸣惊人', pinyin: 'yīmíng jīngrén', translation: 'amaze the world with one feat', example: '他一鸣惊人！' },
        { word: '事半功倍', pinyin: 'shìbàn gōngbèi', translation: 'half the work, twice the effect', example: '好方法事半功倍。' },
        { word: '画蛇添足', pinyin: 'huàshé tiānzú', translation: 'to gild the lily (draw legs on a snake)', example: '不要画蛇添足。' },
        { word: '一目了然', pinyin: 'yìmù liǎorán', translation: 'clear at a glance', example: '图表一目了然。' },
        { word: '独', pinyin: 'dú', translation: 'alone / unique', example: '独一无二' },
      ],
      grammar:
        'Chengyu are fixed 4-character expressions — never change the characters or order.\n' +
        'They often come from classical stories (画蛇添足 comes from a Warring States fable).\n' +
        'Used well, they add punch to essays and speeches.',
      dialogue: 'A: 他平时不说话，这次考试第一名！\nB: 真是一鸣惊人！\nA: 他找到了好方法，事半功倍。\nB: 我们也应该学学。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"事半功倍" describes...',
        options: ['achieving more with less effort', 'working hard for little gain', 'a surprising success', 'a big mistake'],
        correctAnswer: 'achieving more with less effort',
        explanation: 'Half the work (事半), double the result (功倍).',
      },
      {
        type: 'multiple_choice',
        prompt: '"画蛇添足" means...',
        options: ['adding something unnecessary', 'finishing perfectly', 'drawing very well', 'walking slowly'],
        correctAnswer: 'adding something unnecessary',
        explanation: 'Drawing legs on a snake = superfluous addition.',
      },
      {
        type: 'multiple_choice',
        prompt: 'How many characters does a chengyu have?',
        options: ['4', '2', '6', '8'],
        correctAnswer: '4',
        explanation: 'Chengyu are almost always exactly four characters.',
      },
    ],
  },
  {
    title: 'News & Current Affairs',
    description: 'Read headlines and discuss news with media vocabulary.',
    level: 'advanced',
    order: 23,
    content: {
      pinyin: 'jīntiān de xīnwén bǎodào',
      characters: '今天的新闻报道',
      vocabulary: [
        { word: '新闻', pinyin: 'xīnwén', translation: 'news', example: '看新闻' },
        { word: '报道', pinyin: 'bàodào', translation: 'report / coverage', example: '新闻报道' },
        { word: '话题', pinyin: 'huàtí', translation: 'topic of discussion', example: '热门话题' },
        { word: '热搜', pinyin: 'rèsōu', translation: 'trending searches', example: '上热搜了！' },
        { word: '频', pinyin: 'pín', translation: 'frequency (视频 video)', example: '看视频新闻' },
      ],
      grammar:
        'News verbs: 报道 (to report), 采访 (to interview), 发布 (to release).\n' +
        'Passive-ish markers: 据……报道 (according to ... reports).\n' +
        'Trending internet words: 热搜 (trending), 点赞 (like), 转发 (share).',
      dialogue: 'A: 今天有什么新闻？\nB: 据报道，新的地铁开通了。\nA: 这个话题上热搜了吗？\nB: 是的，大家都在讨论。',
    },
    questions: [
      {
        type: 'multiple_choice',
        prompt: '"热搜" refers to...',
        options: ['trending searches', 'hot weather', 'breaking fire news', 'search engines'],
        correctAnswer: 'trending searches',
        explanation: '热搜 (rèsōu) = trending search topics.',
      },
      {
        type: 'multiple_choice',
        prompt: '"据……报道" means...',
        options: ['according to ... reports', 'despite reports', 'before reporting', 'fake reports'],
        correctAnswer: 'according to ... reports',
        explanation: '据 (jù) = according to.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 我每天看新___。(I read news every day.)',
        options: [],
        correctAnswer: '闻',
        explanation: '新闻 (xīnwén) = news.',
      },
    ],
  },
  {
    title: 'Culture Reading: Festivals & Traditions',
    description: 'Read about Chinese festivals and discuss traditions — capstone reading lesson.',
    level: 'advanced',
    order: 24,
    content: {
      pinyin: 'chūnjié shì zuì zhòngyào de jiérì',
      characters: '春节是最重要的节日。',
      vocabulary: [
        { word: '春节', pinyin: 'chūnjié', translation: 'Spring Festival / Chinese New Year', example: '春节回家。' },
        { word: '节日', pinyin: 'jiérì', translation: 'festival / holiday', example: '传统节日' },
        { word: '传统', pinyin: 'chuántǒng', translation: 'tradition', example: '中国传统文化' },
        { word: '热闹', pinyin: 'rènao', translation: 'bustling / lively', example: '春节很热闹。' },
        { word: '团圆', pinyin: 'tuányuán', translation: 'family reunion', example: '中秋节团圆。' },
      ],
      grammar:
        'The 是……的 structure emphasizes: 春节是家人团圆的日子。\n' +
        'Superlatives: 最 + adjective — 最重要的 (the most important).\n' +
        'Cultural note: red envelopes (红包) symbolize luck; dumplings (饺子) mean reunion.',
      dialogue: 'A: 春节你们怎么过？\nB: 全家团圆，吃饺子，看烟花，很热闹！\nA: 小孩子有红包吗？\nB: 有！这是最重要的传统。',
    },
    questions: [
      {
        type: 'fill_blank',
        prompt: 'The most important Chinese festival is "chūnjié" in pinyin. Type the second character: 春___',
        options: [],
        correctAnswer: '节',
        explanation: '春节 (chūnjié) is the most important festival.',
      },
      {
        type: 'multiple_choice',
        prompt: '"团圆" means...',
        options: ['family reunion', 'a round table', 'a type of food', 'new year clothes'],
        correctAnswer: 'family reunion',
        explanation: '团圆 (tuányuán) = reunion, being together.',
      },
      {
        type: 'fill_blank',
        prompt: 'Fill in the blank: 春节是___重要的节日。(most important)',
        options: [],
        correctAnswer: '最',
        explanation: '最 (zuì) = most, forms superlatives.',
      },
    ],
  },
];

/* ---------------- 执行逻辑 ---------------- */

async function seed() {
  await connectDB();
  console.log('[SEED] Connected to MongoDB');

  // 0) --reset：重建课程相关数据（管理员账号与套餐保留）
  if (RESET) {
    await Promise.all([
      Progress.deleteMany({}),
      Question.deleteMany({}),
      Vocabulary.deleteMany({}),
      Lesson.deleteMany({}),
    ]);
    console.log('[SEED] --reset: cleared lessons / questions / vocabulary / progress');
  }

  // 1) 管理员账号
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
    await User.create({
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
    });
    console.log(`[SEED] Admin created: ${env.ADMIN_USERNAME} / ${env.ADMIN_EMAIL}`);
  } else {
    console.log('[SEED] Admin already exists, skipped');
  }

  // 2) 课程（按 order 幂等；已存在课程自动补齐 video 字段）
  let created = 0;
  for (const data of lessonsData) {
    const exists = await Lesson.findOne({ order: data.order });

    if (!exists) {
      const lesson = await Lesson.create({
        title: data.title,
        description: data.description,
        level: data.level,
        order: data.order,
        content: data.content,
        audioUrl: data.audioUrl || '',
        video: data.video || { type: '', url: '', title: '' },
      });

      // 同步词汇到独立集合
      const vocabDocs = (data.content.vocabulary || []).map((w) => ({ ...w, lessonId: lesson._id }));
      if (vocabDocs.length) await Vocabulary.insertMany(vocabDocs);

      // 创建题目并关联
      const questions = await Question.insertMany(
        (data.questions || []).map((q) => ({ ...q, lessonId: lesson._id })),
      );
      lesson.quiz = questions.map((q) => q._id);
      await lesson.save();

      created += 1;
      console.log(
        `[SEED] Lesson "${data.title}" (${data.level}, order ${data.order}) created with ${questions.length} questions`,
      );
    } else {
      // 已存在：仅补齐 video（不覆盖管理员后续修改的内容）
      if (data.video && (!exists.video || !exists.video.url)) {
        exists.video = data.video;
        await exists.save();
        console.log(`[SEED] Lesson "${data.title}" video field backfilled`);
      } else {
        console.log(`[SEED] Lesson "${data.title}" already exists, skipped`);
      }
    }
  }

  // 3) 会员套餐（按 name 幂等，已存在则更新价格/货币）
  let plansCreated = 0;
  for (const p of plansData) {
    const result = await Plan.findOneAndUpdate(
      { name: p.name },
      { ...p, currency: 'USD' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const wasNew = result.createdAt?.getTime() === result.updatedAt?.getTime();
    if (wasNew) plansCreated += 1;
    console.log(`[SEED] Plan "${p.name}" ${wasNew ? 'created' : 'updated'} ($${(p.price / 100).toFixed(2)} / ${p.durationDays} days)`);
  }

  const counts = {
    users: await User.countDocuments(),
    lessons: await Lesson.countDocuments(),
    questions: await Question.countDocuments(),
    vocabulary: await Vocabulary.countDocuments(),
    progress: await Progress.countDocuments(),
    plans: await Plan.countDocuments(),
  };
  console.log('[SEED] Done. New lessons created:', created, '| plans created:', plansCreated);
  console.log('[SEED] Collection counts:', JSON.stringify(counts));

  await disconnectDB();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[SEED] Failed:', err.message);
    process.exit(1);
  });
