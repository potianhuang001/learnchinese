/**
 * HomePage — 落地页：Hero + 特色 + 推荐课程（API 数据）+ CTA
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useLessons } from '../hooks/useLessons';
import LevelBadge from '../components/LevelBadge';
import Spinner from '../components/Spinner';
import StrokeAnimator from '../components/StrokeAnimator';

const featureKeys = [
  { icon: '🔤', title: 'home_feature_1_title', desc: 'home_feature_1_desc' },
  { icon: '🧱', title: 'home_feature_2_title', desc: 'home_feature_2_desc' },
  { icon: '🗣️', title: 'home_feature_3_title', desc: 'home_feature_3_desc' },
  { icon: '📊', title: 'home_feature_4_title', desc: 'home_feature_4_desc' },
];

// Hero 手写展示字（均为本地笔画数据覆盖的字）
const HERO_CHARS = [
  { char: '你', pinyin: 'nǐ' },
  { char: '好', pinyin: 'hǎo' },
  { char: '中', pinyin: 'zhōng' },
  { char: '文', pinyin: 'wén' },
  { char: '学', pinyin: 'xué' },
];

export default function HomePage() {
  const { t } = useLanguage();
  // 首页推荐：取前 3 门课程（任意难度，按 order 排序）
  const { data, isLoading } = useLessons({ page: 1, limit: 3 });

  const lessons = data?.lessons || [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-50 to-cream-50">
        <div className="container-page flex flex-col items-center py-20 text-center">
          <span className="mb-4 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            🇨🇳 {t('home_badge')}
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {t('hero_title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-light">{t('hero_subtitle')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/lessons" className="btn-primary px-6 py-3 text-base">
              {t('hero_cta')}
            </Link>
            <Link to="/about" className="btn-secondary px-6 py-3 text-base">
              {t('hero_cta_secondary')}
            </Link>
          </div>
          {/* 手写汉字展示（本地笔画动画，点击 ▶ 播放） */}
          <div className="mt-12 flex flex-wrap items-start justify-center gap-4 sm:gap-6">
            {HERO_CHARS.map((c) => (
              <StrokeAnimator
                key={c.char}
                char={c.char}
                pinyin={c.pinyin}
                size={84}
                showPinyin
                className="rounded-2xl bg-white/70 p-3 shadow-sm backdrop-blur"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <h2 className="mb-10 text-center text-3xl font-bold">{t('home_why_title')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featureKeys.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 text-3xl" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="mb-2 font-semibold">{t(f.title)}</h3>
              <p className="text-sm text-ink-light">{t(f.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured lessons */}
      <section className="bg-cream-100/60 py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold">{t('home_featured_title')}</h2>
              <p className="mt-2 text-ink-light">{t('home_featured_desc')}</p>
            </div>
            {data && (
              <p className="text-sm font-medium text-primary-600">
                {t('home_total_lessons', { n: data.total })}
              </p>
            )}
          </div>

          {isLoading ? (
            <Spinner />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson._id}
                  to={`/lessons/${lesson._id}`}
                  className="card group flex flex-col p-6 transition-shadow hover:shadow-lift"
                >
                  <div className="mb-3">
                    <LevelBadge level={lesson.level} />
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-primary-600">
                    {lesson.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink-light">
                    {lesson.description}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-primary-600">
                    {t('common_learn')} →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500">
        <div className="container-page flex flex-col items-center gap-4 py-14 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home_cta_title')}</h2>
          <p className="max-w-xl text-primary-100">{t('home_cta_desc')}</p>
          <Link
            to="/register"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-primary-600 transition-transform hover:scale-105"
          >
            {t('home_cta_button')}
          </Link>
        </div>
      </section>
    </div>
  );
}
