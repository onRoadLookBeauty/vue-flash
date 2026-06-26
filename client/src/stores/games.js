import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getGames, getCategories, getGameById, getStats } from '@/api'

const FAVORITES_KEY = 'flash_favorites'

export const useGamesStore = defineStore('games', () => {
  const games = ref([])
  const categories = ref([])
  const stats = ref({ total: 0, categories: {} })
  const loading = ref(false)
  const currentGame = ref(null)

  // 收藏列表 (localStorage)
  const favorites = ref(loadFavorites())

  const favoriteIds = computed(() => new Set(favorites.value))

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    } catch { return [] }
  }

  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.value))
  }

  function toggleFavorite(id) {
    const idx = favorites.value.indexOf(id)
    if (idx > -1) {
      favorites.value.splice(idx, 1)
    } else {
      favorites.value.push(id)
    }
    saveFavorites()
  }

  function isFavorite(id) {
    return favoriteIds.value.has(id)
  }

  // 获取游戏列表
  async function fetchGames(params = {}) {
    loading.value = true
    try {
      const res = await getGames(params)
      games.value = res.data.games || res.data
    } catch (err) {
      console.error('获取游戏列表失败:', err)
      games.value = []
    } finally {
      loading.value = false
    }
  }

  // 获取分类列表
  async function fetchCategories() {
    try {
      const res = await getCategories()
      categories.value = res.data || []
    } catch { categories.value = [] }
  }

  // 获取单个游戏
  async function fetchGameById(id) {
    try {
      const res = await getGameById(id)
      currentGame.value = res.data
      return res.data
    } catch (err) {
      console.error('获取游戏详情失败:', err)
      return null
    }
  }

  // 获取统计
  async function fetchStats() {
    try {
      const res = await getStats()
      stats.value = res.data
    } catch {}
  }

  // 首页数据初始化
  async function initHome() {
    await Promise.all([fetchGames(), fetchCategories(), fetchStats()])
  }

  return {
    games, categories, stats, loading, currentGame,
    favorites, favoriteIds,
    isFavorite, toggleFavorite,
    fetchGames, fetchCategories, fetchGameById, fetchStats,
    initHome,
  }
})
