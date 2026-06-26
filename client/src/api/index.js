import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// ========== 请求拦截器：自动附加 JWT token ==========
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flash_admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ========== 响应拦截器：401 自动清除过期 token ==========
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('flash_admin_token')
      localStorage.removeItem('flash_admin_user')
    }
    return Promise.reject(error)
  }
)

// ============= 安装引导 =============

/** 检查是否已初始化 */
export function getSetupStatus() {
  return api.get('/setup/status')
}

/** 执行首次安装 */
export function doSetup(data) {
  return api.post('/setup', data)
}

// ============= 管理登录 =============

/** 管理员登录 */
export function apiPostLogin(username, password) {
  return api.post('/admin/login', { username, password })
}

// ============= 前端锁 =============

/** 获取前端锁状态（公开） */
export function apiGetLockStatus() {
  return api.get('/settings/lock')
}

/** 验证前端锁密码（公开） */
export function apiUnlock(password) {
  return api.post('/unlock', { password })
}

/** 获取前端锁配置（管理员） */
export function apiGetLockSettings() {
  return api.get('/admin/settings/lock')
}

/** 更新前端锁配置（管理员） */
export function apiUpdateLockSettings(data) {
  return api.put('/admin/settings/lock', data)
}

// ============= 游戏相关 =============

/** 获取游戏列表 (支持搜索、分类筛选、分页) */
export function getGames(params = {}) {
  return api.get('/games', { params })
}

/** 获取单个游戏详情 */
export function getGameById(id) {
  return api.get(`/games/${id}`)
}

/** 获取所有分类 */
export function getCategories() {
  return api.get('/categories')
}

/** 获取统计信息 */
export function getStats() {
  return api.get('/stats')
}

// ============= 管理相关 =============

/** 触发重新扫描游戏目录 */
export function rescanGames() {
  return api.post('/admin/scan')
}

/** 更新游戏信息（支持 tags 多标签） */
export function updateGame(id, data) {
  return api.put(`/admin/games/${id}`, data)
}

/** 添加分类 */
export function addCategory(name) {
  return api.post('/admin/categories', { name })
}

/** 删除分类 */
export function deleteCategory(name) {
  return api.delete(`/admin/categories/${encodeURIComponent(name)}`)
}

export default api
