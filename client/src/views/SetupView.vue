<template>
  <div class="setup-screen">
    <div class="setup-card">
      <div class="setup-header">
        <div class="setup-icon">🎮</div>
        <h1>欢迎使用 Flash Games</h1>
        <p>首次使用，请完成系统初始化配置</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleSubmit"
      >
        <!-- 管理员账号 -->
        <div class="form-section">
          <h3>🔑 管理员账号</h3>
          <p class="section-desc">用于登录管理后台，管理游戏和系统设置</p>

          <el-form-item label="管理员账号" prop="username">
            <el-input
              v-model="form.username"
              placeholder="设置管理员用户名"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item label="管理员密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="设置管理员密码（至少4位）"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>
        </div>

        <!-- 前端锁 -->
        <div class="form-section">
          <h3>🔒 前端访问锁</h3>
          <p class="section-desc">开启后，访客首次进入需输入密码才能浏览游戏</p>

          <el-form-item label="启用前端锁">
            <el-switch v-model="form.lockEnabled" />
          </el-form-item>

          <template v-if="form.lockEnabled">
            <el-form-item label="前端锁密码" prop="lockPassword">
              <el-input
                v-model="form.lockPassword"
                type="password"
                placeholder="设置前端访问密码"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>

            <el-form-item label="确认前端锁密码" prop="confirmLockPassword">
              <el-input
                v-model="form.confirmLockPassword"
                type="password"
                placeholder="再次输入前端密码"
                show-password
                :prefix-icon="Lock"
              />
            </el-form-item>
          </template>
        </div>

        <!-- 提交 -->
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSubmit"
          class="setup-btn"
        >
          完成安装
        </el-button>

        <p v-if="error" class="setup-error">{{ error }}</p>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { doSetup } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  lockEnabled: false,
  lockPassword: '',
  confirmLockPassword: '',
})

const loading = ref(false)
const error = ref('')

// 自定义校验：确认密码
const validateConfirmPwd = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次密码不一致'))
  } else {
    callback()
  }
}

const validateConfirmLockPwd = (rule, value, callback) => {
  if (form.lockEnabled && value !== form.lockPassword) {
    callback(new Error('两次前端锁密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' },
    { min: 2, max: 30, message: '账号长度 2-30 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入管理员密码', trigger: 'blur' },
    { min: 4, message: '密码至少4位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPwd, trigger: 'blur' },
  ],
  lockPassword: [
    { required: true, message: '请输入前端锁密码', trigger: 'blur' },
    { min: 2, message: '至少2位', trigger: 'blur' },
  ],
  confirmLockPassword: [
    { required: true, message: '请确认前端锁密码', trigger: 'blur' },
    { validator: validateConfirmLockPwd, trigger: 'blur' },
  ],
}

const formRef = ref(null)

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  error.value = ''

  try {
    const res = await doSetup({
      username: form.username,
      password: form.password,
      lockEnabled: form.lockEnabled,
      lockPassword: form.lockEnabled ? form.lockPassword : '',
    })

    // 保存 token 和用户信息
    const { token, user } = res.data
    localStorage.setItem('flash_admin_token', token)
    localStorage.setItem('flash_admin_user', JSON.stringify(user))
    authStore.token = token
    authStore.user = user

    ElMessage.success('安装完成！')
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || '安装失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.setup-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding: 40px 20px;
}

[data-theme='light'] .setup-screen {
  background: linear-gradient(135deg, #e0e0e0, #f5f5f5, #e8e8e8);
}

.setup-card {
  background: var(--bg-card, #ffffff);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.setup-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.setup-header h1 {
  font-size: 22px;
  color: var(--text-primary, #333);
  margin-bottom: 8px;
}

.setup-header p {
  font-size: 14px;
  color: var(--text-secondary, #999);
}

.form-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #eee);
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  font-size: 15px;
  color: var(--text-primary, #333);
  margin-bottom: 4px;
}

.section-desc {
  font-size: 12px;
  color: var(--text-muted, #bbb);
  margin-bottom: 16px;
}

.setup-btn {
  width: 100%;
  margin-top: 8px;
}

.setup-error {
  color: #f56c6c;
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}
</style>
