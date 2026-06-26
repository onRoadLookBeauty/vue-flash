import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiPostLogin } from '@/api'

const TOKEN_KEY = 'flash_admin_token'
const USER_KEY = 'flash_admin_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(loadUser())

  function loadUser() {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await apiPostLogin(username, password)
    const { token: t, user: u } = res.data
    token.value = t
    user.value = u
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    return u
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isLoggedIn, login, logout }
})
