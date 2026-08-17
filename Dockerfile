# syntax=docker/dockerfile:1

# ---------- 1. Build the React client ----------
FROM node:18-slim AS client-build
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# ---------- 2. Install server dependencies ----------
FROM node:18-slim AS server-deps
# build tools in case a native module (e.g. bcrypt) needs to compile
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev

# ---------- 3. Runtime ----------
FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7860
ENV PAYMENT_MODE=production
ENV AUTO_SEED=true

# server source + prebuilt node_modules
COPY server/package.json ./server/
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# built client (served by Express in production)
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 7860
CMD ["node", "server/src/server.js"]
