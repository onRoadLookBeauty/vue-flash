const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'flash2024'

/**
 * 简单的管理密码验证中间件
 */
export function adminAuth(req, res, next) {
  const password = req.body?.password || req.query?.password || req.headers['x-admin-password']

  if (!password) {
    return res.status(401).json({ error: '缺少管理密码' })
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: '密码错误' })
  }

  next()
}
