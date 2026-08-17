/**
 * API 服务层
 * - 默认导出 axios 实例（含 JWT 拦截器与 401 自动登出）
 * - 按模块导出的领域 API 函数（供 React Query hooks 调用）
 *
 * 后端统一响应格式：{ success: true, data: ... } 或 { success: false, message, errors? }
 *
 * baseURL 解析优先级：
 * 1. 环境变量 VITE_API_URL（生产部署：指向后端线上域名，如 https://api.learnchinese.app）
 * 2. 默认 '/api'（开发模式经 Vite proxy 转发到本地后端 http://localhost:5000）
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// 请求拦截：附加 JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lc_token');
    if (token) {
      // eslint-disable-next-line no-param-reassign -- axios 拦截器约定：修改并返回 config 是标准用法
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截：401 时清理会话并跳转登录页
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('lc_token');
      localStorage.removeItem('lc_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ---- 认证 ----
export const authApi = {
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },
};

// ---- 课程 ----
export const lessonsApi = {
  /** GET /lessons?level=&page=&limit= → { lessons, total, page, pages } */
  list: async (params) => {
    const { data } = await api.get('/lessons', { params });
    return data.data;
  },
  /** GET /lessons/:id → { lesson, vocabItems } */
  detail: async (id) => {
    const { data } = await api.get(`/lessons/${id}`);
    return data.data;
  },
};

// ---- 题目 ----
export const questionsApi = {
  /** GET /questions?lessonId= → { questions, count } */
  listByLesson: async (lessonId) => {
    const { data } = await api.get('/questions', { params: { lessonId } });
    return data.data;
  },
};

// ---- 进度 ----
export const progressApi = {
  /** POST /progress/update */
  update: async (payload) => {
    const { data } = await api.post('/progress/update', payload);
    return data.data;
  },
  /** GET /progress/:userId → { progress, stats } */
  getByUser: async (userId) => {
    const { data } = await api.get(`/progress/${userId}`);
    return data.data;
  },
};

// ---- 词汇本 ----
export const vocabularyApi = {
  /** POST /vocabulary/add { wordId } */
  add: async (wordId) => {
    const { data } = await api.post('/vocabulary/add', { wordId });
    return data.data;
  },
  /** GET /vocabulary/:userId → { vocabulary, count } */
  getByUser: async (userId) => {
    const { data } = await api.get(`/vocabulary/${userId}`);
    return data.data;
  },
  /** DELETE /vocabulary/:wordId */
  remove: async (wordId) => {
    const { data } = await api.delete(`/vocabulary/${wordId}`);
    return data.data;
  },
};

// ---- 管理端 ----
export const adminApi = {
  /** GET /admin/stats → { stats } */
  stats: async () => {
    const { data } = await api.get('/admin/stats');
    return data.data.stats;
  },
  /** GET /admin/users?page=&limit=&search= → { users, total, page, pages } */
  users: async (params) => {
    const { data } = await api.get('/admin/users', { params });
    return data.data;
  },
  /** PUT /admin/users/:id { isDisabled } */
  toggleUser: async (id, isDisabled) => {
    const { data } = await api.put(`/admin/users/${id}`, { isDisabled });
    return data.data.user;
  },
  /** POST /admin/lessons */
  createLesson: async (payload) => {
    const { data } = await api.post('/admin/lessons', payload);
    return data.data.lesson;
  },
  /** PUT /admin/lessons/:id */
  updateLesson: async (id, payload) => {
    const { data } = await api.put(`/admin/lessons/${id}`, payload);
    return data.data.lesson;
  },
  /** GET /payments/orders?status=&page=&limit= → { orders, total, page, pages } */
  orders: async (params) => {
    const { data } = await api.get('/payments/orders', { params });
    return data.data;
  },
  /** POST /payments/orders/:id/verify */
  verifyOrder: async (id) => {
    const { data } = await api.post(`/payments/orders/${id}/verify`);
    return data.data.order;
  },
  /** POST /payments/orders/:id/reject { reason } */
  rejectOrder: async (id, reason) => {
    const { data } = await api.post(`/payments/orders/${id}/reject`, { reason });
    return data.data.order;
  },
};

// ---- 支付 / 会员 ----
export const paymentsApi = {
  /** GET /payments/plans → { plans } */
  plans: async () => {
    const { data } = await api.get('/payments/plans');
    return data.data.plans;
  },
  /** POST /payments/orders { planId, provider? } → { order, pay } */
  createOrder: async (planId, provider) => {
    const { data } = await api.post('/payments/orders', { planId, provider });
    return data.data;
  },
  /** GET /payments/orders/:id → { order } */
  getOrder: async (id) => {
    const { data } = await api.get(`/payments/orders/${id}`);
    return data.data.order;
  },
  /** POST /payments/orders/:id/pay（dev 模拟支付成功） */
  devPay: async (id) => {
    const { data } = await api.post(`/payments/orders/${id}/pay`);
    return data.data.order;
  },
  /** POST /payments/orders/:id/cancel */
  cancelOrder: async (id) => {
    const { data } = await api.post(`/payments/orders/${id}/cancel`);
    return data.data.order;
  },
  /** POST /payments/orders/:id/confirm-qr { payerName?, note? } */
  confirmQr: async (orderId, payerName, note) => {
    const { data } = await api.post(`/payments/orders/${orderId}/confirm-qr`, { payerName, note });
    return data.data.order;
  },
  /** POST /payments/orders/:id/verify（管理员） */
  verifyOrder: async (orderId) => {
    const { data } = await api.post(`/payments/orders/${orderId}/verify`);
    return data.data.order;
  },
  /** POST /payments/orders/:id/reject { reason? }（管理员） */
  rejectOrder: async (orderId, reason) => {
    const { data } = await api.post(`/payments/orders/${orderId}/reject`, { reason });
    return data.data.order;
  },
  /** GET /payments/orders?status=&page=&limit=（管理员） */
  listOrders: async (params) => {
    const { data } = await api.get('/payments/orders', { params });
    return data.data;
  },
  /** POST /payments/orders/:id/capture-paypal { paypalOrderId } */
  capturePayPal: async (orderId, paypalOrderId) => {
    const { data } = await api.post(`/payments/orders/${orderId}/capture-paypal`, { paypalOrderId });
    return data.data.order;
  },
};

export default api;
