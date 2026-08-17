/**
 * PremiumLock — 会员锁定提示（用于课程视频 / 练习 / 测验等付费内容）
 * 未登录 → 引导登录；已登录非会员 → 引导开通会员
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function PremiumLock({ compact = false }) {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-6 py-10 text-center">
        <span className="text-4xl" aria-hidden="true">
          🔒
        </span>
        <p className="font-semibold text-ink">{t('premium_lock_title')}</p>
        <p className="text-sm text-ink-light">{t('premium_lock_desc')}</p>
        <Link
          to={isAuthenticated ? '/pricing' : '/login'}
          state={{ from: window.location.pathname }}
          className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          {isAuthenticated ? t('premium_cta_upgrade') : t('premium_cta_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-center shadow-sm">
      <span className="text-5xl" aria-hidden="true">
        👑
      </span>
      <h3 className="mt-3 text-xl font-bold">{t('premium_lock_title')}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-light">{t('premium_lock_desc')}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          to={isAuthenticated ? '/pricing' : '/register'}
          className="rounded-xl bg-primary-500 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
        >
          {isAuthenticated ? t('premium_cta_upgrade') : t('premium_cta_register')}
        </Link>
        {isAuthenticated && (
          <Link to="/pricing" className="rounded-xl border border-primary-300 px-6 py-3 font-semibold text-primary-600 transition-colors hover:bg-primary-50">
            {t('premium_cta_compare')}
          </Link>
        )}
      </div>
    </div>
  );
}
