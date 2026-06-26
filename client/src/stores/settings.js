import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { apiGetLockStatus, apiUnlock } from '@/api'

const SETTINGS_KEY = 'flash_settings'
const LOCK_KEY = 'flash_lock'
const LOCK_HASH_KEY = 'flash_lock_hash'  // 锁版本标识，密码一变就失效

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
  const lockHash = ref('')             // 锁版本标识（密码哈希前缀）

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
      lockHash.value = res.data.lockHash || ''
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
        // 记住当前锁版本，密码变更后自动失效
        if (lockHash.value) {
          localStorage.setItem(LOCK_HASH_KEY, lockHash.value)
        }
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
    // 检查是否有本地解锁记录，且锁版本未变更
    if (localStorage.getItem(LOCK_KEY) === '1') {
      const storedHash = localStorage.getItem(LOCK_HASH_KEY) || ''
      // 没有存储过 hash（旧版本升级）或 hash 匹配 → 保持解锁
      if (!lockHash.value || storedHash === lockHash.value) {
        unlocked.value = true
        return true
      }
      // hash 不匹配 → 密码已被管理员修改，清除旧解锁状态
      localStorage.removeItem(LOCK_KEY)
      localStorage.removeItem(LOCK_HASH_KEY)
    }
    return false
  }

  function lock() {
    unlocked.value = false
    localStorage.removeItem(LOCK_KEY)
    localStorage.removeItem(LOCK_HASH_KEY)
  }

  return {
    theme, autoplay, scale, quality, preferredRenderer,
    lockEnabled, lockChecked, unlocked, lockHash,
    fetchLockStatus, tryUnlock, checkLocalUnlock, lock, saveSettings,
  }
})
