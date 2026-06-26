import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { apiGetLockStatus, apiUnlock } from '@/api'

const SETTINGS_KEY = 'flash_settings'
const LOCK_KEY = 'flash_lock'

export const useSettingsStore = defineStore('settings', () => {
  // ========== 界面设置 ==========
  const theme = ref(loadSetting('theme', 'dark'))
  const autoplay = ref(loadSetting('autoplay', 'on'))
  const scale = ref(loadSetting('scale', 'showAll'))
  const quality = ref(loadSetting('quality', 'high'))
  const preferredRenderer = ref(loadSetting('preferredRenderer', 'wgpu-webgl'))

  // ========== 前端锁（配置来自服务端） ==========
  const lockEnabled = ref(false)       // 服务端控制开关
  const lockChecked = ref(false)       // 是否已从服务端获取锁状态
  const unlocked = ref(false)

  function loadSetting(key, defaultValue) {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) {
        const obj = JSON.parse(saved)
        if (obj[key] !== undefined) return obj[key]
      }
    } catch {}
    return defaultValue
  }

  function saveSettings() {
    const obj = {
      theme: theme.value,
      autoplay: autoplay.value,
      scale: scale.value,
      quality: quality.value,
      preferredRenderer: preferredRenderer.value,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj))
  }

  // 监听变化自动保存
  watch([theme, autoplay, scale, quality, preferredRenderer], saveSettings, { deep: true })

  // ========== 从服务端获取锁状态 ==========
  async function fetchLockStatus() {
    try {
      const res = await apiGetLockStatus()
      lockEnabled.value = res.data.lockEnabled
      lockChecked.value = true
      // 如果没有开启锁，直接解锁
      if (!lockEnabled.value) {
        unlocked.value = true
      }
    } catch {
      // 服务端不可用时默认解锁
      lockChecked.value = true
      unlocked.value = true
    }
  }

  // ========== 解锁验证（调用服务端） ==========
  async function tryUnlock(password) {
    try {
      const res = await apiUnlock(password)
      if (res.data.success) {
        unlocked.value = true
        localStorage.setItem(LOCK_KEY, '1')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // ========== 检查本地解锁状态 ==========
  function checkLocalUnlock() {
    if (!lockEnabled.value) {
      unlocked.value = true
      return true
    }
    if (localStorage.getItem(LOCK_KEY) === '1') {
      unlocked.value = true
      return true
    }
    return false
  }

  function lock() {
    unlocked.value = false
    localStorage.removeItem(LOCK_KEY)
  }

  return {
    theme, autoplay, scale, quality, preferredRenderer,
    lockEnabled, lockChecked, unlocked,
    fetchLockStatus, tryUnlock, checkLocalUnlock, lock, saveSettings,
  }
})
