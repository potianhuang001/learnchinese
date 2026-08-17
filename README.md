# LearnChinese — 中文学习平台

A systematic Chinese learning platform for non-native speakers (English-first interface, with a Chinese UI toggle).

系统化的中文学习平台，面向母语非中文的学习者（默认英文界面，可切换中文）。

## Features

- **User side**
  - Register / Login with email + password (JWT auth, bcrypt password hashing)
  - Course list with level tabs (Beginner / Intermediate / Advanced) + pagination
  - Course detail: pinyin, characters, vocabulary (save to notebook), grammar, dialogue + audio
  - Practice module: multiple choice / fill-blank / listening / speaking (placeholder)
  - Unit quiz: random questions, auto-grading, progress auto-save
  - Learning progress: completed lessons, average score, time spent
  - Vocabulary notebook: save & remove words
  - EN / 中文 interface toggle
- **Admin side** (preset admin account)
  - Course CRUD (vocabulary & questions sync automatically)
  - User list, disable / enable users
  - Basic statistics dashboard

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 · Vite · Tailwind CSS · React Router · Axios · React Query |
| Backend | Node.js · Express · MongoDB · Mongoose · JWT · bcrypt |
| Testing | Jest · Supertest · mongodb-memory-server |
| Deployment | Vercel/Netlify (client) · Render/Heroku (server) · MongoDB Atlas (DB) |

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI + practice/quiz/admin components
│   │   ├── pages/          # Route pages (7 user + 3 admin)
│   │   ├── services/       # Axios API layer (JWT interceptor)
│   │   ├── context/        # AuthContext / LanguageContext / ToastContext
│   │   ├── hooks/          # React Query hooks (lessons/questions/progress/...)
│   │   └── utils/          # i18n dictionary, helpers, level meta
│   ├── vite.config.js      # Dev proxy /api → localhost:5000
│   └── .env.example        # VITE_API_URL
├── server/                 # Express backend
│   ├── src/
│   │   ├── models/         # Mongoose models (User/Lesson/Question/Vocabulary/Progress)
│   │   ├── routes/         # REST routes
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # auth (JWT + admin guard), error handler
│   │   ├── config/         # env / db connection
│   │   ├── seed/           # Seed script (admin + sample lessons)
│   │   └── utils/          # jwt, validators, response helpers
│   ├── tests/              # Jest unit + integration tests
│   └── .env.example
└── README.md
```

---

## 1. Local Development

### Prerequisites

- Node.js 18+ (recommended 20 LTS)
- MongoDB (local install **or** a MongoDB Atlas free cluster)
- npm

### 1.1 Backend

```bash
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD, CLIENT_URL

# Seed the database (admin account + 6 sample lessons with questions/vocabulary)
npm run seed

# Start dev server (http://localhost:5000)
npm run dev
```

`.env` reference:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/learnchinese   # or Atlas URI below
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@learnchinese.app
ADMIN_PASSWORD=<strong-password>
CLIENT_URL=http://localhost:5173
```

### 1.2 Frontend

```bash
cd client
npm install

# Optional: client/.env.local (empty VITE_API_URL → dev proxy is used)
# VITE_API_URL=

# Start dev server (http://localhost:5173, proxies /api to :5000)
npm run dev
```

Open http://localhost:5173 — register a normal user, or log in as the admin
(`ADMIN_USERNAME` / `ADMIN_PASSWORD` from the backend `.env`) and visit `/admin`.

### 1.3 Run tests

```bash
cd server
npm test
```

> Tests use **mongodb-memory-server** (no local MongoDB needed). The mongod binary
> is downloaded on first run to `E:/cache/mongodb-binaries-clean` (see `tests/global-setup.js`).

---

## 2. MongoDB Atlas Setup

1. Create a free cluster at https://www.mongodb.com/atlas
2. **Database Access**: create a database user (e.g. `learnchinese`) with read/write rights
3. **Network Access**: allow your deployment IPs (or `0.0.0.0/0` for simplicity in dev)
4. **Connect** → *Drivers* → copy the connection string:

