import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '..', '..', 'data', 'flash.db')

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db = null
let SQL = null

/**
 * 初始化数据库（启动时调用一次）
 */
export async function initDb() {
  SQL = await initSqlJs()

  // 尝试从文件加载
  try {
    const buf = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buf)
    console.log(`数据库已加载: ${DB_PATH}`)
  } catch {
    db = new SQL.Database()
    console.log('创建新数据库')
  }

  // 建表
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      filename    TEXT NOT NULL UNIQUE,
      filepath    TEXT DEFAULT '',
      name        TEXT NOT NULL,
      category    TEXT DEFAULT '未分类',
      tags        TEXT DEFAULT '未分类',
      size        INTEGER DEFAULT 0,
      md5         TEXT DEFAULT '',
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at  TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 兼容旧表：尝试添加新列（不存在则忽略）
  try { db.run('ALTER TABLE games ADD COLUMN filepath TEXT DEFAULT \'\'') } catch {}
  try { db.run('ALTER TABLE games ADD COLUMN tags TEXT DEFAULT \'未分类\'') } catch {}

  // 把旧数据的 tags 初始化为 category
  db.run("UPDATE games SET tags = category WHERE tags IS NULL OR tags = ''")
  // 把旧数据的 filepath 初始化为 filename（根目录游戏）
  db.run("UPDATE games SET filepath = filename WHERE filepath IS NULL OR filepath = ''")

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `)

  // 索引
  db.run('CREATE INDEX IF NOT EXISTS idx_games_name ON games(name)')
  db.run('CREATE INDEX IF NOT EXISTS idx_games_category ON games(category)')
  db.run('CREATE INDEX IF NOT EXISTS idx_games_active ON games(active)')
  db.run('CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at)')

  saveDb()
  return db
}

/**
 * 保存数据库到文件
 */
export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

/**
 * 执行查询并返回数组格式的结果
 * sql.js db.exec() 返回 [{columns, values}]，这里统一转为 [{col: val}]
 */
export function queryAll(sql, params = []) {
  if (!db) throw new Error('数据库未初始化')
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

/**
 * 执行查询并返回单行
 */
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * 执行写操作（INSERT/UPDATE/DELETE）
 * 返回 { changes, lastInsertRowid }
 */
export function execute(sql, params = []) {
  if (!db) throw new Error('数据库未初始化')
  db.run(sql, params)
  const result = {
    changes: db.getRowsModified(),
  }
  // post-commit 自动保存
  saveDb()
  return result
}

/**
 * 获取数据库实例（用于高级操作）
 */
export function getDb() {
  if (!db) throw new Error('数据库未初始化')
  return db
}

export default { initDb, saveDb, queryAll, queryOne, execute, getDb }
