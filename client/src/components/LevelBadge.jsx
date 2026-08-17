/**
 * LevelBadge — 难度徽章（配色随难度变化）
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getLevel } from '../utils/level';

export default function LevelBadge({ level, className = '' }) {
  const { t } = useLanguage();
  const meta = getLevel(level);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {t(meta.labelKey)}
    </span>
  );
}
