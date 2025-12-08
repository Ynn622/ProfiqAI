import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import stockList from '../data/stockList.json'
import { useAuthStore, initAuthStore } from '../utils/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/stock/:stock/Summary',
      name: 'stock-summary',
      component: () => import('../views/Stock/SummaryView.vue'),
    },
    {
      path: '/stock/:stock/Analysis',
      name: 'stock-analysis',
      component: () => import('../views/Stock/AnalysisView.vue'),
    },
    {
      path: '/stock/:stock/WordCloud',
      name: 'stock-wordcloud',
      component: () => import('../views/Stock/WordCloudView.vue'),
    },
    {
      path: '/chatBot',
      name: 'chat-bot',
      component: () => import('../views/ChatBotView.vue'),
    },
    {
      path: '/watchlist',
      name: 'watchlist',
      component: () => import('../views/WatchListView.vue'),
      meta: { requiresAuth: true }, // 需要登入才能訪問
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../views/AuthCallback.vue'),
    },
    {
      path: '/:pathMatch(.*)*', // 捕捉不存在的路由
      redirect: '/',
    },
  ],
})

// 🔒 全域導航守衛:檢查 stock 是否存在於 JSON 清單 & 登入驗證
router.beforeEach(async (to, from, next) => {
  // 檢查股票代碼是否存在
  if (to.params.stock) {
    const stockCode = to.params.stock
    const stockCodes = stockList.map(item => (typeof item === 'string' ? item : item.code))
    if (!stockCodes.includes(stockCode)) {
      // 股票不存在 → 導回首頁 或 顯示錯誤頁
      return next('/')
    }
  }

  // 檢查是否需要登入驗證
  if (to.meta.requiresAuth) {
    const authStore = useAuthStore()
    if (authStore.isLoading.value) {
      await initAuthStore()
    }
    if (!authStore.isLoggedIn.value) {
      // 未登入 → 導回首頁
      return next({ name: 'home' })
    }
  }

  next()
})

// 🔄 處理動態載入錯誤 (chunk load error)
router.onError((error) => {
  const isChunkLoadError = error.message?.includes('Failed to fetch dynamically imported module') ||
                          error.message?.includes('Unable to preload CSS') ||
                          error.message?.includes('Failed to load') ||
                          error.message?.includes('404')
  
  if (isChunkLoadError) {
    const reloadCount = parseInt(sessionStorage.getItem('chunk-load-error-count') || '0')
    
    if (reloadCount < 2) {
      console.warn(`⚠️ 檢測到資源過期 (嘗試 ${reloadCount + 1}/2),自動重新載入頁面...`)
      sessionStorage.setItem('chunk-load-error-count', String(reloadCount + 1))
      // 清除所有快取並強制重新載入
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      window.location.reload()
    } else {
      console.error('❌ 多次重新載入後仍然失敗,請手動清除瀏覽器快取 (Ctrl+Shift+Delete / Cmd+Shift+Delete)')
      sessionStorage.removeItem('chunk-load-error-count')
    }
  }
})

export default router
