/**
 * LoginPage — 登录页
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/helpers';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = {};
    if (!email) nextErrors.email = t('common_required');
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = t('auth_email_invalid');
    if (!password) nextErrors.password = t('common_required');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await login(email, password);
      toast.success(`👋 ${t('profile_welcome', { name: email })}`);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(getApiError(err) || t('auth_login_failed'));
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-2xl font-bold text-white">
            学
          </span>
          <h1 className="text-3xl font-bold">{t('auth_login_title')}</h1>
          <p className="mt-2 text-ink-light">{t('auth_login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-7" noValidate>
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            name="email"
            type="email"
            label={t('auth_email')}
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            name="password"
            type="password"
            label={t('auth_password')}
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" loading={loading}>
            {t('auth_login_button')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-light">
          {t('auth_no_account')}{' '}
          <Link to="/register" className="font-semibold text-primary-600 hover:underline">
            {t('auth_to_register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
