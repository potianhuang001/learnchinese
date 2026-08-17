/**
 * AdminDashboard — 管理后台首页：平台统计 + 快捷操作
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminStats } from '../../hooks/useAdmin';
import { formatTime } from '../../utils/helpers';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import StatsCard from '../../components/StatsCard';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { data: stats, isLoading, isError } = useAdminStats();

  return (
    <div className="container-page py-12">
      <h1 className="mb-2 text-3xl font-bold">{t('admin_title')}</h1>
      <p className="mb-8 text-ink-light">{t('admin_stats_title')}</p>

      <AdminNav />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard icon="👥" value={stats.userCount} label={t('admin_stat_users')} />
            <StatsCard icon="📚" value={stats.lessonCount} label={t('admin_stat_lessons')} />
            <StatsCard icon="❓" value={stats.questionCount} label={t('admin_stat_questions')} />
            <StatsCard icon="📖" value={stats.vocabularyCount} label={t('admin_stat_words')} />
            <StatsCard icon="✅" value={stats.completedLessons} label={t('admin_stat_completed')} />
            <StatsCard
              icon="📈"
              value={`${stats.completionRate}%`}
              label={t('admin_stat_rate')}
            />
            <StatsCard
              icon="⏱️"
              value={formatTime(stats.totalTimeSpent)}
              label={t('admin_stat_time')}
            />
            <StatsCard icon="👑" value={stats.memberCount} label={t('admin_stat_members')} />
            <StatsCard icon="🧾" value={stats.paidOrderCount} label={t('admin_stat_orders')} />
            <StatsCard
              icon="💰"
              value={`$${(stats.revenue / 100).toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })}`}
              label={t('admin_stat_revenue')}
            />
          </div>

          {/* 快捷操作 */}
          <h2 className="mt-12 mb-4 text-lg font-semibold text-ink-light">
            {t('admin_quick_title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/admin/lessons" className="card group flex items-center gap-4 p-6 hover:shadow-lift">
              <span className="text-3xl" aria-hidden="true">
                📚
              </span>
              <div>
                <p className="font-bold group-hover:text-primary-600">{t('admin_manage_lessons')}</p>
                <p className="text-sm text-ink-light">{t('admin_lessons_subtitle')}</p>
              </div>
            </Link>
            <Link to="/admin/users" className="card group flex items-center gap-4 p-6 hover:shadow-lift">
              <span className="text-3xl" aria-hidden="true">
                👥
              </span>
              <div>
                <p className="font-bold group-hover:text-primary-600">{t('admin_manage_users')}</p>
                <p className="text-sm text-ink-light">{t('admin_users_subtitle')}</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
