# ===== 多阶段构建 =====

# Stage 1: 构建前端
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci    # postinstall 脚本自动复制 ruffle 文件到 public/ruffle/
COPY client/ ./
RUN npm run build

# Stage 2: 构建后端
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --production    # sql.js 是纯 JS，无需编译

# Stage 3: 运行镜像
FROM node:22-alpine
WORKDIR /app

# 复制后端代码和依赖
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY server/src ./server/src
COPY server/package.json ./server/

# 复制前端构建产物（含 public/ruffle/ → dist/ruffle/）
COPY --from=client-builder /app/client/dist ./client/dist

# 创建数据目录
RUN mkdir -p /app/data /app/game

ENV PORT=3000
ENV GAME_DIR=/app/game
ENV DB_PATH=/app/data/flash.db

EXPOSE 3000

CMD ["node", "server/src/index.js"]
