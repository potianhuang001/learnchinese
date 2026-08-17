# LearnChinese 部署指南

## 方案：Render 免费套餐（零预算）

因为预算为 0，我们使用 **Render** 的免费 Web Service + 免费 PostgreSQL（这里用 MongoDB，Render 也提供免费 MongoDB 替代品，或 MongoDB Atlas 免费层）。

> 免费套餐限制：服务会在 15 分钟无访问后进入休眠，首次访问需等待 30 秒左右唤醒。对初期运营足够。

---

## 已准备好的文件

| 文件 | 作用 |
|---|---|
| `render.yaml` | Render Blueprint，一键创建 Web Service + MongoDB |
| `package.json`（根目录） | Render 构建/启动入口 |
| `server/src/app.js` | 生产环境自动托管 `client/dist` 静态文件 |
| `client/public/qr/` | 支付宝/微信个人收款码图片 |
| `server/.env.example` | 环境变量模板 |

---

## 部署步骤（约 10 分钟）

### 1. 把代码推到 GitHub

如果你还没有 GitHub 仓库：

```bash
git init
git add .
git commit -m "LearnChinese ready for production"
# 在 GitHub 创建新仓库，然后：
git remote add origin https://github.com/你的用户名/learnchinese.git
git push -u origin main
```

### 2. 注册/登录 Render

访问 https://render.com ，用 GitHub 账号登录。

### 3. 一键部署（Blueprint）

1. 在 Render Dashboard 点击 **New +** → **Blueprint**
2. 选择你的 GitHub 仓库
3. Render 会自动读取 `render.yaml`
4. 给服务起个名字（默认 `learnchinese`）
5. 点击 **Apply**

Render 会自动：
- 创建 Web Service（免费）
- 创建 MongoDB 数据库（免费）
- 运行 `npm install && npm run build`
- 启动 Node.js 后端

### 4. 设置管理员账号

部署完成后，打开 Render 提供的网址，例如：

```
https://learnchinese.onrender.com
```

首次需要创建管理员账号。有两种方式：

**方式 A：环境变量里预设（推荐）**

在 Render Dashboard → 你的 Web Service → **Environment** 里添加：

```
ADMIN_EMAIL=admin@learnchinese.app
ADMIN_PASSWORD=你的强密码
JWT_SECRET=随机长字符串（至少32位）
```

然后重新部署。

**方式 B：用 seed 脚本**

在 Render Shell 里运行：

```bash
cd server
node src/seed/seed.js
```

默认管理员：`admin@learnchinese.app` / `admin123456`（**生产环境请务必修改**）。

### 5. 上传你的收款二维码

项目里已经放了你的支付宝/微信收款码：

- `client/public/qr/alipay.jpg`
- `client/public/qr/wechat.jpg`

如果以后换二维码，直接替换这两个文件，重新提交并部署。

### 6. 配置真实支付宝/微信商户（可选）

当前是个人收款码模式：用户扫码 → 你收到钱 → 你在后台点"确认收款并开通"。

如果想升级为自动回调（无需人工审核），需要申请企业/个体工商户支付宝/微信商户，然后在 Render 环境变量里填写：

```
ALIPAY_APP_ID=...
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...
WECHAT_APPID=...
WECHAT_MCHID=...
WECHAT_API_V3_KEY=...
WECHAT_SERIAL_NO=...
```

填了真实商户配置后，支付会自动走官方接口，无需人工审核。

---

## 日常运营流程

### 用户购买会员

1. 用户访问 `/pricing`
2. 选择套餐 → 选择支付宝/微信
3. 扫码支付
4. 点击"我已支付"，填写姓名/备注
5. 订单进入后台"待核实"

### 你在后台确认收款

1. 登录管理员账号
2. 进入 `/admin/orders`
3. 在"Awaiting confirm"标签下看到订单
4. 确认你支付宝/微信里收到了对应金额
5. 点击 **Verify & activate** → 用户会员立即开通

### 查看营收

`/admin` 首页会显示：
- 有效会员数
- 已支付订单数
- 总营收（美元）

---

## 域名（可选）

Render 默认提供 `https://learnchinese.onrender.com` 免费二级域名。

如果你以后买了自己的域名：

1. 在 Render Dashboard → **Custom Domains** 添加域名
2. 在域名 DNS 添加 CNAME 记录指向 Render
3. 修改环境变量 `CLIENT_URL` 为你的域名
4. 重新部署

---

## 安全提醒

1. **生产环境务必修改 `JWT_SECRET`**，不要用默认值
2. **修改默认管理员密码**
3. **不要泄露 `.env` 文件**
4. 支付宝/微信私钥等敏感信息只填在 Render 环境变量里，不要提交到代码仓库
