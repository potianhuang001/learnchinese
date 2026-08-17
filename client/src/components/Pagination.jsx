/**
 * Pagination — 简易分页控件
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Pagination({ page, pages, onChange, infoText = '' }) {
  const { t } = useLanguage();
  if (!pages || pages <= 1) return null;

  const go = (p) => {
    if (p >= 1 && p <= pages) onChange(p);
  };

  return (
    <nav
      className="mt-8 flex flex-col items-center gap-3"
      aria-label="Pagination"
    >
      {infoText && <p className="text-sm text-ink-light">{infoText}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-sm"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
        >
          ← {t('common_previous')}
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
          .reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((item, i) =>
            item === '...' ? (
              <span key={`e${i}`} className="px-1 text-sm text-ink-lighter">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => go(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                  item === page
                    ? 'bg-primary-500 text-white'
                    : 'text-ink-light hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {item}
              </button>
            ),
          )}
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-sm"
          onClick={() => go(page + 1)}
          disabled={page >= pages}
        >
          {t('common_next')} →
        </button>
      </div>
    </nav>
  );
}
