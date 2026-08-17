/**
 * RegisterPage — 注册页（用户名 + 邮箱 + 密码 + 确认密码）
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiError } from '../utils/helpers';
import Button from '../components/Button';
import Input from '../components/Input';
import Alert from '../components/Alert';

export default function RegisterPage() {
  const { t } = useLanguage();
  const { register, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const nextErrors = {};
    if (!form.username) nextErrors.username = t('common_required');
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) nextErrors.username = t('auth_username_hint');
    if (!form.email) nextErrors.email = t('common_required');
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = t('auth_email_invalid');
    if (!form.password) nextErrors.password = t('common_required');
    else if (form.password.length < 8) nextErrors.password = t('auth_password_short');
    if (!form.confirm) nextErrors.confirm = t('common_required');
    else if (form.confirm !== form.password) nextErrors.confirm = t('auth_mismatch');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await register(form.username, form.email, form.password);
      toast.success(`🎉 ${t('register_success')}`);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(getApiError(err) || t('common_error'));
    }
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-2xl font-bold text-white">
            学
          </span>
          <h1 className="text-3xl font-bold">{t('auth_register_title')}</h1>
          <p className="mt-2 text-ink-light">{t('auth_register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-7" noValidate>
          {formError && <Alert type="error">{formError}</Alert>}

          <Input
            name="username"
            label={t('auth_username')}
            placeholder="zhang_wei"
            required
            value={form.username}
            onChange={set('username')}
            error={errors.username}
            hint={t('auth_username_hint')}
            autoComplete="username"
          />
          <Input
            name="email"
            type="email"
            label={t('auth_email')}
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            name="password"
            type="password"
            label={t('auth_password')}
            placeholder="••••••••"
            required
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint={t('auth_password_hint')}
            autoComplete="new-password"
          />
          <Input
            name="confirm"
            type="password"
            label={t('auth_confirm_password')}
            placeholder="••••••••"
            required
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" loading={loading}>
            {t('auth_register_button')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-light">
          {t('auth_have_account')}{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">
            {t('auth_to_login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
