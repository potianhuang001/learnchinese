/**
 * NotFoundPage — 404
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-7xl font-bold text-primary-200">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('err_not_found')}</h1>
      <p className="mt-2 text-ink-light">{t('err_not_found_desc')}</p>
      <Link to="/" className="btn-primary mt-8">
        ← {t('err_go_home')}
      </Link>
    </div>
  );
}
