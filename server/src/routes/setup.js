import { Router } from 'express'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { queryAll, queryOne, execute, isSetupComplete, setSetting } from '../db.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

/**
 * GET /api/setup/status - 检查是否已完成首次安装
 */
router.get('/status', (req, res) => {
  const initialized = isSetupComplete()
  res.json({ initialized })
})

/**
 * POST /api/setup - 首次安装，创建管理员并配置系统
 * Body: { username, password, lockEnabled, lockPassword }
 */
router.post('/', async (req, res) => {
  try {
    // 防止重复安装
    if (isSetupComplete()) {
      return res.status(400).json({ error: '系统已初始化，不能重复安装' })
    }

    const { username, password, lockEnabled, lockPassword } = req.body

    // 校验
    if (!username || !username.trim()) {
      return res.status(400).json({ error: '请输入管理员账号' })
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: '密码至少4位' })
    }
    if (lockEnabled && (!lockPassword || lockPassword.length < 2)) {
      return res.status(400).json({ error: '前端锁密码至少2位' })
    }

    // bcrypt 加密
    const passwordHash = await bcrypt.hash(password, 10)
    const lockPasswordHash = lockEnabled ? await bcrypt.hash(lockPassword, 10) : ''

    // 生成 JWT 密钥（64位十六进制随机字符串）
    const jwtSecret = crypto.randomBytes(32).toString('hex')

    // 写入数据库
    execute(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
      [username.trim(), passwordHash]
    )

    setSetting('lock_enabled', lockEnabled ? '1' : '0')
    setSetting('lock_password_hash', lockPasswordHash)
    setSetting('jwt_secret', jwtSecret)

    // 获取刚创建的用户，生成 token
    const user = queryOne('SELECT id, username, role FROM users WHERE username=?', [username.trim()])

    const token = generateToken(user)

    res.json({
      success: true,
      message: '安装完成！',
      token,
      user: { id: user.id, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error('安装失败:', err)
    // 检查唯一约束
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: '该账号已存在' })
    }
    res.status(500).json({ error: '安装失败: ' + err.message })
  }
})

export default router
