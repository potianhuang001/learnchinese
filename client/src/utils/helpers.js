/**
 * 通用工具函数
 */

/** 从 axios 错误中提取可读的错误信息（优先取服务端 message） */
export function getApiError(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
}

/** 将秒数格式化为人类可读时长：3h 12m / 45m / 30s */
export function formatTime(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h}h ${rest}m` : `${h}h`;
}

/** 格式化日期（本地时区，简短可读） */
export function formatDate(iso, locale = 'en') {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** 打乱数组（Fisher–Yates，返回新数组） */
export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 答案归一化：去首尾空格、统一小写、去除所有空白（用于填空题比对） */
export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}
