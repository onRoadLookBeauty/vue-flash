<template>
  <div class="game-card" @click="goPlay">
    <div class="card-header" :style="{ background: categoryColor }">
      <span class="card-emoji">{{ categoryEmoji }}</span>
    </div>
    <div class="card-body">
      <h3 class="card-title" :title="game.name">{{ game.name }}</h3>
      <div class="card-tags">
        <span v-for="tag in tagList" :key="tag" class="tag-pill">{{ tag }}</span>
      </div>
      <p class="card-meta">
        <span v-if="game.size">{{ formatSize(game.size) }}</span>
        <span v-if="game.size && game.created_at"> · </span>
        <span v-if="game.created_at">{{ formatDate(game.created_at) }}</span>
      </p>
    </div>
    <el-button
      class="fav-btn"
      :class="{ active: liked }"
      :icon="liked ? StarFilled : Star"
      circle
      size="small"
      @click.stop="$emit('toggleFav', game.id)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, StarFilled } from '@element-plus/icons-vue'

const props = defineProps({
  game: { type: Object, required: true },
  liked: { type: Boolean, default: false },
})

defineEmits(['toggleFav'])
const router = useRouter()

const CATEGORY_CONFIG = {
  '射击类': { color: '#e74c3c', emoji: '🔫' },
  '动作类': { color: '#e67e22', emoji: '🥊' },
  '冒险类': { color: '#27ae60', emoji: '🗺️' },
  '益智类': { color: '#3498db', emoji: '🧩' },
  '策略类': { color: '#9b59b6', emoji: '♟️' },
  '体育类': { color: '#1abc9c', emoji: '⚽' },
  '休闲类': { color: '#2ecc71', emoji: '🎮' },
  '竞速类': { color: '#f39c12', emoji: '🏎️' },
  '格斗类': { color: '#c0392b', emoji: '👊' },
  '角色扮演': { color: '#8e44ad', emoji: '⚔️' },
  '模拟类': { color: '#16a085', emoji: '🏗️' },
  '音乐类': { color: '#d35400', emoji: '🎵' },
  '平台类': { color: '#2980b9', emoji: '🪜' },
  '防御类': { color: '#7f8c8d', emoji: '🛡️' },
}

// 从 tags 字段解析标签列表
const tagList = computed(() => {
  const tags = props.game.tags || props.game.category || '未分类'
  return tags.split(',').map(t => t.trim()).filter(Boolean)
})

const firstTag = computed(() => tagList.value[0] || '未分类')

const categoryInfo = computed(() => {
  return CATEGORY_CONFIG[firstTag.value] || { color: '#636e72', emoji: '🎯' }
})

const categoryColor = computed(() => categoryInfo.value.color)
const categoryEmoji = computed(() => categoryInfo.value.emoji)

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function goPlay() {
  router.push(`/play/${props.game.id}`)
}
</script>

<style scoped>
.game-card {
  position: relative;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: var(--shadow);
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: height 0.2s;
}

.game-card:hover .card-header {
  height: 88px;
}

.card-emoji {
  font-size: 36px;
}

.card-body {
  padding: 12px 16px;
}

.card-title {
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
  min-height: 20px;
}

.tag-pill {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgba(64, 158, 255, 0.15);
  color: var(--accent);
  white-space: nowrap;
  line-height: 18px;
}

.card-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.2s, transform 0.2s;
}

.game-card:hover .fav-btn,
.fav-btn.active {
  opacity: 1;
  transform: scale(1);
}

.fav-btn.active {
  color: #f7bf05;
}
</style>
