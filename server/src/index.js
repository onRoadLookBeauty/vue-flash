import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import { initDb, queryAll } from './db.js'
import gamesRouter from './routes/games.js'
import adminRouter from './routes/admin.js'
import { scanGames, startWatcher, getCategories } from './scanner.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000
const GAME_DIR = process.env.GAME_DIR || path.resolve(__dirname, '..', '..', 'game')

// 全局游戏统计
let gameTotal = 0

// ============ 中间件 ============
app.use(cors())
app.use(express.json())

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

// ============ 静态文件服务 ============

// SWF 游戏文件服务
app.use('/game', express.static(GAME_DIR, {
  setHeaders: (res) => {
    res.set('Content-Type', 'application/x-shockwave-flash')
    res.set('Cache-Control', 'public, max-age=86400')
  },
}))

// 生产环境：前端静态文件
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  console.log(`前端静态文件: ${clientDist}`)
}

// ============ API 路由 ============

// 游戏查询 API（公网暴露）
app.use('/api/games', gamesRouter)

// 分类查询（categories 表 + 游戏 tags 合并去重）
app.get('/api/categories', (req, res) => {
  const fromTags = getCategories() // 来自游戏标签
  const fromTable = queryAll('SELECT name FROM categories ORDER BY name')

  const catSet = new Set()
  fromTable.forEach(r => catSet.add(r.name))
  fromTags.forEach(r => catSet.add(r.name))

  res.json(Array.from(catSet).sort())
})

// 统计信息
app.get('/api/stats', (req, res) => {
  const categories = getCategories()
  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c.count })
  res.json({ total: gameTotal, categories: catMap })
})

// 管理 API（内网）
app.use('/api/admin', adminRouter)

// ============ SPA fallback ============
if (fs.existsSync(clientDist)) {
  app.get('*', (req, res) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/game')) return
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ============ 启动 ============
async function start() {
  console.log('='.repeat(50))
  console.log('  Flash Games Server')
  console.log('='.repeat(50))

  // 初始化数据库
  await initDb()

  // 初始扫描
  console.log('\n正在扫描游戏目录...')
  const scanResult = scanGames()
  gameTotal = scanResult.total
  console.log(`扫描完成: 共 ${scanResult.total} 个可用游戏`)
  console.log(`新增 ${scanResult.added} 个, 缺失 ${scanResult.removed} 个\n`)

  // 启动文件监听
  startWatcher((result) => {
    gameTotal = result.total
  })

  // 启动 HTTP 服务
  const server = app.listen(PORT, () => {
    console.log(`API 服务已启动: http://localhost:${PORT}`)
    console.log(`游戏目录: ${GAME_DIR}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用，请先关闭占用进程：`)
      console.error(`   Windows: netstat -ano | findstr :${PORT}`)
      console.error(`   然后:   taskkill /F /PID <PID>`)
    } else {
      console.error('服务器错误:', err)
    }
    process.exit(1)
  })
}

start().catch(err => {
  console.error('启动失败:', err)
  process.exit(1)
})
