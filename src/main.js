import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd, { Segmented } from 'ant-design-vue'
import "@/utils/logger"
import { initAuthStore } from '@/utils/authStore'

const app = createApp(App)

async function bootstrap() {
  // 先初始化登入狀態，避免刷新的第一個路由判斷拿到空的 user
  await initAuthStore()

  app.use(router)
  app.use(Antd)

  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('App 初始化失敗:', err)
})
