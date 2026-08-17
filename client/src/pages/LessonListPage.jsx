/**
 * LessonListPage — 课程列表
 * 按难度筛选 + 分页浏览
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useLessons } from '../hooks/useLessons';
import { LEVELS } from '../utils/level';
import LevelBadge from '../components/LevelBadge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Alert from '../components/Alert';

const PAGE_SIZE = 9;

export default function LessonListPage() {
  const { t } = useLanguage();
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);

  const params = { page, limit: PAGE_SIZE };
  if (level) params.level = level;

  const { data, isLoading, isError, error } = useLessons(params);

  const handleLevelChange = (next) => {
    setLevel(next);
    setPage(1);
  };

  return (
    <div className="container-page py-12">
      {/* 页头 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('lessons_title')}</h1>
        <p className="mt-2 text-ink-light">{t('lessons_subtitle')}</p>
      </div>

      {/* 难度筛选 */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by level">
        <button
          type="button"
          role="tab"
          aria-selected={!level}
          onClick={() => handleLevelChange('')}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            !level
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-ink/10 bg-white text-ink-light hover:border-primary-400 hover:text-primary-600'
          }`}
        >
          {t('lessons_all')}
        </button>
        {LEVELS.map((l) => (
          <button
            key={l.value}
            type="button"
            role="tab"
            aria-selected={level === l.value}
            onClick={() => handleLevelChange(l.value)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              level === l.value
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-ink/10 bg-white text-ink-light hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {t(l.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error" className="mx-auto max-w-md">
          {error?.message || t('common_error')}
        </Alert>
      ) : !data?.lessons?.length ? (
        <EmptyState
          icon="📚"
          title={t('lessons_empty')}
          description={t('lessons_empty_desc')}
        />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.lessons.map((lesson) => (
              <Link
                key={lesson._id}
                to={`/lessons/${lesson._id}`}
                className="card group flex flex-col p-6 transition-shadow hover:shadow-lift"
              >
                <div className="mb-3 flex items-center justify-between">
                  <LevelBadge level={lesson.level} />
                  <span className="text-xs font-medium text-ink-lighter">
                    {t('lesson_level')} {lesson.order}
                  </span>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary-600">
                  {lesson.title}
                </h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink-light">
                  {lesson.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-4">
                  <span className="text-sm font-semibold text-primary-600">
                    {t('common_learn')} →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={setPage}
            infoText={t('lessons_page', { page: data.page, pages: data.pages })}
          />
        </>
      )}
    </div>
  );
}
