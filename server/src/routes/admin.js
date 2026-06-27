import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { queryAll, queryOne, execute, getSetting, setSetting } from '../db.js'
import { scanGames, getScanStatus } from '../scanner.js'
import { adminAuth, generateToken } from '../middleware/auth.js'

const router = Router()

// ============ 公开接口（无需 JWT） ============

/**
 * POST /api/admin/login - 管理员登录
 * Body: { username, password }
 * 返回: { token, user }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: '请输入账号和密码' })
    }

    const user = queryOne('SELECT * FROM users WHERE username=?', [username])
    if (!user) {
      return res.status(401).json({ error: '账号或密码错误' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: '账号或密码错误' })
    }

    const token = generateToken(user)
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ error: '登录失败: ' + err.message })
  }
})

// ============ 以下接口需要 JWT 验证 ============
router.use(adminAuth)

/**
 * GET /api/admin/settings/lock - 获取前端锁配置
 */
router.get('/settings/lock', (req, res) => {
  const lockEnabled = getSetting('lock_enabled') === '1'
  res.json({ lockEnabled })
})

/**
 * PUT /api/admin/settings/lock - 更新前端锁配置
 * Body: { lockEnabled?, lockPassword? }
 */
router.put('/settings/lock', async (req, res) => {
  try {
    const { lockEnabled, lockPassword } = req.body

    if (lockEnabled !== undefined) {
      setSetting('lock_enabled', lockEnabled ? '1' : '0')
    }

    if (lockPassword) {
      const hash = await bcrypt.hash(lockPassword, 10)
      setSetting('lock_password_hash', hash)
    }

    res.json({ message: '设置已更新' })
  } catch (err) {
    console.error('更新锁设置失败:', err)
    res.status(500).json({ error: '更新失败: ' + err.message })
  }
})

/**
 * POST /api/admin/scan - 触发重新扫描
 * 返回: { success, message, isScanning, progress }
 * 前端收到后轮询 GET /api/scan/status 获取进度
 */
router.post('/scan', (req, res) => {
  console.log('收到手动扫描请求...')
  if (getScanStatus().isScanning) {
    return res.json({ success: false, message: '扫描正在进行中，请等待', isScanning: true, progress: getScanStatus().progress })
  }
  scanGames(() => {
    console.log('手动扫描完成')
  })
  res.json({ success: true, message: '扫描已启动', isScanning: true, progress: getScanStatus().progress })
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
