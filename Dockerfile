# ===== 多阶段构建 =====

# Stage 1: 构建前端
FROM node:22-alpine AS client-builder
WORKDIR /app/client
# 只复制 package.json（lockfile 和 ruffle 均未提交，需在 Docker 内生成）
COPY client/package.json ./
RUN npm install --ignore-scripts
# 复制全部源码后手动执行 postinstall 生成 ruffle 文件，再构建
COPY client/ ./
RUN node scripts/copy-ruffle.js && npm run build

# Stage 2: 构建后端
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --omit=dev --ignore-scripts

# Stage 3: 运行镜像
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/src ./server/src
COPY server/package.json ./server/

COPY --from=client-builder /app/client/dist ./client/dist

RUN mkdir -p /app/data /app/game

LABEL org.opencontainers.image.title="Flash Games"
LABEL org.opencontainers.image.description="基于 Vue3 + Ruffle 的 Flash 游戏站点，支持数万款 SWF 游戏在线游玩"
LABEL org.opencontainers.image.source="https://github.com/onRoadLookBeauty/vue-flash"
LABEL org.opencontainers.image.licenses="MIT"

ENV PORT=3000
ENV GAME_DIR=/app/game
ENV DB_PATH=/app/data/flash.db
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/categories || exit 1

CMD ["node", "server/src/index.js"]
