/**
 * 会员工具函数
 * - isPremiumLevel: 初级免费，中级/高级为会员课程
 * - hasActiveMembership: 用户是否持有有效会员
 * - getLessonAccess: 计算课程对某用户的访问状态（free / premium / locked）
 */

const FREE_LEVELS = ['beginner'];

/** 课程是否属于会员课程（初级免费，中级/高级付费） */
function isPremiumLevel(level) {
  return !FREE_LEVELS.includes(level);
}

/** 用户是否持有有效会员（status=active 且未过期） */
function hasActiveMembership(user) {
  if (!user || !user.membership) return false;
  const { status, expiresAt } = user.membership;
  if (status !== 'active') return false;
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

/**
 * 计算课程访问状态
 * @returns {{ premium: boolean, locked: boolean }}
 * - premium: 课程是否属于会员内容
 * - locked:  当前用户是否被锁定（需开通会员）
 */
function getLessonAccess(lesson, user) {
  const premium = isPremiumLevel(lesson.level);
  if (!premium) return { premium: false, locked: false };
  const locked = !hasActiveMembership(user);
  return { premium: true, locked };
}

module.exports = { isPremiumLevel, hasActiveMembership, getLessonAccess };
