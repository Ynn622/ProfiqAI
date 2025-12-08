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
  
  // 成功載入後清除重試計數器
  sessionStorage.removeItem('chunk-load-error-count')
}

// 全域錯誤處理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue 錯誤:', err, info)
  
  // 檢查是否為 chunk load error 或 404 資源錯誤
  const isResourceError = err.message?.includes('Failed to fetch dynamically imported module') ||
                         err.message?.includes('Failed to load') ||
                         err.message?.includes('404')
  
  if (isResourceError) {
    const reloadCount = parseInt(sessionStorage.getItem('chunk-load-error-count') || '0')
    if (reloadCount < 2) {
      console.warn(`⚠️ 檢測到資源過期 (嘗試 ${reloadCount + 1}/2),自動重新載入頁面...`)
      sessionStorage.setItem('chunk-load-error-count', String(reloadCount + 1))
      // 清除 Service Worker 快取
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      window.location.reload()
    }
  }
}

bootstrap().catch((err) => {
  console.error('App 初始化失敗:', err)
})
