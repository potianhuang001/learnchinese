/**
 * Spinner — 居中加载指示器（可带文字）
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Spinner({ label, className = '' }) {
  const { t } = useLanguage();
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-12 text-ink-light ${className}`}
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary-200 border-t-primary-500"
        aria-hidden="true"
      />
      <span className="text-sm">{label || t('common_loading')}</span>
    </div>
  );
}
