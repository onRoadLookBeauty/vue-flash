<template>
  <div class="app-shell" :data-theme="settingsStore.theme">
    <LockScreen v-if="!settingsStore.unlocked" @unlock="settingsStore.tryUnlock($event)" />
    <router-view v-else v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import LockScreen from '@/components/LockScreen.vue'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.checkUnlocked()
})
</script>

<style>
.app-shell {
  height: 100%;
  background: var(--bg-primary);
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
