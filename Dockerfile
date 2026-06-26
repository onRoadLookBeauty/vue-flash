# ===== 多阶段构建 =====

# Stage 1: 构建前端
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
# postinstall 脚本自动复制 ruffle 文件到 public/ruffle/
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: 构建后端（只装生产依赖，sql.js 是纯 JS 无需编译）
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --production

# Stage 3: 运行镜像
FROM node:22-alpine
WORKDIR /app

# 安装健康检查所需工具
RUN apk add --no-cache curl

# 复制后端代码和依赖
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/src ./server/src
COPY server/package.json ./server/

# 复制前端构建产物（含 public/ruffle/ → dist/ruffle/）
COPY --from=client-builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p /app/data /app/game

# 元数据标签（Docker Hub 页面展示用）
LABEL org.opencontainers.image.title="Flash Games"
LABEL org.opencontainers.image.description="基于 Vue3 + Ruffle 的 Flash 游戏站点，支持数万款 SWF 游戏在线游玩"
LABEL org.opencontainers.image.source="https://github.com/onRoadLookBeauty/vue-flash"
LABEL org.opencontainers.image.licenses="MIT"

ENV PORT=3000
ENV GAME_DIR=/app/game
ENV DB_PATH=/app/data/flash.db
ENV NODE_ENV=production

EXPOSE 3000

# 健康检查：每 30 秒检测一次服务是否正常
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/categories || exit 1

CMD ["node", "server/src/index.js"]
