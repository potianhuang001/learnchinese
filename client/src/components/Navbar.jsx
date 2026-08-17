/**
 * Navbar — responsive top navigation with auth links and language switcher.
 */
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-50 text-primary-600' : 'text-ink-light hover:bg-ink/5 hover:text-ink'
  }`;

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isMember, logout } = useAuth();
  const { t, lang, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2" aria-label="LearnChinese home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white">
            学
          </span>
          <span className="text-lg font-bold tracking-tight">LearnChinese</span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={linkClass} end>
            {t('nav_home')}
          </NavLink>
          <NavLink to="/lessons" className={linkClass}>
            {t('nav_lessons')}
          </NavLink>
          <NavLink to="/pricing" className={linkClass}>
            👑 {t('nav_pricing')}
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            {t('nav_about')}
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/profile" className={linkClass}>
                {t('nav_profile')}
              </NavLink>
              <NavLink to="/vocabulary" className={linkClass}>
                {t('nav_vocabulary')}
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              {t('nav_admin')}
            </NavLink>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <button
            type="button"
            onClick={() => setLanguage(lang === 'en' ? 'zh' : 'en')}
            className="rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-semibold text-ink-light transition-colors hover:border-primary-400 hover:text-primary-600"
            aria-label="Toggle language"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>

          {isAuthenticated ? (
            <>
              {isMember && (
                <Link
                  to="/account"
                  className="hidden items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-200 sm:flex"
                  title={t('member_badge_title')}
                >
                  👑 {t('member_badge')}
                </Link>
              )}
              <span className="hidden text-sm text-ink-light sm:block">
                👋 {user?.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-red-50 hover:text-red-600"
              >
                {t('nav_logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {t('nav_login')}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-primary-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                {t('nav_register')}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
