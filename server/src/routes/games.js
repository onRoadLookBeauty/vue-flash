import { Router } from 'express'
import { queryAll, queryOne } from '../db.js'

const router = Router()

// 转义 HTML 特殊字符（防 XSS）
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 允许的排序字段白名单
const ALLOWED_SORTS = new Set([
  'name_asc', 'name_desc',
  'size_asc', 'size_desc',
  'date_asc', 'date_desc',
])

/**
 * GET /api/games - 获取游戏列表
 * 支持: keyword, category (匹配 tags), sort, page, limit
 */
router.get('/', (req, res) => {
  const {
    keyword = '',
    category = '',
    sort = 'name_asc',
    page = 1,
    limit = 100,
  } = req.query

  // 参数校验
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 100)) // 限制 1~200
  const sortStr = ALLOWED_SORTS.has(sort) ? sort : 'name_asc'
  const keywordStr = String(keyword).trim().slice(0, 100) // 限制搜索词长度
  const categoryStr = String(category).trim().slice(0, 50)

  const conditions = ['active = 1']
  const params = []

  if (keywordStr) {
    conditions.push('name LIKE ?')
    params.push(`%${keywordStr}%`)
  }

  if (categoryStr) {
    // tags 是逗号分隔的，用 LIKE 匹配
    conditions.push('tags LIKE ?')
    params.push(`%${categoryStr}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderBy = 'name ASC'
  switch (sortStr) {
    case 'name_desc': orderBy = 'name DESC'; break
    case 'size_desc': orderBy = 'size DESC'; break
    case 'size_asc':  orderBy = 'size ASC'; break
    case 'date_desc': orderBy = 'created_at DESC'; break
    case 'date_asc':  orderBy = 'created_at ASC'; break
  }

  const countResult = queryOne(`SELECT COUNT(*) as total FROM games ${where}`, params)
  const total = countResult ? countResult.total : 0

  const offset = (pageNum - 1) * limitNum
  // 使用参数化查询，LIMIT/OFFSET 经过 parseInt 验证后安全拼接
  const dataSql = `SELECT id, filename, filepath, name, category, tags, size, md5, active, created_at, updated_at FROM games ${where} ORDER BY ${orderBy} LIMIT ${limitNum} OFFSET ${offset}`
  const games = queryAll(dataSql, params)

  // XSS 过滤输出
  const safeGames = games.map(g => ({
    ...g,
    name: escapeHtml(g.name),
    tags: escapeHtml(g.tags),
    category: escapeHtml(g.category),
    filename: escapeHtml(g.filename),
  }))

  res.json({ games: safeGames, total, page: pageNum, limit: limitNum })
})

/**
 * GET /api/games/:id - 获取单个游戏详情
 */
router.get('/:id', (req, res) => {
  const game = queryOne('SELECT * FROM games WHERE id=?', [parseInt(req.params.id)])
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' })
  }
  // XSS 过滤
  game.name = escapeHtml(game.name)
  game.tags = escapeHtml(game.tags)
  game.category = escapeHtml(game.category)
  game.filename = escapeHtml(game.filename)
  res.json(game)
})

export default router
