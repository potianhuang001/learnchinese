/**
 * Alert — 内联提示条（error | success | info | warning）
 */
import React from 'react';

const styles = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-primary-200 bg-primary-50 text-primary-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function Alert({ type = 'info', children, className = '' }) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]} ${className}`}
    >
      {children}
    </div>
  );
}
