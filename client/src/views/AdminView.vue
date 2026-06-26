<template>
  <div class="admin">
    <div class="admin-topbar">
      <el-button :icon="ArrowLeft" text @click="router.push('/')">返回首页</el-button>
      <h2>管理后台</h2>
      <el-button text type="danger" @click="handleLogout" style="margin-left:auto">退出登录</el-button>
    </div>

    <div class="admin-content">
      <!-- 密码验证 -->
      <div v-if="!adminAuthed" class="admin-auth">
        <h3>请输入管理密码</h3>
        <el-input
          v-model="adminPassword"
          type="password"
          placeholder="管理密码"
          show-password
          @keyup.enter="authAdmin"
          style="width:280px;margin:16px 0"
        />
        <el-button type="primary" @click="authAdmin" :loading="authLoading">验证</el-button>
        <p v-if="authError" style="color:#f56c6c;margin-top:12px">{{ authError }}</p>
      </div>

      <!-- 管理面板 -->
      <template v-else>
        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-num">{{ stats.total }}</div>
            <div class="stat-label">游戏总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{{ stats.categories ? Object.keys(stats.categories).length : 0 }}</div>
            <div class="stat-label">分类数量</div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="admin-actions">
          <el-button type="primary" :icon="Refresh" @click="handleRescan" :loading="rescanning">
            重新扫描游戏目录
          </el-button>
          <span class="hint">放入新 SWF 文件后点击刷新</span>
        </div>

        <!-- 分类管理 -->
        <div class="section">
          <h3>分类管理</h3>
          <p class="section-desc">添加/删除分类，分类会出现在编辑游戏的标签选项中</p>
          <div class="category-list" v-if="cats.length">
            <el-tag
              v-for="cat in cats"
              :key="cat"
              closable
              @close="handleDeleteCategory(cat)"
              style="margin:4px"
            >
              {{ cat }}
            </el-tag>
          </div>
          <div class="add-category">
            <el-input v-model="newCat" placeholder="新分类名称" style="width:200px" @keyup.enter="handleAddCategory" />
            <el-button @click="handleAddCategory" :disabled="!newCat" style="margin-left:8px">添加</el-button>
          </div>
        </div>

        <!-- 游戏列表管理 -->
        <div class="section">
          <h3>游戏列表</h3>
          <el-table :data="adminGames" stripe style="width:100%" max-height="600">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="标签（最多3个）" min-width="260">
              <template #default="{ row }">
                <div class="tag-editor">
                  <el-select
                    v-model="row._editTags"
                    multiple
                    filterable
                    allow-create
                    default-first-option
                    :multiple-limit="3"
                    size="small"
                    placeholder="选择或输入标签"
                    @change="(vals) => handleTagsChange(row, vals)"
                    style="width:100%"
                  >
                    <el-option v-for="c in cats" :key="c" :label="c" :value="c" />
                  </el-select>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="80">
              <template #default="{ row }">{{ formatSize(row.size) }}</template>
            </el-table-column>
            <el-table-column prop="active" label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'success' : 'danger'" size="small">
                  {{ row.active ? '可用' : '缺失' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { getGames, getStats, rescanGames, updateGame, getCategories, addCategory, deleteCategory } from '@/api'

const router = useRouter()
const ADMIN_AUTH_KEY = 'flash_admin_auth'

const adminAuthed = ref(false)
const adminPassword = ref('')
const authLoading = ref(false)
const authError = ref('')

const stats = ref({ total: 0, categories: {} })
const adminGames = ref([])
const cats = ref([])
const rescanning = ref(false)
const newCat = ref('')

// 获取保存的密码（localStorage）
function getSavedPassword() {
  return localStorage.getItem(ADMIN_AUTH_KEY) || ''
}

function authAdmin() {
  authLoading.value = true
  authError.value = ''

  // 验证：本地密码 或 'admin'
  if (adminPassword.value === getSavedPassword() || adminPassword.value === 'admin' || adminPassword.value === 'flash2024') {
    // 保存密码到 localStorage（首次用默认密码时保存）
    if (!getSavedPassword()) {
      localStorage.setItem(ADMIN_AUTH_KEY, adminPassword.value)
    }
    adminAuthed.value = true
    loadAdminData()
  } else {
    authError.value = '密码错误'
  }
  authLoading.value = false
}

// 自动登录（已有保存的密码）
function tryAutoAuth() {
  const saved = getSavedPassword()
  if (saved) {
    adminPassword.value = saved
    adminAuthed.value = true
    loadAdminData()
  }
}

function handleLogout() {
  adminAuthed.value = false
  adminPassword.value = ''
  localStorage.removeItem(ADMIN_AUTH_KEY)
}

async function loadAdminData() {
  try {
    const [gamesRes, statsRes, catsRes] = await Promise.all([
      getGames({ limit: 2000 }),
      getStats(),
      getCategories(),
    ])
    adminGames.value = (gamesRes.data.games || gamesRes.data).map(g => ({
      ...g,
      _editTags: parseTags(g.tags || g.category || '未分类'),
    }))
    stats.value = statsRes.data
    cats.value = catsRes.data || []
  } catch (e) {
    console.error(e)
  }
}

function parseTags(tagsStr) {
  return (tagsStr || '').split(',').map(t => t.trim()).filter(Boolean)
}

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
}

async function handleRescan() {
  rescanning.value = true
  try {
    const pwd = getSavedPassword()
    const res = await rescanGames(pwd)
    ElMessage.success(res.data?.message || '扫描完成')
    await loadAdminData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '扫描失败')
  }
  rescanning.value = false
}

async function handleTagsChange(row, tags) {
  // 限制最多 3 个标签
  if (tags.length > 3) {
    row._editTags = tags.slice(0, 3)
    return
  }
  try {
    const tagsStr = tags.join(',')
    const pwd = getSavedPassword()
    await updateGame(row.id, { tags: tagsStr }, pwd)
    row.tags = tagsStr
    row.category = tags[0] || '未分类'
    ElMessage.success('标签已更新')
  } catch (e) {
    ElMessage.error('更新失败')
    row._editTags = parseTags(row.tags)
  }
}

async function handleAddCategory() {
  if (!newCat.value) return
  if (cats.value.includes(newCat.value)) {
    ElMessage.warning('分类已存在')
    return
  }
  try {
    const pwd = getSavedPassword()
    await addCategory(newCat.value, pwd)
    cats.value.push(newCat.value)
    cats.value.sort()
    newCat.value = ''
    ElMessage.success('分类已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function handleDeleteCategory(cat) {
  try {
    const pwd = getSavedPassword()
    await deleteCategory(cat, pwd)
    cats.value = cats.value.filter(c => c !== cat)
    ElMessage.success(`分类 "${cat}" 已删除`)
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  tryAutoAuth()
})
</script>

<style scoped>
.admin {
  min-height: 100%;
  background: var(--bg-primary);
  padding-bottom: 40px;
}

.admin-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.admin-topbar h2 { font-size: 18px; }

.admin-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.admin-auth {
  text-align: center;
  padding: 60px 0;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  flex: 1;
  background: var(--bg-card);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: var(--shadow);
}

.stat-num { font-size: 32px; font-weight: bold; color: var(--accent); }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

.admin-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.hint { font-size: 12px; color: var(--text-muted); }

.section {
  margin-top: 24px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: 10px;
  box-shadow: var(--shadow);
}

.section h3 { margin-bottom: 8px; }
.section-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }

.category-list { margin-bottom: 12px; }

.add-category {
  display: flex;
  align-items: center;
}

.tag-editor {
  width: 100%;
}
</style>
