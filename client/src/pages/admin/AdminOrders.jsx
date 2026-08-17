/**
 * AdminOrders — 管理后台订单审核
 * 显示待确认/已支付/已取消订单，支持确认收款开通会员或驳回
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdminOrders, useVerifyOrder, useRejectOrder } from '../../hooks/useAdmin';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import AdminNav from '../../components/admin/AdminNav';

const TABS = ['awaiting_confirm', 'pending', 'paid', 'cancelled'];

export default function AdminOrders() {
  const { t, lang } = useLanguage();
  const [status, setStatus] = useState('awaiting_confirm');
  const { data, isLoading, isError } = useAdminOrders({ status, limit: 50 });
  const verify = useVerifyOrder();
  const reject = useRejectOrder();

  const orders = data?.orders || [];

  const handleVerify = (id) => {
    if (!window.confirm(t('admin_order_verify_confirm'))) return;
    verify.mutate(id);
  };

  const handleReject = (id) => {
    const reason = window.prompt(t('admin_order_reject_reason'));
    if (reason === null) return;
    reject.mutate({ id, reason });
  };

  return (
    <div className="container-page py-12">
      <h1 className="mb-2 text-3xl font-bold">{t('admin_orders_title')}</h1>
      <p className="mb-8 text-ink-light">{t('admin_orders_subtitle')}</p>

      <AdminNav />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              status === s
                ? 'bg-primary-500 text-white'
                : 'text-ink-light hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            {t(`order_status_${s}`)} {data?.total != null && status === s ? `(${data.total})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      ) : orders.length === 0 ? (
        <p className="rounded-xl bg-ink/5 py-12 text-center text-ink-light">
          {t('admin_orders_empty')}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{order.orderNo}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        order.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : order.status === 'awaiting_confirm'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-ink/10 text-ink-light'
                      }`}
                    >
                      {t(`order_status_${order.status}`)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-light">
                    {lang === 'en'
                      ? order.plan?.nameEn || order.planSnapshot?.nameEn || order.planSnapshot?.name
                      : order.planSnapshot?.name}
                    {' · '}
                    ${(order.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-ink-lighter">
                    {order.user?.username || order.user?.email || ''}
                  </p>
                  {order.providerInfo?.payerName && (
                    <p className="text-xs text-ink-lighter">
                      {t('checkout_qr_payer_name')}: {order.providerInfo.payerName}
                    </p>
                  )}
                  {order.providerInfo?.note && (
                    <p className="text-xs text-ink-lighter">
                      {t('checkout_qr_note')}: {order.providerInfo.note}
                    </p>
                  )}
                  {order.providerInfo?.rejectReason && (
                    <p className="text-xs text-red-500">
                      {t('admin_order_reject_reason')}: {order.providerInfo.rejectReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {(order.status === 'pending' || order.status === 'awaiting_confirm') && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleVerify(order._id)}
                        disabled={verify.isPending}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {t('admin_order_verify')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(order._id)}
                        disabled={reject.isPending}
                        className="rounded-lg border border-ink/10 px-3 py-2 text-sm font-semibold text-ink-light transition-colors hover:bg-ink/5 disabled:opacity-50"
                      >
                        {t('admin_order_reject')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