```
mongodb+srv://learnchinese:<password>@cluster0.xxxxx.mongodb.net/learnchinese
```

5. Put it into the backend `.env`:

```env
MONGODB_URI=mongodb+srv://learnchinese:<password>@cluster0.xxxxx.mongodb.net/learnchinese
```

6. Run the seed once against Atlas (after deploying, or locally with the Atlas URI):

```bash
cd server
npm run seed
```

---

## 3. Deploy the Backend (Render or Heroku)

### Option A — Render

1. Push the repo to GitHub.
2. On Render → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run seed`
   - **Start Command**: `npm start`
   - **Environment**: add the variables from `server/.env.example`
     (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL` → your frontend URL)
4. Deploy. The service gets a URL like `https://learnchinese-api.onrender.com`.

### Option B — Heroku

```bash
# Make sure server is the root of the Heroku app (or use a subdir buildpack)
heroku create learnchinese-api
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set JWT_SECRET=<long-random-string>
heroku config:set ADMIN_USERNAME=admin ADMIN_EMAIL=admin@learnchinese.app ADMIN_PASSWORD=<strong-password>
heroku config:set CLIENT_URL=https://your-app.netlify.app

# Seed once
heroku run node src/seed/seed.js

# Deploy
git push heroku main
```

### Verify the API

```bash
curl https://<your-api-domain>/api/lessons?limit=2
# → { "success": true, "data": { "lessons": [...], "total": 6, ... } }
```

---

## 4. Deploy the Frontend (Vercel or Netlify)

### Option A — Vercel

1. Push the repo to GitHub.
2. Vercel → **Add New Project** → import the repo.
3. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_URL=https://learnchinese-api.onrender.com`
4. Deploy. Done — `https://<your-app>.vercel.app`.

### Option B — Netlify

1. Netlify → **Add new site** → import the repo.
2. Build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
   - **Environment variables**: `VITE_API_URL=https://learnchinese-api.onrender.com`
3. Deploy.

> `VITE_API_URL` must point to the deployed backend root (no trailing `/api` — the
> client appends `/api` itself). If omitted, the app calls `/api` on the same origin.

### Post-deploy sanity checks

- [ ] Register a new user → login works
- [ ] Course list loads (seed data visible)
- [ ] Open a lesson → practice + quiz work, progress saves
- [ ] Save a vocabulary word → appears in 词汇本
- [ ] Log in as admin → `/admin` dashboard, create/edit/delete a lesson, disable a user

---

## 5. API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register (email+password) |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/lessons?level=&page=&limit=` | — | Paginated lessons |
| GET | `/api/lessons/:id` | — | Lesson detail + vocabItems |
| GET | `/api/questions?lessonId=` | — | Questions of a lesson |
| POST | `/api/progress/update` | ✅ | Update progress (double-write) |
| GET | `/api/progress/:userId` | ✅ | Progress + stats |
| POST | `/api/vocabulary/add` | ✅ | Save word |
| GET | `/api/vocabulary/:userId` | ✅ | Saved words |
| DELETE | `/api/vocabulary/:wordId` | ✅ | Remove word |
| POST | `/api/admin/lessons` | ✅ admin | Create lesson |
| PUT | `/api/admin/lessons/:id` | ✅ admin | Update lesson |
| DELETE | `/api/admin/lessons/:id` | ✅ admin | Delete lesson |
| GET | `/api/admin/users` | ✅ admin | List users |
| PUT | `/api/admin/users/:id` | ✅ admin | Disable/enable user |
| GET | `/api/admin/stats` | ✅ admin | Stats dashboard |

Response envelope: `{ success: true, data: ... }` / `{ success: false, message, errors? }`

## 6. Security Notes

- Passwords hashed with **bcrypt** (salt rounds 10)
- **JWT** bearer auth, 7-day expiry; admin routes guarded by role middleware
- Input validation on auth fields (email/username/password) & query params (level/objectId)
- CORS restricted to `CLIENT_URL`; no SQL — MongoDB (NoSQL injection risk mitigated via object-id & enum validation)
- Use a strong random `JWT_SECRET` and `ADMIN_PASSWORD` in production
