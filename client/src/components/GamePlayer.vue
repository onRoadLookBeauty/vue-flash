<template>
  <div class="game-player" ref="containerRef">
    <div v-if="loading" class="player-loading">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    <div v-if="error" class="player-error">
      <p>⚠️ 游戏加载失败</p>
      <p class="error-detail">{{ error }}</p>
      <el-button @click="reload">重试</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  gameUrl: { type: String, required: true },
})

const settingsStore = useSettingsStore()
const containerRef = ref(null)
const loading = ref(true)
const error = ref(null)

let player = null

function buildConfig() {
  return {
    publicPath: '/ruffle/',          // WASM 文件路径
    autoplay: settingsStore.autoplay,
    unmuteOverlay: 'hidden',
    scale: settingsStore.scale,
    forceScale: true,
    forceAlign: true,
    letterbox: 'on',
    preferredRenderer: settingsStore.preferredRenderer,
    quality: settingsStore.quality,
    logLevel: 'error',
    warnOnUnsupportedContent: false,
    openUrlMode: 'deny',
    allowNetworking: 'none',
    allowScriptAccess: false,
  }
}

function createPlayer() {
  try {
    const ruffleGlobal = window.RufflePlayer
    if (!ruffleGlobal) {
      error.value = 'Ruffle 未加载，请刷新页面'
      return false
    }

    // 设置配置
    ruffleGlobal.config = buildConfig()

    const ruffle = ruffleGlobal.newest()
    player = ruffle.createPlayer()
    player.style.width = '100%'
    player.style.height = '100%'

    if (containerRef.value) {
      containerRef.value.innerHTML = ''
      containerRef.value.appendChild(player)
    }
    return true
  } catch (e) {
    error.value = 'Ruffle 初始化失败: ' + e.message
    return false
  }
}

function loadGame(url) {
  loading.value = true
  error.value = null
  if (player) {
    try {
      player.load(url)
      loading.value = false
    } catch (e) {
      error.value = e.message
      loading.value = false
    }
  }
}

function reload() {
  if (player) player.remove()
  player = null
  if (createPlayer()) {
    loadGame(props.gameUrl)
  }
}

onMounted(() => {
  if (createPlayer() && props.gameUrl) {
    loadGame(props.gameUrl)
  }
})

onUnmounted(() => {
  if (player) {
    player.remove()
    player = null
  }
})

watch(() => props.gameUrl, (newUrl) => {
  if (newUrl) loadGame(newUrl)
})

watch(
  () => [settingsStore.preferredRenderer, settingsStore.quality, settingsStore.scale, settingsStore.autoplay],
  () => {
    if (player) reload()
  }
)
</script>

<style scoped>
.game-player {
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
}

.player-loading,
.player-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  gap: 12px;
}

.player-error {
  color: #f56c6c;
}

.error-detail {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 400px;
  text-align: center;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
