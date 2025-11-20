<template>
  <div class="auth-callback">
    <div class="loading-container">
      <div class="spinner"></div>
      <h2>正在處理登入...</h2>
      <p>請稍候，我們正在完成您的登入流程</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { message } from 'ant-design-vue'

const router = useRouter()

onMounted(async () => {
  try {
    // 處理 OAuth 回調
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw error
    }
    
    if (data.session) {
      message.success('登入成功！')
      // 登入成功，導向首頁或之前的頁面
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/'
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectTo)
    } else {
      // 沒有 session，返回首頁
      message.warning('登入未完成')
      router.push('/')
    }
  } catch (error) {
    console.error('Auth callback 錯誤:', error)
    message.error('登入過程發生錯誤，請重試')
    router.push('/')
  }
})
</script>

<style scoped>
@import '/src/assets/main.css';

.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
  background: var(--bg-color);
}

.loading-container {
  text-align: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

p {
  margin: 0;
  font-size: 16px;
}
</style>
