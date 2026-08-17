# LearnChinese 部署指南（预算 0，全免费）

代码已经推到 GitHub：`https://github.com/potianhuang001/learnchinese`
本指南带你用 **Render（免费 Web 服务）+ MongoDB Atlas（免费数据库）** 把网站跑起来。

> 免费套餐限制：15 分钟没人访问会休眠，下次访问要等约 30 秒唤醒。初期运营完全够用。

---

## 第 0 步：准备一个免费的 MongoDB 数据库（必须，约 5 分钟）

Render **不提供** MongoDB，所以用免费的 MongoDB Atlas：

1. 打开 https://www.mongodb.com/atlas  → 注册/登录（用邮箱）
2. 创建免费集群：**Create → Shared (M0) → 选区域（推荐 Singapore）→ Create Cluster**
3. 创建数据库用户：**Security → Database Access → Add New Database User**
   - 用户名随便（如 `learnch`）、密码记好
4. 允许联网：**Security → Network Access → Add IP Address → 填 `0.0.0.0/0`（允许任何 IP）→ Confirm**
5. 拿连接串：**Clusters → Connect → Connect your application → 选 Node.js → 复制那串**
   长这样：`mongodb+srv://learnch:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   ⚠️ 把里面的 `<password>` 换成第 3 步设的密码

---

## 第 1 步：在 Render 上部署（约 5 分钟）

1. 打开 https://render.com → 用 **GitHub 账号** 登录（授权 Render 访问仓库）
2. Dashboard 点 **New + → Blueprint**
3. 选仓库 **learnchinese**
4. Render 自动读取仓库里的 `render.yaml`
5. 点 **Apply** 开始创建（先不用管环境变量）

创建好后，Render 会给你一个网址，类似 `https://learnchinese.onrender.com`

---

## 第 2 步：填入数据库地址 + 密钥（重要）

在 Render Dashboard → 你的 Web Service → **Environment** 里，找到/添加这些变量：

| Key | Value |
|---|---|
| `MONGODB_URI` | 第 0 步复制的连接串（替换好密码） |
| `JWT_SECRET` | 随便一段长随机字符串（至少 32 位，如 `abc123...随机`） |
| `ADMIN_PASSWORD` | 你想用的管理员密码（别用默认） |

> 其余变量（`PAYMENT_MODE=production`、`AUTO_SEED=true` 等）`render.yaml` 已自动设好，不用动。

改完点 **Save Changes**，Render 会自动重新部署。

---

## 第 3 步：首次访问，自动灌数据

部署完成后直接打开你的网址。服务器启动时会**自动**把 24 节课、72 道题、会员套餐、管理员账号灌进数据库（幂等，不会重复）。
如果数据库是空的，等 1–2 分钟再刷新即可。

管理员默认账号：
- 邮箱：`admin@learnchinese.app`
- 密码：`admin123456`（**上线后请在第 2 步用 `ADMIN_PASSWORD` 改掉**）

---

## 第 4 步：收款二维码（已内置）

你的支付宝/微信个人收款码已经在项目里：
- `client/public/qr/alipay.jpg`
- `client/public/qr/wechat.jpg`

要换码：替换这两个文件 → 提交 → 重新部署。

---

## 日常运营（你只做这些）

1. 用户在前台 `/pricing` 选套餐 → 扫你的收款码 → 点"我已支付"
2. 你打开支付宝/微信确认收到钱
3. 登录管理员 → `/admin/orders` → 点 **Verify & activate** → 用户会员立刻开通
4. `/admin` 看营收（会员数 / 订单数 / 总金额）

---

## 想升级为自动收款（可选，需营业执照）

当前是"个人收款码 + 人工审核"。若有企业/个体户资质，可申请支付宝/微信商户，
在 Render 环境变量填 `ALIPAY_*` / `WECHAT_*` 后自动回调，无需人工审核。

---

## 安全提醒

1. `JWT_SECRET` 必须用强随机值，别用默认
2. 改掉默认管理员密码
3. 私钥/密码只填在 Render 环境变量，**不要**写进代码或 `.env` 提交
