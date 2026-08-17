/**
 * CheckoutPage — 收银台（/checkout/:orderId）
 * - dev 模式：模拟支付按钮
 * - wechat 模式：扫码支付
 * - alipay 模式：表单自动跳转
 * - stripe 模式：跳转 Stripe Checkout（在 PricingPage 已处理）
 * - paypal 模式：跳转 PayPal 审批（在 PricingPage 已处理），返回后自动捕获
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useOrder, useDevPay, useCancelOrder, useCapturePayPal, useConfirmQr } from '../hooks/usePayments';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function CheckoutPage() {
  const { orderId: id } = useParams();
  const { t, lang } = useLanguage();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const { data: order, isLoading, isError, error } = useOrder(id);
  const { mutate: pay, isPending: paying } = useDevPay();
  const { mutate: cancel, isPending: cancelling } = useCancelOrder();
  const { mutate: capturePayPal, isPending: capturing } = useCapturePayPal();
  const { mutate: confirmQr, isPending: confirming } = useConfirmQr();
  const [payerName, setPayerName] = React.useState('');
  const [qrNote, setQrNote] = React.useState('');

  const alipayFormRef = useRef(null);
  const capturedRef = useRef(false);

  // 支付宝表单自动提交
  useEffect(() => {
    if (order?.provider === 'alipay' && order?.providerInfo?.formHtml && alipayFormRef.current) {
      alipayFormRef.current.submit();
    }
  }, [order]);

  // PayPal 返回后自动捕获
  const paypalOrderId = searchParams.get('token') || searchParams.get('paypal_order_id');
  useEffect(() => {
    if (paypalOrderId && order && order.status === 'pending' && !capturedRef.current) {
      capturedRef.current = true;
      capturePayPal(
        { orderId: id, paypalOrderId },
        {
          onSuccess: async () => {
            await refreshUser();
            toast.success(t('checkout_success'));
          },
          onError: (err) => toast.error(err?.response?.data?.message || t('common_error')),
        },
      );
    }
  }, [paypalOrderId, order, id, capturePayPal, refreshUser, toast, t]);

  // 已支付 → 跳转会员中心
  const paid = order?.status === 'paid';
  useEffect(() => {
    if (paid && !paying && !capturing) {
      const timer = setTimeout(() => navigate('/account'), 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [paid, paying, capturing, navigate]);

  const planName = useMemo(
    () =>
      lang === 'en'
        ? order?.plan?.nameEn || order?.planSnapshot?.nameEn || order?.planSnapshot?.name
        : order?.planSnapshot?.name,
    [order, lang],
  );

  const handlePay = () => {
    if (!user) {
      toast.info(t('checkout_login_hint'));
      navigate('/login', { state: { from: `/checkout/${id}` } });
      return;
    }
    pay(id, {
      onSuccess: async () => {
        await refreshUser();
        toast.success(t('checkout_success'));
      },
      onError: (err) => toast.error(err?.response?.data?.message || t('common_error')),
    });
  };

  const handleConfirmQr = () => {
    confirmQr(
      { orderId: id, payerName, note: qrNote },
      {
        onSuccess: () => {
          toast.success(t('checkout_qr_submitted'));
        },
        onError: (err) => toast.error(err?.response?.data?.message || t('common_error')),
      },
    );
  };

  const handleCancel = () => {
    cancel(id, {
      onSuccess: () => {
        toast.info(t('checkout_cancelled'));
        navigate('/pricing');
      },
      onError: (err) => toast.error(err?.response?.data?.message || t('common_error')),
    });
  };

  if (isLoading) return <Spinner />;

  if (isError || !order) {
    return (
      <div className="container-page py-16">
        <Alert type="error" className="mx-auto max-w-md">
          {error?.message || t('checkout_not_found')}
        </Alert>
        <div className="mt-6 text-center">
          <Link to="/pricing" className="btn-secondary">
            ← {t('pricing_title')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-14">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">{t('checkout_title')}</h1>

        {/* 订单摘要 */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-ink/5 pb-4">
            <div>
              <p className="font-semibold">{planName}</p>
              <p className="text-xs text-ink-lighter">
                {t('checkout_order_no')}: {order.orderNo}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                order.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-700'
                  : order.status === 'cancelled'
                    ? 'bg-ink/10 text-ink-light'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {t(`order_status_${order.status}`)}
            </span>
          </div>

          <div className="flex items-center justify-between py-4">
            <span className="text-sm text-ink-light">{t('checkout_amount')}</span>
            <span className="text-2xl font-extrabold text-primary-600">
              ${(order.amount / 100).toFixed(2)}
            </span>
          </div>

          {/* 支付区 */}
          {paid ? (
            <div className="rounded-xl bg-emerald-50 p-6 text-center">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 font-semibold text-emerald-700">{t('checkout_success')}</p>
              <p className="mt-1 text-xs text-emerald-600">{t('checkout_redirecting')}</p>
            </div>
          ) : order.status === 'cancelled' ? (
            <p className="rounded-xl bg-ink/5 p-4 text-center text-sm text-ink-light">
              {t('checkout_cancelled')}
            </p>
          ) : (
            <div className="space-y-4">
              {/* dev 模拟支付 */}
              {order.provider === 'dev' && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full rounded-xl bg-primary-500 px-4 py-3.5 font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                >
                  {paying ? t('checkout_processing') : t('checkout_dev_pay')}
                </button>
              )}

              {/* Stripe 支付确认中（webhook 异步处理） */}
              {order.provider === 'stripe' && (
                <div className="rounded-xl border border-ink/10 p-5 text-center">
                  <Spinner />
                  <p className="mt-2 text-sm text-ink-light">{t('checkout_processing')}</p>
                </div>
              )}

              {/* PayPal 捕获中 */}
              {order.provider === 'paypal' && paypalOrderId && (
                <div className="rounded-xl border border-ink/10 p-5 text-center">
                  <Spinner />
                  <p className="mt-2 text-sm text-ink-light">{t('checkout_paypal_capturing')}</p>
                </div>
              )}

              {/* 微信扫码 */}
              {order.provider === 'wechat' && (
                <div className="rounded-xl border border-ink/10 p-5 text-center">
                  <p className="mb-2 text-sm font-semibold">{t('checkout_wechat_title')}</p>
                  <p className="break-all rounded-lg bg-ink/5 p-3 text-xs text-ink-light">
                    {order.providerInfo?.codeUrl || ''}
                  </p>
                  <p className="mt-2 text-xs text-ink-lighter">
                    {t('checkout_wechat_hint')}
                  </p>
                </div>
              )}

              {/* 个人收款码支付 */}
              {order.provider === 'qr' && (
                <div className="rounded-xl border border-ink/10 p-5 text-center">
                  <p className="mb-1 text-sm font-semibold">
                    {order.providerInfo?.qrType === 'wechat'
                      ? t('checkout_qr_wechat_title')
                      : t('checkout_qr_alipay_title')}
                  </p>
                  <p className="mb-4 text-xs text-ink-lighter">{t('checkout_qr_hint')}</p>
                  <img
                    src={order.providerInfo?.qrUrl || '/qr/alipay.jpg'}
                    alt="QR code"
                    className="mx-auto mb-4 h-48 w-48 rounded-lg border border-ink/10 object-contain"
                  />
                  {order.status === 'awaiting_confirm' ? (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                      {t('checkout_qr_awaiting')}
                    </div>
                  ) : (
                    <div className="space-y-3 text-left">
                      <input
                        type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder={t('checkout_qr_payer_name')}
                        className="input w-full"
                      />
                      <input
                        type="text"
                        value={qrNote}
                        onChange={(e) => setQrNote(e.target.value)}
                        placeholder={t('checkout_qr_note')}
                        className="input w-full"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmQr}
                        disabled={confirming}
                        className="w-full rounded-xl bg-primary-500 px-4 py-3.5 font-bold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                      >
                        {confirming ? t('checkout_processing') : t('checkout_qr_confirm')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling || capturing}
                className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-ink/5 disabled:opacity-50"
              >
                {t('checkout_cancel')}
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-ink-lighter">
          <Link to="/pricing" className="text-primary-600 hover:underline">
            ← {t('pricing_title')}
          </Link>
        </p>
      </div>
    </div>
  );
}
