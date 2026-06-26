<template>
  <div class="game-view">
    <!-- 顶栏 -->
    <div class="game-topbar">
      <el-button :icon="ArrowLeft" text @click="router.back()">返回</el-button>
      <span class="game-title" v-if="game">{{ game.name }}</span>
      <div class="game-actions">
        <el-button :icon="FullScreen" circle @click="toggleFullscreen" />
        <el-button
          :icon="store.isFavorite(game?.id) ? StarFilled : Star"
          circle
          :type="store.isFavorite(game?.id) ? 'warning' : 'default'"
          @click="game && store.toggleFavorite(game.id)"
        />
        <el-button :icon="Setting" circle @click="showSettings = true" />
      </div>
    </div>

    <!-- 游戏区域 -->
    <div class="game-stage" ref="stageRef">
      <GamePlayer v-if="gameUrl" :key="gameUrl" :game-url="gameUrl" />
    </div>

    <!-- 设置弹窗 -->
    <el-dialog v-model="showSettings" title="播放设置" width="400px">
      <div class="setting-item">
        <span>自动播放</span>
        <el-select v-model="settingsStore.autoplay" style="width:120px">
          <el-option label="是" value="on" />
          <el-option label="否" value="off" />
        </el-select>
      </div>
      <div class="setting-item">
        <span>缩放模式</span>
        <el-select v-model="settingsStore.scale" style="width:120px">
          <el-option label="保持比例" value="showAll" />
          <el-option label="拉伸填满" value="exactFit" />
          <el-option label="保持裁切" value="noBorder" />
        </el-select>
      </div>
      <div class="setting-item">
        <span>渲染质量</span>
        <el-select v-model="settingsStore.quality" style="width:120px">
          <el-option label="低" value="low" />
          <el-option label="中" value="medium" />
          <el-option label="高" value="high" />
          <el-option label="最佳" value="best" />
        </el-select>
      </div>
      <div class="setting-item">
        <span>渲染器</span>
        <el-select v-model="settingsStore.preferredRenderer" style="width:120px">
          <el-option label="wgpu-webgl" value="wgpu-webgl" />
          <el-option label="webgpu" value="webgpu" />
          <el-option label="webgl" value="webgl" />
          <el-option label="canvas" value="canvas" />
        </el-select>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, FullScreen, Star, StarFilled, Setting } from '@element-plus/icons-vue'
import { useGamesStore } from '@/stores/games'
import { useSettingsStore } from '@/stores/settings'
import GamePlayer from '@/components/GamePlayer.vue'

const route = useRoute()
const router = useRouter()
const store = useGamesStore()
const settingsStore = useSettingsStore()

const stageRef = ref(null)
const showSettings = ref(false)

const gameId = computed(() => route.params.id)
const game = computed(() => store.currentGame)

const gameUrl = computed(() => {
  if (!game.value) return null
  // filepath 是相对 game/ 的路径，express.static 直接服务目录树
  return `/game/${encodeURI(game.value.filepath || game.value.filename)}`
})

function toggleFullscreen() {
  if (stageRef.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      stageRef.value.requestFullscreen()
    }
  }
}

onMounted(async () => {
  if (gameId.value) {
    await store.fetchGameById(gameId.value)
  }
})
</script>

<style scoped>
.game-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

.game-topbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.game-title {
  flex: 1;
  text-align: center;
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 16px;
}

.game-actions {
  display: flex;
  gap: 6px;
}

.game-stage {
  flex: 1;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0;
  font-size: 14px;
}
</style>
