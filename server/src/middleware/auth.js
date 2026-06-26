import jwt from 'jsonwebtoken'
import { getSetting } from '../db.js'

/**
 * 获取 JWT 密钥（从 settings 表读取，首次安装时生成）
 */
function getJwtSecret() {
  return getSetting('jwt_secret') || null
}

/**
 * JWT 管理后台鉴权中间件
 * 从 Authorization 头提取 Bearer token 并验证
 */
export function adminAuth(req, res, next) {
  const secret = getJwtSecret()
  if (!secret) {
    return res.status(500).json({ error: '系统未初始化，请先完成安装' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  const token = authHeader.slice(7)
  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded // { id, username, role }
    next()
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

/**
 * 生成 JWT token（24小时有效期）
 */
export function generateToken(user) {
  const secret = getJwtSecret()
  if (!secret) throw new Error('JWT 密钥未配置')
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: '24h' }
  )
}
