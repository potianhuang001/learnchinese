/**
 * 支付服务
 * - dev 模式：模拟支付，直接标记成功（本地演示）
 * - wechat：微信支付 Native 扫码（APIv3），需商户号 + 证书
 * - alipay：支付宝电脑网站支付，需 AppID + 密钥
 *
 * 真实渠道未配置商户信息时自动降级为 dev，保证本地可完整体验付费闭环。
 * 生产接入：在 server/.env 填入对应商户配置，并把 PAYMENT_MODE 设为 wechat / alipay / both。
 */
const crypto = require('crypto');
const fs = require('fs');
const env = require('../config/env');

/** 是否已配置某渠道的商户信息 */
function isProviderConfigured(provider) {
  if (provider === 'wechat') {
    return Boolean(
      env.WECHAT_APPID && env.WECHAT_MCHID && env.WECHAT_API_V3_KEY && env.WECHAT_SERIAL_NO,
    );
  }
  if (provider === 'alipay') {
    return Boolean(env.ALIPAY_APP_ID && env.ALIPAY_PRIVATE_KEY && env.ALIPAY_PUBLIC_KEY);
  }
  if (provider === 'stripe') {
    return Boolean(env.STRIPE_SECRET_KEY);
  }
  if (provider === 'paypal') {
    return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
  }
  return false;
}

/**
 * 解析实际支付渠道
 * - PAYMENT_MODE=dev 时始终 dev（本地模拟）
 * - 用户请求了具体渠道（stripe/paypal/wechat/alipay）：若已配置则使用
 * - 支付宝/微信未配置商户时降级为 qr（个人收款码），让运营者先收钱
 * - 海外渠道未配置时也降级为 qr，确保钱能进入运营者账户
 */
function resolveProvider(requestedProvider) {
  if (env.PAYMENT_MODE === 'dev') return 'dev';
  const wanted = requestedProvider || env.PAYMENT_PROVIDER || 'alipay';
  if (isProviderConfigured(wanted)) return wanted;
  // 支付宝/微信/海外未配置：全部走个人二维码收款
  if (['alipay', 'wechat', 'stripe', 'paypal'].includes(wanted)) return 'qr';
  return 'qr';
}

