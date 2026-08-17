/**
 * AboutPage — 关于页
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const features = ['about_feature_1', 'about_feature_2', 'about_feature_3', 'about_feature_4', 'about_feature_5'];

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-3xl">
        {/* 页头 */}
        <div className="mb-12 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-2xl font-bold text-white">
            学
          </span>
          <h1 className="text-4xl font-bold">{t('about_title')}</h1>
          <p className="mt-3 text-lg text-ink-light">{t('about_subtitle')}</p>
        </div>

        {/* 使命 */}
        <section className="card mb-8 p-8">
          <h2 className="mb-3 text-2xl font-bold">{t('about_mission_title')}</h2>
          <p className="leading-relaxed text-ink-light">{t('about_mission_body')}</p>
        </section>

        {/* 特色 */}
        <section className="card mb-8 p-8">
          <h2 className="mb-5 text-2xl font-bold">{t('about_features_title')}</h2>
          <ul className="space-y-3">
            {features.map((key) => (
              <li key={key} className="flex items-start gap-3 text-ink">
                <span className="mt-0.5 text-primary-500" aria-hidden="true">
                  ✓
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </section>

        {/* 联系 */}
        <section className="card p-8">
          <h2 className="mb-3 text-2xl font-bold">{t('about_contact_title')}</h2>
          <p className="text-ink-light">{t('about_contact_body')}</p>
        </section>
      </div>
    </div>
  );
}
