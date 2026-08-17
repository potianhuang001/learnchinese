/**
 * AdminUsers — 用户管理（搜索 + 列表 + 禁用/启用）
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdminUsers, useToggleUser } from '../../hooks/useAdmin';
import { getApiError, formatDate } from '../../utils/helpers';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import AdminNav from '../../components/admin/AdminNav';

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const { t, lang } = useLanguage();
  const { user: me } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [confirmUser, setConfirmUser] = useState(null);

  const params = { page, limit: PAGE_SIZE };
  if (search.trim()) params.search = search.trim();

  const { data, isLoading, isError } = useAdminUsers(params);
  const { mutateAsync: toggleUser, isPending: toggling } = useToggleUser();

  const users = data?.users || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleToggle = async () => {
    try {
      await toggleUser({ id: confirmUser._id, isDisabled: !confirmUser.isDisabled });
      toast.success(t('admin_user_updated'));
      setConfirmUser(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="container-page py-12">
      <h1 className="mb-2 text-3xl font-bold">{t('admin_users_title')}</h1>
      <p className="mb-8 text-ink-light">{t('admin_users_subtitle')}</p>

      <AdminNav />

      {/* 搜索 */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex max-w-md gap-2">
        <input
          type="search"
          className="input"
          placeholder={t('admin_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('common_search')}
        />
        <Button type="submit" variant="secondary">
          {t('common_search')}
        </Button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      ) : users.length === 0 ? (
        <Alert type="info" className="mx-auto max-w-md">
          {t('admin_no_users')}
        </Alert>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-lighter">
                  <th className="px-5 py-3">{t('auth_username')}</th>
                  <th className="px-5 py-3">{t('auth_email')}</th>
                  <th className="px-5 py-3">{t('admin_role')}</th>
                  <th className="px-5 py-3">{t('admin_joined')}</th>
                  <th className="px-5 py-3">{t('admin_status')}</th>
                  <th className="px-5 py-3 text-right">{t('common_edit')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-cream-100/50">
                    <td className="px-5 py-3 font-semibold">{u.username}</td>
                    <td className="px-5 py-3 text-ink-light">{u.email}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-ink/5 text-ink-light'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-light">{formatDate(u.createdAt, lang)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.isDisabled
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.isDisabled ? t('admin_disabled') : t('admin_active')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        {me?._id === u._id ? (
                          <span className="text-xs text-ink-lighter">{t('admin_self_denied')}</span>
                        ) : (
                          <Button
                            variant={u.isDisabled ? 'secondary' : 'danger'}
                            onClick={() => setConfirmUser(u)}
                          >
                            {u.isDisabled ? t('admin_enable') : t('admin_disable')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={setPage}
            infoText={t('admin_page_info', { page: data.page, pages: data.pages })}
          />
        </>
      )}

      {/* 确认框 */}
      <Modal
        open={Boolean(confirmUser)}
        title={t('common_confirm')}
        onClose={() => setConfirmUser(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmUser(null)}>
              {t('common_cancel')}
            </Button>
            <Button
              variant={confirmUser?.isDisabled ? 'primary' : 'danger'}
              onClick={handleToggle}
              loading={toggling}
            >
              {confirmUser?.isDisabled ? t('admin_enable') : t('admin_disable')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          {t('admin_toggle_confirm', {
            action: confirmUser?.isDisabled ? t('admin_enable') : t('admin_disable'),
          })}
        </p>
        <p className="mt-2 text-sm font-semibold text-primary-600">{confirmUser?.username}</p>
      </Modal>
    </div>
  );
}
