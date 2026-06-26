# 🎮 Flash Games

基于 Vue 3 + Ruffle 的现代 Flash 游戏站点，支持几万款 SWF 游戏的自动扫描、分类和在线游玩。

<p align="center">
  <a href="https://hub.docker.com/r/lookfuna666/flash-games">
    <img src="https://img.shields.io/docker/pulls/lookfuna666/flash-games?style=for-the-badge&logo=docker&label=Docker%20Pulls&color=2496ED" alt="Docker Pulls">
  </a>
  <a href="https://github.com/onRoadLookBeauty/vue-flash">
    <img src="https://img.shields.io/github/stars/onRoadLookBeauty/vue-flash?style=for-the-badge&logo=github&label=GitHub%20Stars&color=181717" alt="GitHub Stars">
  </a>
  <a href="https://github.com/onRoadLookBeauty/vue-flash">
    <img src="https://img.shields.io/badge/GitHub-仓库地址-blue?style=for-the-badge&logo=github" alt="GitHub Repo">
  </a>
</p>

> 💡 **觉得好用？** 去 [GitHub](https://github.com/onRoadLookBeauty/vue-flash) 给个 ⭐ Star 支持一下！

---

## 🐳 Docker Hub 快速启动

### 一行命令启动

```bash
docker run -d \
  --name flash-games \
  -p 3000:3000 \
  -v $(pwd)/game:/app/game \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  lookfuna666/flash-games:latest
```

> 浏览器打开 **http://localhost:3000**，首次启动会引导你设置管理员密码。

### Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
services:
  flash-games:
    image: lookfuna666/flash-games:latest
    container_name: flash-games
    ports:
      - "3000:3000"
    volumes:
      - ./game:/app/game      # SWF 游戏文件目录
      - ./data:/app/data       # SQLite 数据库持久化
    restart: unless-stopped
```

```bash
# 创建游戏目录并放入 SWF 文件
mkdir game data
cp /path/to/your/*.swf ./game/

# 启动
docker-compose up -d
```

### 镜像标签说明

| 标签 | 说明 |
|------|------|
| `lookfuna666/flash-games:latest` | 最新稳定版（推荐） |
| `lookfuna666/flash-games:1.0` | 大版本锁定 |
| `lookfuna666/flash-games:1.0.0` | 精确版本锁定 |

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `GAME_DIR` | `/app/game` | SWF 文件目录 |
| `DB_PATH` | `/app/data/flash.db` | SQLite 数据库路径 |
| `CORS_ORIGINS` | `*`（允许所有） | CORS 允许的来源，多个用逗号分隔 |

### 数据持久化

| 容器路径 | 说明 |
|----------|------|
| `/app/game` | 存放 `.swf` 文件，放入后自动扫描入库 |
| `/app/data` | SQLite 数据库（用户配置、游戏索引、收藏等） |

---

## 🔗 相关链接

- **GitHub 仓库**：[github.com/onRoadLookBeauty/vue-flash](https://github.com/onRoadLookBeauty/vue-flash) 👈 点个 ⭐ Star 支持作者！
- **Docker Hub**：[hub.docker.com/r/lookfuna666/flash-games](https://hub.docker.com/r/lookfuna666/flash-games)
- **问题反馈**：[GitHub Issues](https://github.com/onRoadLookBeauty/vue-flash/issues)

---

## 特性

- **自动扫描入库**：放入 SWF 文件自动识别，无需手动配置
- **智能分类**：根据文件名关键词自动分类（射击、冒险、益智等）
- **全文搜索**：按游戏名搜索，按分类筛选
- **收藏系统**：localStorage 收藏，跨会话保持
- **前端密码锁**：保护隐私，防止爬虫
- **管理后台**：内网管理端口，分类编辑、重新扫描
- **Docker 部署**：一行命令启动，数据持久化
- **深色/浅色主题**：自适应切换

## 快速开始

### 本地开发

```bash
# 1. 安装前端依赖
cd client && npm install

# 2. 安装后端依赖
cd ../server && npm install

# 3. 启动后端 (http://localhost:3000)
cd server && npm run dev

# 4. 新终端，启动前端 (http://localhost:5173)
cd client && npm run dev
```

### Docker 部署 (推荐)

```bash
# 1. 创建游戏目录
mkdir game data

# 2. 放入 SWF 文件
cp /path/to/your/*.swf ./game/

# 3. 启动
docker-compose up -d

# 4. 访问 http://localhost:3000
```

## 项目结构

```
vue-flash/
├── client/                 # Vue 3 + Vite 前端
│   └── src/
│       ├── views/          # HomeView / GameView / AdminView
│       ├── components/     # LockScreen / GameCard / GamePlayer
│       ├── stores/         # Pinia (settings / games)
│       ├── api/            # axios 封装
│       └── styles/         # global.css
├── server/                 # Express 后端
│   └── src/
│       ├── index.js        # 服务入口
│       ├── db.js           # SQLite 数据库
│       ├── scanner.js      # 游戏目录扫描 + 监听
│       ├── routes/         # games / admin API
│       └── middleware/     # 认证中间件
├── game/                   # SWF 文件目录 (volume 挂载)
├── data/                   # SQLite 持久化 (volume 挂载)
├── Dockerfile
└── docker-compose.yml
```

## 密码说明

项目采用**首次安装引导**方式，不存在硬编码密码：

> ⚠️ 首次启动系统时，会自动跳转到安装页面 `/setup`，由你自行设置：
> - **管理员账号和密码**（用于登录 `/admin` 管理后台）
> - **前端锁开关和密码**（开启后访客需输入密码才能浏览游戏）

所有密码使用 bcrypt 加密存储在 SQLite 数据库中，管理后台使用 JWT Token（24小时有效期）进行身份验证。

管理员登录后可在后台随时修改前端锁的开关状态和密码。

## 管理后台

访问 `/admin` 路径，使用 JWT Token 鉴权（24小时有效期）。

功能：
- 📊 游戏统计概览
- 🔄 重新扫描游戏目录
- 🏷️ 分类管理（添加/删除）
- ✏️ 编辑游戏标签（最多 3 个，支持多选 + 自定义输入）

## 安全说明

- 前端设有密码锁（设置中可开启/关闭），用于防止路人访问
- 管理后台使用 JWT Token 鉴权，登录过期需重新验证
- 登录/解锁接口每分钟限流 10 次，防暴力破解
- 管理接口每分钟限流 100 次，全局请求每分钟限流 600 次
- 安全响应头（Helmet）：防 XSS、点击劫持、MIME 嗅探
- 请求体限制 1MB，防大包 DOS 攻击
- API 输出 XSS 过滤，查询参数白名单校验
- SWF 禁止所有网络访问和脚本调用（`allowNetworking: none`, `allowScriptAccess: false`）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + Vue Router |
| Flash 引擎 | Ruffle (自托管 WASM) |
| 后端 | Express.js |
| 数据库 | SQLite (sql.js, 纯 WASM 无需编译) |
| 部署 | Docker / Docker Compose |
