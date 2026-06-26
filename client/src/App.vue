<template>
  <div class="app-shell" :data-theme="settingsStore.theme">
    <!-- 系统未初始化 → 显示空白，由路由跳转到 Setup -->
    <template v-if="!setupChecked">
      <div class="loading-screen">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    </template>

    <!-- 前端锁 -->
    <LockScreen v-else-if="!settingsStore.unlocked" />

    <!-- 正常内容 -->
    <router-view v-else v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { getSetupStatus } from '@/api'
import LockScreen from '@/components/LockScreen.vue'

const router = useRouter()
const route = useRoute()
const settingsStore = useSettingsStore()
const setupChecked = ref(false)

onMounted(async () => {
  // 第一步：检查系统是否已初始化
  try {
    const res = await getSetupStatus()
    const initialized = res.data.initialized

    if (!initialized) {
      // 未初始化，跳过锁直接进入安装页
      settingsStore.unlocked = true
      setupChecked.value = true
      if (route.path !== '/setup') {
        router.replace('/setup')
      }
      return
    }

    // 已初始化但当前在 setup 页面，重定向到首页
    if (route.path === '/setup') {
      settingsStore.unlocked = true
      setupChecked.value = true
      router.replace('/')
      return
    }
  } catch {
    // API 不可用，默认解锁允许进入
    settingsStore.unlocked = true
  }

  // 第二步：获取前端锁状态
  await settingsStore.fetchLockStatus()

  // 第三步：检查本地解锁状态
  settingsStore.checkLocalUnlock()

  setupChecked.value = true
})
</script>

<style>
.app-shell {
  height: 100%;
  background: var(--bg-primary);
}

.loading-screen {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 16px;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
