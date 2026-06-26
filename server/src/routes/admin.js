import { Router } from 'express'
import { queryAll, queryOne, execute } from '../db.js'
import { scanGames } from '../scanner.js'
import { adminAuth } from '../middleware/auth.js'

const router = Router()

// 所有管理接口都需要密码验证
router.use(adminAuth)

/**
 * POST /api/admin/scan - 触发重新扫描
 */
router.post('/scan', (req, res) => {
  console.log('收到扫描请求...')
  const result = scanGames()
  res.json({ message: '扫描完成', ...result })
})

/**
 * PUT /api/admin/games/:id - 更新游戏信息（支持 tags）
 */
router.put('/games/:id', (req, res) => {
  const { id } = req.params
  const { name, tags } = req.body

  const game = queryOne('SELECT * FROM games WHERE id=?', [parseInt(id)])
  if (!game) return res.status(404).json({ error: '游戏不存在' })

  const newName = name || game.name
  const newTags = tags !== undefined ? tags : game.tags
  // category 取 tags 的第一个
  const primaryCategory = (newTags || '').split(',')[0]?.trim() || '未分类'

  execute(
    `UPDATE games SET name=?, tags=?, category=?, updated_at=datetime('now','localtime') WHERE id=?`,
    [newName, newTags, primaryCategory, parseInt(id)]
  )
  res.json({ message: '更新成功', id: parseInt(id) })
})

/**
 * POST /api/admin/categories - 添加分类到 categories 表
 */
router.post('/categories', (req, res) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: '分类名不能为空' })

  try {
    execute('INSERT INTO categories (name) VALUES (?)', [name])
    res.json({ message: `分类 "${name}" 已添加` })
  } catch (e) {
    if (e.message?.includes('UNIQUE')) {
      return res.json({ message: `分类 "${name}" 已存在` })
    }
    res.status(500).json({ error: e.message })
  }
})

/**
 * DELETE /api/admin/categories/:name - 删除分类
 */
router.delete('/categories/:name', (req, res) => {
  const { name } = req.params
  execute('DELETE FROM categories WHERE name=?', [name])
  res.json({ message: `分类 "${name}" 已删除` })
})

/**
 * DELETE /api/admin/games/:id - 删除游戏记录
 */
router.delete('/games/:id', (req, res) => {
  execute('DELETE FROM games WHERE id=?', [parseInt(req.params.id)])
  res.json({ message: '删除成功' })
})

export default router