/** 生成业务订单号 */
function genOrderNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LC${ts}${rand}`;
}

/**
 * 创建支付单（在数据库中保存订单后调用）
 * @returns {{ provider, payParams, dev:boolean }}
 * - dev: true 时前端展示「模拟支付成功」按钮
 * - wechat: payParams = { codeUrl }（扫码支付）
 * - alipay: payParams = { formHtml }（表单跳转）
 * - stripe: payParams = { sessionUrl }（跳转 Stripe Checkout）
 * - paypal: payParams = { orderId, approvalUrl }（跳转 PayPal 审批）
 */
async function createPayment(order) {
  const provider = resolveProvider(order.provider);
  if (provider === 'dev') {
    return { provider: 'dev', dev: true, payParams: {} };
  }
  if (provider === 'qr') {
    // 个人收款码：保留用户最初选择的 alipay/wechat，前端展示对应二维码
    const qrType = ['alipay', 'wechat'].includes(order.provider) ? order.provider : 'alipay';
    return {
      provider: 'qr',
      dev: false,
      payParams: {
        qrType,
        qrUrl: `/qr/${qrType}.jpg`,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }
  if (provider === 'wechat') {
    const codeUrl = await createWechatNativeOrder(order);
    return { provider: 'wechat', dev: false, payParams: { codeUrl } };
  }
  if (provider === 'alipay') {
    const formHtml = createAlipayPagePayForm(order);
    return { provider: 'alipay', dev: false, payParams: { formHtml } };
  }
  if (provider === 'stripe') {
    const sessionUrl = await createStripeCheckoutSession(order);
    return { provider: 'stripe', dev: false, payParams: { sessionUrl } };
  }
  if (provider === 'paypal') {
    const paypal = await createPayPalOrder(order);
    return { provider: 'paypal', dev: false, payParams: paypal };
  }
  return { provider: 'dev', dev: true, payParams: {} };
}

/* ---------------- 微信支付 Native（APIv3） ---------------- */

/**
 * 微信支付 APIv3 Native 下单
 * POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
 * 返回 code_url（前端渲染为二维码）
 */
async function createWechatNativeOrder(order) {
  const { WECHAT_APPID, WECHAT_MCHID, WECHAT_API_V3_KEY, WECHAT_SERIAL_NO, WECHAT_NOTIFY_URL } =
    env;

  // 读取商户私钥（apiclient_key.pem）
  let privateKey;
  try {
    privateKey = fs.readFileSync(env.WECHAT_PRIVATE_KEY_PATH || '', 'utf8');
  } catch {
    throw new Error('WECHAT_PRIVATE_KEY_PATH is not readable. Check server/.env');
  }

  const body = JSON.stringify({
    appid: WECHAT_APPID,
    mchid: WECHAT_MCHID,
    description: `LearnChinese 会员 - ${order.planSnapshot.name}`,
    out_trade_no: order.orderNo,
    notify_url: WECHAT_NOTIFY_URL || 'https://your-domain.com/api/payments/notify/wechat',
    amount: { total: order.amount, currency: order.currency },
  });

  const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';
  const method = 'POST';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${new URL(url).pathname}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(privateKey, 'base64');
  const auth = `WECHATPAY2-SHA256-RSA2048 mchid="${WECHAT_MCHID}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${WECHAT_SERIAL_NO}"`;

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'learnchinese-server/1.0',
    },
    body,
  });
  const data = await resp.json();
  if (!resp.ok || !data.code_url) {
    throw new Error(`Wechat pay failed: ${JSON.stringify(data)}`);
  }
  return data.code_url;
}

/** 微信支付回调验签（APIv3） */
function verifyWechatNotify(reqBody, headers) {
  const { WECHAT_API_V3_KEY } = env;
  const { signature, timestamp, nonce, serial } = headers;
  const message = `${timestamp}\n${nonce}\n${JSON.stringify(reqBody)}\n`;
  const sigOk = crypto
    .createVerify('SHA256')
    .update(message, 'utf8')
    .verify(fs.readFileSync(env.WECHAT_PRIVATE_KEY_PATH || '', 'utf8'), signature, 'base64');
  if (!sigOk) return null;
  // 解密 resource（AES-256-GCM）
  const { ciphertext, nonce: rNonce, associated_data: aad } = reqBody.resource || {};
  const key = crypto.createHash('sha256').update(WECHAT_API_V3_KEY).digest();
  const authTag = ciphertext.slice(-16);
  const data = Buffer.from(ciphertext.slice(0, -16), 'base64');
  const decoded = crypto
    .createDecipheriv('aes-256-gcm', key, Buffer.from(rNonce, 'base64'))
    .setAAD(Buffer.from(aad))
    .setAuthTag(authTag);
  const plain = Buffer.concat([decoded.update(data), decoded.final()]).toString('utf8');
  return JSON.parse(plain);
}

/* ---------------- 支付宝电脑网站支付 ---------------- */

/** 支付宝 RSA2 签名 */
function alipaySign(params) {
  const { ALIPAY_PRIVATE_KEY } = env;
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const sign = crypto.createSign('RSA-SHA256').update(sorted, 'utf8').sign(ALIPAY_PRIVATE_KEY, 'base64');
  return sign;
}

/** 生成支付宝电脑网站支付表单 HTML（后端渲染成字符串，前端 iframe / 新窗口打开） */
function createAlipayPagePayForm(order) {
  const { ALIPAY_APP_ID, ALIPAY_NOTIFY_URL, ALIPAY_RETURN_URL } = env;
  const params = {
    app_id: ALIPAY_APP_ID,
    method: 'alipay.trade.page.pay',
    format: 'JSON',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace(/\.\d+Z$/, '+08:00'),
    version: '1.0',
    notify_url: ALIPAY_NOTIFY_URL || 'https://your-domain.com/api/payments/notify/alipay',
    return_url: ALIPAY_RETURN_URL || 'http://localhost:5173/account',
    biz_content: JSON.stringify({
      out_trade_no: order.orderNo,
      product_code: 'FAST_INSTANT_TRADE_PAY',
      total_amount: (order.amount / 100).toFixed(2),
      subject: `LearnChinese 会员 - ${order.planSnapshot.name}`,
    }),
  };
  const sign = alipaySign(params);
  const pairs = Object.keys(params)
    .filter((k) => params[k] !== '' && params[k] != null)
    .map((k) => {
      const enc = encodeURIComponent(params[k]);
      return `<input type="hidden" name="${k}" value="${enc}"/>`;
    })
    .join('');
  return `<form id="alipay-form" action="https://openapi.alipay.com/gateway.do" method="POST">${pairs}<input type="hidden" name="sign" value="${encodeURIComponent(sign)}"/></form>`;
}

/** 支付宝异步回调验签 */
function verifyAlipayNotify(params) {
  const { ALIPAY_PUBLIC_KEY } = env;
  const sign = params.sign;
  const sorted = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const ok = crypto
    .createVerify('RSA-SHA256')
    .update(sorted, 'utf8')
    .verify(ALIPAY_PUBLIC_KEY, sign, 'base64');
  return ok;
}

/* ---------------- Stripe Checkout ---------------- */

async function createStripeCheckoutSession(order) {
  const secretKey = env.STRIPE_SECRET_KEY;
  const baseUrl = env.CLIENT_URL.replace(/\/$/, '');
  const successUrl = env.STRIPE_SUCCESS_URL || `${baseUrl}/checkout/${order._id}?payment=success`;
  const cancelUrl = env.STRIPE_CANCEL_URL || `${baseUrl}/checkout/${order._id}?canceled=1`;

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'mode': 'payment',
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': order.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(order.amount),
      'line_items[0][price_data][product_data][name]': `LearnChinese Membership - ${order.planSnapshot.name}`,
      'line_items[0][quantity]': '1',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: order.orderNo,
    }).toString(),
  });
  const data = await resp.json();
  if (!resp.ok || !data.url) {
    throw new Error(`Stripe session failed: ${data.error?.message || JSON.stringify(data)}`);
  }
  return data.url;
}

/** Stripe webhook payload 签名验证（简化版，生产建议使用 stripe-node 库） */
function verifyStripeNotify(payload, signature) {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return null;
  const sigParts = Object.fromEntries(signature.split(',').map((p) => p.split('=')));
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${sigParts.t}.${payload}`, 'utf8')
    .digest('hex');
  if (expected !== sigParts.v1) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/* ---------------- PayPal Checkout ---------------- */

