# 🎮 Flash Games

基于 Vue 3 + Ruffle 的现代 Flash 游戏站点，支持几万款 SWF 游戏的自动扫描、分类和在线游玩。

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

# 3. 创建游戏目录
mkdir -p ../game

# 4. 启动后端 (http://localhost:3000)
cd server && npm run dev

# 5. 新终端，启动前端 (http://localhost:5173)
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

项目有两层密码，默认值如下：

| 密码 | 默认值 | 作用 | 修改方式 |
|------|--------|------|----------|
| **前端锁屏密码** | `flash2024` | 进入网站首页前需要输入 | 首页右上角 ⚙ 设置 → 修改密码 |
| **管理后台密码** | `flash2024` | 访问 `/admin` 管理页面 | 环境变量 `ADMIN_PASSWORD` 或 Docker 启动参数 |

### 修改管理后台密码

**本地开发：**
```bash
# Windows
set ADMIN_PASSWORD=我的密码
# 或在 .env 文件中添加
ADMIN_PASSWORD=我的密码
```

**Docker 部署：**
```yaml
# docker-compose.yml
environment:
  - ADMIN_PASSWORD=我的密码
```

> 首次登录管理后台后，密码会保存在浏览器 localStorage 中，后续访问无需重新输入。点击「退出登录」可清除。

## 管理后台

管理后台运行在**内网端口**，不暴露公网。访问 `/admin` 路径。

功能：
- 📊 游戏统计概览
- 🔄 重新扫描游戏目录
- 🏷️ 分类管理（添加/删除）
- ✏️ 编辑游戏标签（最多 3 个，支持多选 + 自定义输入）

## 安全说明

- 前端设有密码锁（设置中可开启/关闭），用于防止路人访问
- 管理后台密码首次验证后自动记住，刷新无需重输
- 管理 API 端口不对外暴露，仅内网可访问
- SWF 禁止所有网络访问和脚本调用（`allowNetworking: none`, `allowScriptAccess: false`）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + Pinia + Vue Router |
| Flash 引擎 | Ruffle (自托管 WASM) |
| 后端 | Express.js |
| 数据库 | SQLite (sql.js, 纯 WASM 无需编译) |
| 部署 | Docker / Docker Compose |
