<template>
  <div class="home">
    <!-- 顶部导航 -->
    <header class="topbar">
      <div class="topbar-left">
        <h1 class="logo" @click="resetFilters">🎮 Flash Games</h1>
        <span class="game-count">{{ store.stats.total }} 个游戏</span>
      </div>
      <div class="topbar-right">
        <el-button
          :icon="showFavs ? StarFilled : Star"
          circle
          @click="showFavs = !showFavs"
          :type="showFavs ? 'warning' : 'default'"
        />
        <el-button :icon="Moon" circle @click="toggleTheme" />
        <el-button :icon="Setting" circle @click="showSettings = true" />
        <el-button :icon="Lock" circle @click="settingsStore.lock(); router.replace('/')" />
        <el-button :icon="Operation" circle @click="router.push('/admin')" />
      </div>
    </header>

    <!-- 搜索与筛选 -->
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索游戏名称..."
        clearable
        :prefix-icon="Search"
        class="search-input"
        @input="onSearch"
      />
      <el-select
        v-model="selectedCategory"
        placeholder="全部分类"
        clearable
        class="category-select"
        @change="onSearch"
      >
        <el-option
          v-for="cat in store.categories"
          :key="cat"
          :label="`${cat} (${store.stats.categories?.[cat] || 0})`"
          :value="cat"
        />
      </el-select>
      <el-select v-model="sortBy" class="sort-select" @change="onSearch">
        <el-option label="默认排序" value="default" />
        <el-option label="名称 A-Z" value="name_asc" />
        <el-option label="名称 Z-A" value="name_desc" />
        <el-option label="文件大小 ↓" value="size_desc" />
        <el-option label="文件大小 ↑" value="size_asc" />
        <el-option label="最近添加" value="date_desc" />
      </el-select>
    </div>

    <!-- 收藏标签 -->
    <div v-if="showFavs" class="fav-banner">
      ⭐ 收藏列表 ({{ store.favorites.length }})
    </div>

    <!-- 游戏网格 -->
    <div class="game-grid" v-loading="store.loading">
      <template v-if="displayGames.length">
        <GameCard
          v-for="game in displayGames"
          :key="game.id"
          :game="game"
          :liked="store.isFavorite(game.id)"
          @toggle-fav="store.toggleFavorite"
        />
      </template>
      <el-empty v-else description="没有找到游戏" />
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        layout="prev, pager, next"
        @current-change="onPageChange"
      />
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
      <div class="setting-item">
        <span>前端密码锁</span>
        <el-switch v-model="settingsStore.lockEnabled" />
      </div>
      <div class="setting-item" v-if="settingsStore.lockEnabled">
        <span>修改密码</span>
        <el-input v-model="newPassword" placeholder="留空不修改" show-password style="width:160px" />
        <el-button size="small" @click="updatePassword" :disabled="!newPassword">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, StarFilled, Moon, Setting, Lock, Operation } from '@element-plus/icons-vue'
import { useGamesStore } from '@/stores/games'
import { useSettingsStore } from '@/stores/settings'
import GameCard from '@/components/GameCard.vue'

const router = useRouter()
const store = useGamesStore()
const settingsStore = useSettingsStore()

const keyword = ref('')
const selectedCategory = ref('')
const sortBy = ref('default')
const showFavs = ref(false)
const showSettings = ref(false)
const newPassword = ref('')
const currentPage = ref(1)
const pageSize = 24

// 排序后的游戏列表
const sortedGames = computed(() => {
  let list = [...store.games]
  switch (sortBy.value) {
    case 'name_asc': list.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break
    case 'name_desc': list.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break
    case 'size_desc': list.sort((a, b) => (b.size || 0) - (a.size || 0)); break
    case 'size_asc': list.sort((a, b) => (a.size || 0) - (b.size || 0)); break
    case 'date_desc': list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break
  }
  return list
})

// 仅显示收藏
const favFiltered = computed(() => {
  if (!showFavs.value) return sortedGames.value
  return sortedGames.value.filter(g => store.isFavorite(g.id))
})

// 分页
const totalCount = computed(() => favFiltered.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize))
const displayGames = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return favFiltered.value.slice(start, start + pageSize)
})

let searchTimer = null
function onSearch() {
  currentPage.value = 1
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.fetchGames({
      keyword: keyword.value,
      category: selectedCategory.value,
    })
  }, 300)
}

function onPageChange() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetFilters() {
  keyword.value = ''
  selectedCategory.value = ''
  sortBy.value = 'default'
  showFavs.value = false
  currentPage.value = 1
  store.fetchGames()
}

function toggleTheme() {
  settingsStore.theme = settingsStore.theme === 'dark' ? 'light' : 'dark'
}

function updatePassword() {
  settingsStore.lockPassword = newPassword.value
  newPassword.value = ''
  ElMessage.success('密码已更新')
}

onMounted(() => {
  store.initHome()
})
</script>

<style scoped>
.home {
  min-height: 100%;
  padding: 0 0 40px;
}

/* ===== 顶部栏 ===== */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 20px;
  cursor: pointer;
  user-select: none;
}

.game-count {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--bg-primary);
  padding: 4px 10px;
  border-radius: 20px;
}

.topbar-right {
  display: flex;
  gap: 8px;
}

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
}

.search-input { flex: 1; max-width: 400px; }
.category-select { width: 180px; }
.sort-select { width: 150px; }

/* ===== 收藏横幅 ===== */
.fav-banner {
  margin: 0 24px 12px;
  padding: 8px 16px;
  background: rgba(247, 191, 5, 0.1);
  border: 1px solid rgba(247, 191, 5, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #f7bf05;
}

/* ===== 游戏网格 ===== */
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 0 24px;
  min-height: 200px;
}

/* ===== 分页 ===== */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* ===== 设置弹窗 ===== */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 14px 0;
  font-size: 14px;
  gap: 8px;
}

.setting-item span {
  color: var(--text-primary);
  flex-shrink: 0;
}
</style>