function paypalBaseUrl() {
  return env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function paypalAccessToken() {
  const resp = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    throw new Error(`PayPal auth failed: ${data.error_description || JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function createPayPalOrder(order) {
  const token = await paypalAccessToken();
  const baseUrl = env.CLIENT_URL.replace(/\/$/, '');
  const returnUrl = env.PAYPAL_RETURN_URL || `${baseUrl}/checkout/${order._id}`;
  const cancelUrl = env.PAYPAL_CANCEL_URL || `${baseUrl}/checkout/${order._id}?canceled=1`;

  const resp = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': order.orderNo,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.orderNo,
          description: `LearnChinese Membership - ${order.planSnapshot.name}`,
          amount: {
            currency_code: order.currency,
            value: (order.amount / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'LearnChinese',
        return_url: returnUrl,
        cancel_url: cancelUrl,
        user_action: 'PAY_NOW',
      },
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.id) {
    throw new Error(`PayPal order failed: ${data.message || JSON.stringify(data)}`);
  }
  const approvalUrl = data.links.find((l) => l.rel === 'approve')?.href;
  return { orderId: data.id, approvalUrl: approvalUrl || '' };
}

/** 捕获已审批的 PayPal 订单 */
async function capturePayPalOrder(paypalOrderId) {
  const token = await paypalAccessToken();
  const resp = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return resp.json();
}

module.exports = {
  genOrderNo,
  createPayment,
  resolveProvider,
  isProviderConfigured,
  verifyWechatNotify,
  verifyAlipayNotify,
  verifyStripeNotify,
  capturePayPalOrder,
};
