/**
 * AdminNav — 管理后台子导航
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-primary-500 text-white'
      : 'text-ink-light hover:bg-primary-50 hover:text-primary-700'
  }`;

export default function AdminNav() {
  const { t } = useLanguage();
  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Admin">
      <NavLink to="/admin" end className={linkClass}>
        📊 {t('admin_overview')}
      </NavLink>
      <NavLink to="/admin/lessons" className={linkClass}>
        📚 {t('admin_lessons')}
      </NavLink>
      <NavLink to="/admin/users" className={linkClass}>
        👥 {t('admin_users')}
      </NavLink>
      <NavLink to="/admin/orders" className={linkClass}>
        🧾 {t('admin_orders')}
      </NavLink>
    </nav>
  );
}
