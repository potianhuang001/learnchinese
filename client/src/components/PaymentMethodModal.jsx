/**
 * PaymentMethodModal — 选择支付方式弹窗
 * 支持支付宝 / 微信 / 信用卡(Stripe) / PayPal
 * 未配置真实渠道时后端自动降级为 dev 模拟支付
 */
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import Modal from './Modal';

// 仅保留支付宝/微信（运营者使用个人收款码），支付宝排第一
const METHODS = [
  { key: 'alipay', labelEn: 'Alipay', labelZh: '支付宝', icon: '🔵', hintEn: 'Recommended', hintZh: '推荐' },
  { key: 'wechat', labelEn: 'WeChat Pay', labelZh: '微信支付', icon: '💬', hintEn: '', hintZh: '' },
];

export default function PaymentMethodModal({ open, onClose, plan, onSelect }) {
  const { t, lang } = useLanguage();

  // plan 为 null 时不渲染内容，避免访问 plan.nameEn 崩溃
  if (!plan) return null;

  const planName = lang === 'en' ? plan.nameEn || plan.name : plan.name;

  return (
    <Modal open={open} onClose={onClose} title={t('payment_method_title')}>
      <p className="mb-4 text-sm text-ink-light">
        {t('payment_method_subtitle', { plan: planName })}
      </p>
      <div className="space-y-3">
        {METHODS.map((m) => {
          const hint = lang === 'en' ? m.hintEn : m.hintZh;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelect(m.key)}
              className="flex w-full items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <span className="text-2xl">{m.icon}</span>
              <span className="flex-1 font-medium">{lang === 'en' ? m.labelEn : m.labelZh}</span>
              {hint && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-ink-lighter">
        {t('payment_method_security_note')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-ink/5"
      >
        {t('common_cancel')}
      </button>
    </Modal>
  );
}
