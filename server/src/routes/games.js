import { Router } from 'express'
import { queryAll, queryOne } from '../db.js'

const router = Router()

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

  const conditions = ['active = 1']
  const params = []

  if (keyword) {
    conditions.push('name LIKE ?')
    params.push(`%${keyword}%`)
  }

  if (category) {
    // tags 是逗号分隔的，用 LIKE 匹配
    conditions.push('tags LIKE ?')
    params.push(`%${category}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let orderBy = 'name ASC'
  switch (sort) {
    case 'name_desc': orderBy = 'name DESC'; break
    case 'size_desc': orderBy = 'size DESC'; break
    case 'size_asc':  orderBy = 'size ASC'; break
    case 'date_desc': orderBy = 'created_at DESC'; break
    case 'date_asc':  orderBy = 'created_at ASC'; break
  }

  const countResult = queryOne(`SELECT COUNT(*) as total FROM games ${where}`, params)
  const total = countResult ? countResult.total : 0

  const offset = (parseInt(page) - 1) * parseInt(limit)
  const dataSql = `SELECT id, filename, filepath, name, category, tags, size, md5, active, created_at, updated_at FROM games ${where} ORDER BY ${orderBy} LIMIT ${parseInt(limit)} OFFSET ${offset}`
  const games = queryAll(dataSql, params)

  res.json({ games, total, page: parseInt(page), limit: parseInt(limit) })
})

/**
 * GET /api/games/:id - 获取单个游戏详情
 */
router.get('/:id', (req, res) => {
  const game = queryOne('SELECT * FROM games WHERE id=?', [parseInt(req.params.id)])
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' })
  }
  res.json(game)
})

export default router
