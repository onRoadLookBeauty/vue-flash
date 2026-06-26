<template>
  <div class="admin">
    <div class="admin-topbar">
      <el-button :icon="ArrowLeft" text @click="router.push('/')">返回首页</el-button>
      <h2>管理后台</h2>
      <el-button v-if="authStore.isLoggedIn" text type="danger" @click="handleLogout" style="margin-left:auto">退出登录</el-button>
    </div>

    <div class="admin-content">
      <!-- 登录表单 -->
      <div v-if="!authStore.isLoggedIn" class="login-shell">
        <div class="login-card">
          <div class="login-header">
            <div class="login-icon">🔑</div>
            <h2>管理员登录</h2>
            <p>请使用安装时设置的管理员账号登录</p>
          </div>
          <el-form @submit.prevent="handleLogin" class="login-form">
            <el-form-item>
              <el-input
                v-model="loginForm.username"
                placeholder="管理员账号"
                :prefix-icon="User"
                size="large"
                @keyup.enter="focusPassword"
              />
            </el-form-item>
            <el-form-item>
              <el-input
                v-model="loginForm.password"
                ref="pwdInput"
                type="password"
                placeholder="管理员密码"
                show-password
                :prefix-icon="Lock"
                size="large"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" @click="handleLogin" :loading="loginLoading" class="login-btn">
                登 录
              </el-button>
            </el-form-item>
          </el-form>
          <p v-if="loginError" class="login-error">{{ loginError }}</p>
        </div>
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

        <!-- 前端锁管理 -->
        <div class="section">
          <h3>🔒 前端锁管理</h3>
          <p class="section-desc">控制访客是否需要密码才能访问游戏页面</p>
          <div class="lock-admin">
            <div class="lock-row">
              <span>启用前端锁：</span>
              <el-switch v-model="lockSettings.lockEnabled" @change="handleLockToggle" :loading="lockSaving" />
              <span style="margin-left:8px;font-size:12px;color:var(--text-muted)">
                {{ lockSettings.lockEnabled ? '已开启，访客需输入密码' : '已关闭，访客可直接访问' }}
              </span>
            </div>
            <div v-if="lockSettings.lockEnabled" class="lock-row" style="margin-top:12px">
              <span>修改锁密码：</span>
              <el-input
                v-model="lockSettings.newPassword"
                type="password"
                placeholder="新密码（留空不修改）"
                show-password
                style="width:200px;margin:0 8px"
              />
              <el-button size="small" @click="handleUpdateLockPassword" :loading="lockSaving" :disabled="!lockSettings.newPassword">
                保存
              </el-button>
            </div>
          </div>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Refresh, User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import {
  getGames, getStats, rescanGames, updateGame, getCategories,
  addCategory, deleteCategory, apiGetLockSettings, apiUpdateLockSettings,
} from '@/api'

const router = useRouter()
const authStore = useAuthStore()

// 登录
const loginForm = reactive({ username: '', password: '' })
const loginLoading = ref(false)
const loginError = ref('')
const pwdInput = ref(null)

function focusPassword() {
  pwdInput.value?.focus()
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    loginError.value = '请输入账号和密码'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    await authStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    await loadAdminData()
  } catch (e) {
    loginError.value = e.response?.data?.error || '登录失败'
  } finally {
    loginLoading.value = false
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

// 管理数据
const stats = ref({ total: 0, categories: {} })
const adminGames = ref([])
const cats = ref([])
const rescanning = ref(false)
const newCat = ref('')

// 前端锁设置
const lockSaving = ref(false)
const lockSettings = reactive({
  lockEnabled: false,
  newPassword: '',
})

async function loadLockSettings() {
  try {
    const res = await apiGetLockSettings()
    lockSettings.lockEnabled = res.data.lockEnabled
  } catch {}
}

async function handleLockToggle(val) {
  lockSaving.value = true
  try {
    await apiUpdateLockSettings({ lockEnabled: val })
    ElMessage.success(val ? '前端锁已开启' : '前端锁已关闭')
  } catch (e) {
    lockSettings.lockEnabled = !val // 回滚
    ElMessage.error('保存失败')
  }
  lockSaving.value = false
}

async function handleUpdateLockPassword() {
  if (!lockSettings.newPassword) return
  lockSaving.value = true
  try {
    await apiUpdateLockSettings({ lockPassword: lockSettings.newPassword })
    lockSettings.newPassword = ''
    ElMessage.success('锁密码已更新')
  } catch (e) {
    ElMessage.error('保存失败')
  }
  lockSaving.value = false
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
    const res = await rescanGames()
    ElMessage.success(res.data?.message || '扫描完成')
    await loadAdminData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '扫描失败')
  }
  rescanning.value = false
}

async function handleTagsChange(row, tags) {
  if (tags.length > 3) {
    row._editTags = tags.slice(0, 3)
    return
  }
  try {
    const tagsStr = tags.join(',')
    await updateGame(row.id, { tags: tagsStr })
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
    await addCategory(newCat.value)
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
    await deleteCategory(cat)
    cats.value = cats.value.filter(c => c !== cat)
    ElMessage.success(`分类 "${cat}" 已删除`)
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  // 如果已登录，直接加载数据
  if (authStore.isLoggedIn) {
    loadAdminData()
    loadLockSettings()
  }
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

/* ===== 登录页 ===== */
.login-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  padding: 40px 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card, #fff);
  border-radius: 16px;
  padding: 40px 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-header h2 {
  font-size: 22px;
  color: var(--text-primary, #333);
  margin-bottom: 8px;
}

.login-header p {
  font-size: 13px;
  color: var(--text-muted, #999);
}

.login-form {
  margin-top: 8px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-btn {
  width: 100%;
}

.login-error {
  color: #f56c6c;
  text-align: center;
  font-size: 14px;
  margin-top: 8px;
}

/* ===== 管理面板 ===== */

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

.lock-admin {
  padding-top: 4px;
}

.lock-row {
  display: flex;
  align-items: center;
}

.category-list { margin-bottom: 12px; }

.add-category {
  display: flex;
  align-items: center;
}

.tag-editor {
  width: 100%;
}
</style>
