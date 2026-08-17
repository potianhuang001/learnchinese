/**
 * PricingPage — 会员套餐页（/pricing）
 * 展示月卡 / 季卡 / 年卡，选择套餐后弹出支付方式选择，创建订单并跳转收银台
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePlans, useCreateOrder } from '../hooks/usePayments';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import PaymentMethodModal from '../components/PaymentMethodModal';

/** 美分 → 美元显示 */
function usd(price) {
  return (price / 100).toFixed(2);
}

export default function PricingPage() {
  const { t, lang } = useLanguage();
  const { isAuthenticated, isMember, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: plans, isLoading, isError } = usePlans();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelect = (plan) => {
    if (!isAuthenticated) {
      toast.info(t('pricing_login_hint'));
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }
    if (isMember) {
      toast.info(t('pricing_already_member'));
    }
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleChooseMethod = (provider) => {
    setModalOpen(false);
    if (!selectedPlan) return;
    createOrder(
      { planId: selectedPlan._id, provider },
      {
        onSuccess: ({ order, pay }) => {
          // Stripe / PayPal 真实渠道：直接跳转外部支付页面
          if (pay?.payParams?.sessionUrl) {
            window.location.href = pay.payParams.sessionUrl;
            return;
          }
          if (pay?.payParams?.approvalUrl) {
            window.location.href = pay.payParams.approvalUrl;
            return;
          }
          // dev / wechat / alipay：跳内部收银台
          navigate(`/checkout/${order._id}`);
        },
        onError: (err) => toast.error(err?.response?.data?.message || t('common_error')),
      },
    );
  };

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-3xl text-center">
        <span className="rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
          👑 {t('pricing_badge')}
        </span>
        <h1 className="mt-4 text-4xl font-bold">{t('pricing_title')}</h1>
        <p className="mt-3 text-ink-light">{t('pricing_subtitle')}</p>
      </div>

      {isMember && (
        <div className="mx-auto mt-6 max-w-xl rounded-xl bg-emerald-50 px-5 py-3 text-center text-sm font-medium text-emerald-700">
          ✅ {t('pricing_active_hint')} {new Date(user.membership.expiresAt).toLocaleDateString()}
        </div>
      )}

      {isLoading ? (
        <div className="py-20">
          <Spinner />
        </div>
      ) : isError ? (
        <Alert type="error" className="mx-auto mt-10 max-w-md">
          {t('common_error')}
        </Alert>
      ) : plans && plans.length > 0 ? (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`card relative flex flex-col p-6 transition-shadow hover:shadow-lift ${
                plan.badge ? 'border-2 border-primary-400' : ''
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-bold text-white">
                  {lang === 'en' ? plan.badgeEn || plan.badge : plan.badge}
                </span>
              )}
              <h2 className="text-lg font-bold">
                {lang === 'en' ? plan.nameEn || plan.name : plan.name}
              </h2>
              <p className="mt-1 min-h-10 text-sm text-ink-light">
                {lang === 'en' ? plan.descriptionEn || plan.description : plan.description}
              </p>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-xs text-ink-light">$</span>
                <span className="text-4xl font-extrabold text-primary-600">{usd(plan.price)}</span>
                <span className="text-sm text-ink-light">
                  / {plan.durationDays >= 365 ? t('pricing_year') : plan.durationDays >= 90 ? t('pricing_quarter') : t('pricing_month')}
                </span>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {(lang === 'en' && plan.featuresEn?.length ? plan.featuresEn : plan.features).map(
                  (f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      <span className="text-ink">{f}</span>
                    </li>
                  ),
                )}
              </ul>
              <button
                type="button"
                onClick={() => handleSelect(plan)}
                disabled={isPending}
                className={`w-full rounded-xl px-4 py-3 font-semibold transition-colors disabled:opacity-50 ${
                  plan.badge
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'border border-primary-300 text-primary-600 hover:bg-primary-50'
                }`}
              >
                {isPending ? t('checkout_processing') : t('pricing_cta')}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-ink-light">
          <Spinner />
        </div>
      )}

      <p className="mx-auto mt-10 max-w-xl text-center text-xs text-ink-lighter">
        {t('pricing_note')}
      </p>

      <PaymentMethodModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
        onSelect={handleChooseMethod}
      />
    </div>
  );
}
