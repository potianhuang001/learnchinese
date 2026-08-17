/**
 * StatsCard — 统计卡片（图标 + 数值 + 标签）
 */
import React from 'react';

export default function StatsCard({ icon, value, label, hint = '' }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xl"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold leading-tight text-ink">{value}</p>
        <p className="truncate text-sm text-ink-light">
          {label}
          {hint && <span className="text-ink-lighter"> · {hint}</span>}
        </p>
      </div>
    </div>
  );
}
