# LearnChinese 部署指南（预算 0，全免费，不用绑卡）

代码已经推到 GitHub：`https://github.com/potianhuang001/learnchinese`

本指南带你用 **Hugging Face Spaces（免费 Docker 服务，无需信用卡）+ MongoDB Atlas（免费数据库）** 把网站跑起来。
（如果你以后有信用卡，也可以改用 Render，见文末「备选方案」。）

> ⚠️ 免费套餐限制：一段时间没人访问，实例会休眠，下次访问要等约 30–60 秒唤醒。初期运营完全够用。
> 🌏 面向外国学员访问正常；**你本人在中国大陆管理后台时**可能偏慢或偶发打不开，可挂代理，或后期升级/换平台解决。

---

## 第 0 步：准备一个免费的 MongoDB 数据库（必须，约 5 分钟）

Hugging Face **不提供** MongoDB，所以用免费的 MongoDB Atlas（注册**不用信用卡**）：

1. 打开 https://www.mongodb.com/atlas  → 注册/登录（用邮箱）
2. 创建免费集群：**Create → Shared (M0) → 选区域（推荐 Singapore）→ Create Cluster**
3. 创建数据库用户：**Security → Database Access → Add New Database User**
   - 用户名随便（如 `learnch`）、密码记好
4. 允许联网：**Security → Network Access → Add IP Address → 填 `0.0.0.0/0`（允许任何 IP）→ Confirm**
5. 拿连接串：**Clusters → Connect → Connect your application → 选 Node.js → 复制那串**
   长这样：`mongodb+srv://learnch:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
   ⚠️ 把里面的 `<password>` 换成第 3 步设的密码

---

## 第 1 步：在 Hugging Face 上部署（约 5 分钟，不用绑卡）

1. 打开 https://huggingface.co → 用邮箱注册并登录（**不用信用卡**）
2. 右上角头像 → **New Space**
3. Space 名字填 `learnchinese`，**SDK 选 `Docker`**，选 **Public**（免费），点 **Create Space**
4. 创建后进入 Space 页面 → 左侧 **Settings → Repository → 连接 GitHub 仓库**
   （或直接在 Space 的文件里关联 `potianhuang001/learnchinese` 这个仓库）
5. HF 会自动读取仓库根目录的 `Dockerfile` 并构建镜像、启动服务
   - 构建通常需要 3–8 分钟，可在 Space 的 **Logs / Building** 标签看进度
6. 构建完成后，你的网址类似：`https://potianhuang001-learnchinese.hf.space`

> 如果你在第 4 步选的是「空白 Space + Docker」，HF 会直接用仓库里的 `Dockerfile`，无需手动写任何文件。

---

## 第 2 步：填入数据库地址 + 密钥（重要）

在 Hugging Face Space 页面 → **Settings → Variables and Secrets** 里，添加这些变量：

| Key | Value |
|---|---|
| `MONGODB_URI` | 第 0 步复制的连接串（替换好密码） |
| `JWT_SECRET` | 随便一段长随机字符串（至少 32 位，如 `abc123...随机`） |
| `ADMIN_PASSWORD` | 你想用的管理员密码（别用默认） |

> `PAYMENT_MODE=production`、`AUTO_SEED=true`、`NODE_ENV=production` 已在 `Dockerfile` 里设好，不用动。
> 添加/修改变量后，HF 会自动重新部署（约 1–2 分钟）。

---

## 第 3 步：首次访问，自动灌数据

部署完成后直接打开你的网址。服务器启动时会**自动**把 24 节课、72 道题、会员套餐、管理员账号灌进数据库（幂等，不会重复）。
如果页面空白，等 1–2 分钟再刷新即可（首次启动要连库 + 灌数据）。

管理员默认账号：
- 邮箱：`admin@learnchinese.app`
- 密码：`admin123456`（**上线后请在第 2 步用 `ADMIN_PASSWORD` 改掉**）

---

## 第 4 步：收款二维码（已内置）

你的支付宝/微信个人收款码已经在项目里：
- `client/public/qr/alipay.jpg`
- `client/public/qr/wechat.jpg`

要换码：替换这两个文件 → 提交 → 重新部署（HF 会自动重建）。

---

## 日常运营（你只做这些）

1. 用户在前台 `/pricing` 选套餐 → 扫你的收款码 → 点"我已支付"
2. 你打开支付宝/微信确认收到钱
3. 登录管理员 → `/admin/orders` → 点 **Verify & activate** → 用户会员立刻开通
4. `/admin` 看营收（会员数 / 订单数 / 总金额）

---

## 想升级为自动收款（可选，需营业执照）

当前是"个人收款码 + 人工审核"。若有企业/个体户资质，可申请支付宝/微信商户，
在环境变量填 `ALIPAY_*` / `WECHAT_*` 后自动回调，无需人工审核。

---

## 备选方案：Render（需要绑信用卡，免费层不扣费）

如果你有国内 Visa/万事达**双币信用卡**，也可以改用 Render（体验更稳、不休眠或休眠策略不同）：

1. https://render.com → 用 GitHub 登录 → **New + → Blueprint** → 选 `learnchinese` 仓库 → **Apply**
2. 在 Web Service → **Environment** 加 `MONGODB_URI` / `JWT_SECRET` / `ADMIN_PASSWORD`
3. 打开给你的网址即可

> Render 绑卡只是身份核验，免费实例本身 0 费用。

---

## 安全提醒

1. `JWT_SECRET` 必须用强随机值，别用默认
2. 改掉默认管理员密码
3. 私钥/密码只填在平台的环境变量，**不要**写进代码或 `.env` 提交
