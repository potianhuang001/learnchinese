/**
 * Environment configuration
 * Loads and validates environment variables with sensible defaults.
 */
const path = require('path');

// Load .env from the server root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnchinese',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@learnchinese.app',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123456',
  // 支付模式: dev（模拟支付，默认）| wechat | alipay | both
  // 配置了对应商户号后会自动启用真实支付；未配置则降级为 qr（个人收款码）
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'dev',
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'alipay', // 真实模式下默认渠道
  // 微信支付（Native 扫码）商户配置
  WECHAT_APPID: process.env.WECHAT_APPID || '',
  WECHAT_MCHID: process.env.WECHAT_MCHID || '',
  WECHAT_API_V3_KEY: process.env.WECHAT_API_V3_KEY || '',
  WECHAT_SERIAL_NO: process.env.WECHAT_SERIAL_NO || '',
  WECHAT_PRIVATE_KEY_PATH: process.env.WECHAT_PRIVATE_KEY_PATH || '',
  WECHAT_NOTIFY_URL: process.env.WECHAT_NOTIFY_URL || '',
  // 支付宝（电脑网站支付）商户配置
  ALIPAY_APP_ID: process.env.ALIPAY_APP_ID || '',
  ALIPAY_PRIVATE_KEY: process.env.ALIPAY_PRIVATE_KEY || '',
  ALIPAY_PUBLIC_KEY: process.env.ALIPAY_PUBLIC_KEY || '',
  ALIPAY_NOTIFY_URL: process.env.ALIPAY_NOTIFY_URL || '',
  ALIPAY_RETURN_URL: process.env.ALIPAY_RETURN_URL || '',
  // Stripe（信用卡/借记卡）配置
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || '',
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || '',
  // PayPal 配置
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_ENV: process.env.PAYPAL_ENV || 'sandbox', // sandbox | live
  PAYPAL_RETURN_URL: process.env.PAYPAL_RETURN_URL || '',
  PAYPAL_CANCEL_URL: process.env.PAYPAL_CANCEL_URL || '',
};

// Warn if JWT secret is still the default in production
if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev_secret_change_me') {
  console.warn(
    '[SECURITY] JWT_SECRET is using the default value. Set a strong secret in .env for production.',
  );
}

module.exports = env;
