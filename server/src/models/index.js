/**
 * 模型统一出口
 * 用法：const { User, Lesson } = require('../models');
 */
const User = require('./User');
const Lesson = require('./Lesson');
const Question = require('./Question');
const Vocabulary = require('./Vocabulary');
const Progress = require('./Progress');
const Plan = require('./Plan');
const Order = require('./Order');

module.exports = { User, Lesson, Question, Vocabulary, Progress, Plan, Order };
