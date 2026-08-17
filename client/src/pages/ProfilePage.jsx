/**
 * ProfilePage — 个人中心
 * 展示学习统计（完成数/平均分/时长/已开始）与最近学习记录
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import { formatTime, formatDate } from '../utils/helpers';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';
import LevelBadge from '../components/LevelBadge';

export default function ProfilePage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { data, isLoading, isError } = useProgress(user?._id);

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="container-page py-12">
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      </div>
    );
  }

  const { progress = [], stats = {} } = data || {};

  return (
    <div className="container-page py-12">
      {/* 欢迎语 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          {t('profile_welcome', { name: user?.username })}
        </h1>
        <p className="mt-2 text-ink-light">
          {user?.email} · {user?.role === 'admin' ? t('nav_admin') : ''}
        </p>
      </div>

      {/* 统计卡片 */}
      <h2 className="mb-4 text-lg font-semibold text-ink-light">{t('profile_stats_title')}</h2>
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon="✅" value={stats.completedLessons ?? 0} label={t('profile_completed')} />
        <StatsCard icon="📊" value={stats.averageScore ?? 0} label={t('profile_avg_score')} hint="/100" />
        <StatsCard icon="⏱️" value={formatTime(stats.totalTimeSpent)} label={t('profile_time_spent')} />
        <StatsCard icon="🚀" value={stats.totalLessons ?? 0} label={t('profile_lessons_started')} />
      </div>

      {/* 最近学习 */}
      <h2 className="mb-4 text-lg font-semibold text-ink-light">{t('profile_recent_title')}</h2>
      {progress.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title={t('profile_no_progress')}
          description={t('profile_no_progress_desc')}
          action={
            <Link to="/lessons" className="btn-primary">
              {t('profile_go_browse')} →
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-ink/5 overflow-hidden">
          {progress.map((p) => {
            const lesson = p.lessonId || {};
            return (
              <li key={p._id} className="flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/lessons/${lesson._id}`}
                      className="font-semibold hover:text-primary-600"
                    >
                      {lesson.title || '—'}
                    </Link>
                    {lesson.level && <LevelBadge level={lesson.level} />}
                  </div>
                  <p className="mt-1 text-xs text-ink-lighter">
                    {t('profile_last_access')}: {formatDate(p.lastAccessed, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-primary-600">{p.score}</p>
                    <p className="text-xs text-ink-lighter">{t('profile_score')}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{formatTime(p.timeSpent)}</p>
                    <p className="text-xs text-ink-lighter">{t('profile_time_spent')}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      p.completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {p.completed ? t('profile_status_completed') : t('profile_status_in_progress')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
