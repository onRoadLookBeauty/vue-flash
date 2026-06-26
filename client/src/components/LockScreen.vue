<template>
  <div class="lock-screen">
    <div class="lock-card">
      <div class="lock-icon">🎮</div>
      <h2>Flash Games</h2>
      <p class="lock-desc">输入密码以继续</p>
      <el-input
        v-model="password"
        type="password"
        placeholder="请输入密码"
        show-password
        @keyup.enter="handleSubmit"
        class="lock-input"
      />
      <el-button type="primary" @click="handleSubmit" class="lock-btn" :loading="loading">
        解锁
      </el-button>
      <p v-if="error" class="lock-error">密码错误，请重试</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['unlock'])

const password = ref('')
const loading = ref(false)
const error = ref(false)

function handleSubmit() {
  loading.value = true
  error.value = false
  setTimeout(() => {
    const ok = emit('unlock', password.value) // 父组件会调用 settingsStore.tryUnlock
    if (!ok) {
      error.value = true
      password.value = ''
    }
    loading.value = false
  }, 300)
}
</script>

<style scoped>
.lock-screen {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
}

[data-theme='light'] .lock-screen {
  background: linear-gradient(135deg, #e0e0e0, #f5f5f5, #e8e8e8);
}

.lock-card {
  text-align: center;
  padding: 48px 40px;
  border-radius: 16px;
  background: var(--bg-card);
  box-shadow: var(--shadow);
  width: 360px;
}

.lock-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

h2 {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.lock-desc {
  color: var(--text-secondary);
  margin-bottom: 24px;
  font-size: 14px;
}

.lock-input {
  margin-bottom: 16px;
}

.lock-btn {
  width: 100%;
}

.lock-error {
  color: #f56c6c;
  margin-top: 12px;
  font-size: 13px;
}
</style>
