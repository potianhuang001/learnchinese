/**
 * LanguageContext — UI language switcher (English default, 中文 secondary).
 * Simple dictionary-based i18n, persisted in localStorage.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import translations from '../utils/i18n';

const LanguageContext = createContext(null);
// Bumped storage key to reset stale preferences (previous keys: lc_lang, lc_ui_lang)
const STORAGE_KEY = 'lc_language_v1';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem('lc_lang');
    localStorage.removeItem('lc_ui_lang');
    if (saved) return saved;
    // Platform default is English; user can switch to Chinese via the toggle
    return 'en';
  });

  const setLanguage = useCallback((next) => {
    setLang(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  // t(key) returns the string for the current language, falling back to English
  const t = useCallback(
    (key, vars = {}) => {
      let str = translations[lang]?.[key] ?? translations.en[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replaceAll(`{${k}}`, String(v));
      });
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLanguage, t }), [lang, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
