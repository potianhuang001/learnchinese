/**
 * EmptyState — 空状态占位（图标 + 标题 + 描述 + 可选操作）
 */
import React from 'react';

export default function EmptyState({ icon = '🗂️', title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/10 bg-white/60 px-6 py-14 text-center">
      <span className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-light">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
