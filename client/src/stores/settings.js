import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SETTINGS_KEY = 'flash_settings'
const LOCK_KEY = 'flash_lock'
const DEFAULT_PASSWORD = 'flash2024'

export const useSettingsStore = defineStore('settings', () => {
  // ========== 界面设置 ==========
  const theme = ref(loadSetting('theme', 'dark'))
  const autoplay = ref(loadSetting('autoplay', 'on'))
  const scale = ref(loadSetting('scale', 'showAll'))
  const quality = ref(loadSetting('quality', 'high'))
  const preferredRenderer = ref(loadSetting('preferredRenderer', 'wgpu-webgl'))

  // ========== 前端锁 ==========
  const lockEnabled = ref(loadSetting('lockEnabled', true))
  const lockPassword = ref(loadSetting('lockPassword', DEFAULT_PASSWORD))
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
      lockEnabled: lockEnabled.value,
      lockPassword: lockPassword.value,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj))
  }

  // 监听变化自动保存
  watch([theme, autoplay, scale, quality, preferredRenderer, lockEnabled, lockPassword], saveSettings, { deep: true })

  // ========== 锁相关方法 ==========
  function tryUnlock(password) {
    if (password === lockPassword.value) {
      unlocked.value = true
      localStorage.setItem(LOCK_KEY, '1')
      return true
    }
    return false
  }

  function checkUnlocked() {
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
    lockEnabled, lockPassword, unlocked,
    tryUnlock, checkUnlocked, lock, saveSettings,
  }
})
