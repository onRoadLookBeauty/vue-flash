import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

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
export function rescanGames(password) {
  return api.post('/admin/scan', { password })
}

/** 更新游戏信息（支持 tags 多标签） */
export function updateGame(id, data, password) {
  return api.put(`/admin/games/${id}`, { ...data, password })
}

/** 添加分类 */
export function addCategory(name, password) {
  return api.post('/admin/categories', { name, password })
}

/** 删除分类 */
export function deleteCategory(name, password) {
  return api.delete(`/admin/categories/${encodeURIComponent(name)}`, { data: { password } })
}

export default api
