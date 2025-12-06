import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd, { Segmented } from 'ant-design-vue'
import "@/utils/logger"
import { initAuthStore } from '@/utils/authStore'

const app = createApp(App)

async function bootstrap() {
  // 先初始化登入狀態,避免刷新的第一個路由判斷拿到空的 user
  await initAuthStore()

  app.use(router)
  app.use(Antd)

  await router.isReady()
  app.mount('#app')
  
  // 成功載入後清除重新載入標記
  sessionStorage.removeItem('chunk-load-error-reloaded')
}

// 全域錯誤處理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 錯誤:', err, info)
  
  // 檢查是否為 chunk load error
  if (err.message?.includes('Failed to fetch dynamically imported module')) {
    const hasReloaded = sessionStorage.getItem('chunk-load-error-reloaded')
    if (!hasReloaded) {
      console.warn('⚠️ 檢測到資源過期,自動重新載入頁面...')
      sessionStorage.setItem('chunk-load-error-reloaded', 'true')
      window.location.reload()
    }
  }
}

bootstrap().catch((err) => {
  console.error('App 初始化失敗:', err)
})
