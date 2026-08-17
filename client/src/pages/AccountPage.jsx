/**
 * AccountPage — 会员中心（/account，需登录）
 * 展示会员状态 / 到期时间 / 套餐续费入口
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePlans } from '../hooks/usePayments';

export default function AccountPage() {
  const { user, isMember, isAuthenticated } = useAuth();
  const { t, lang } = useLanguage();
  const { data: plans = [] } = usePlans();

  if (!isAuthenticated) {
    return (
      <div className="container-page py-16 text-center">
        <p className="mb-4 text-ink-light">{t('account_login_hint')}</p>
        <Link to="/login" className="btn-primary">
          {t('nav_login')}
        </Link>
      </div>
    );
  }

  const membership = user?.membership || {};
  const expiresAt = membership.expiresAt ? new Date(membership.expiresAt) : null;

  return (
    <div className="container-page py-12">
      <h1 className="mb-8 text-3xl font-bold">{t('account_title')}</h1>

      {/* 会员状态卡片 */}
      <div
        className={`card relative overflow-hidden p-8 ${
          isMember ? 'border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' : ''
        }`}
      >
        {isMember && (
          <span className="absolute right-6 top-6 text-5xl opacity-20" aria-hidden="true">
            👑
          </span>
        )}
        <p className="text-sm font-medium text-ink-light">{t('account_membership_status')}</p>
        {isMember ? (
          <>
            <p className="mt-2 text-3xl font-extrabold text-amber-600">
              {t('account_member_active')}
            </p>
            <p className="mt-2 text-sm text-ink-light">
              {t('account_expires')}{' '}
              <span className="font-semibold text-ink">
                {expiresAt ? expiresAt.toLocaleDateString() : '—'}
              </span>
            </p>
            <div className="mt-5 flex gap-3">
              <Link to="/pricing" className="btn-primary">
                {t('account_renew')}
              </Link>
              <Link to="/lessons" className="btn-secondary">
                {t('account_go_study')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-3xl font-extrabold text-ink">{t('account_member_none')}</p>
            <p className="mt-2 max-w-md text-sm text-ink-light">{t('account_member_none_desc')}</p>
            <div className="mt-5 flex gap-3">
              <Link to="/pricing" className="btn-primary">
                {t('account_upgrade')}
              </Link>
              <Link to="/lessons" className="btn-secondary">
                {t('account_go_study')}
              </Link>
            </div>
          </>
        )}
      </div>

      {/* 会员权益 */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold">{t('account_perks_title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🎬', key: 'account_perk_video' },
            { icon: '✍️', key: 'account_perk_stroke' },
            { icon: '📚', key: 'account_perk_lessons' },
            { icon: '📊', key: 'account_perk_progress' },
          ].map((p) => (
            <div key={p.key} className="card p-5">
              <span className="text-2xl" aria-hidden="true">
                {p.icon}
              </span>
              <p className="mt-2 text-sm font-medium text-ink">{t(p.key)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 套餐速览 */}
      {plans.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{t('account_plans_title')}</h2>
          <div className="flex flex-wrap gap-3">
            {plans.map((plan) => (
              <Link
                key={plan._id}
                to="/pricing"
                className="card flex items-center gap-3 px-5 py-3 transition-shadow hover:shadow-lift"
              >
                <span className="text-2xl">📦</span>
                <div>
                  <p className="font-semibold">
                    {lang === 'en' ? plan.nameEn || plan.name : plan.name}
                  </p>
                  <p className="text-sm font-bold text-primary-600">
                    ${(plan.price / 100).toFixed(2)}
                    <span className="text-xs font-normal text-ink-light">
                      {' '}
                      / {plan.durationDays >= 365 ? t('pricing_year') : plan.durationDays >= 90 ? t('pricing_quarter') : t('pricing_month')}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
