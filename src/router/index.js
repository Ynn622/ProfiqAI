import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import stockList from '../data/stockList.json'

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
      path: '/stock/:stock/Linked',
      name: 'stock-linked',
      component: () => import('../views/Stock/LinkView.vue'),
    },
    {
      path: '/chatBot',
      name: 'chat-bot',
      component: () => import('../views/ChatBotView.vue'),
    },
    {
      path: '/:pathMatch(.*)*', // 捕捉不存在的路由
      redirect: '/',
    },
  ],
})

// 🔒 全域導航守衛：檢查 stock 是否存在於 JSON 清單
router.beforeEach((to, from, next) => {
  if (to.params.stock) {
    const stockCode = to.params.stock
    if (!stockList.includes(stockCode)) {
      // 股票不存在 → 導回首頁 或 顯示錯誤頁
      return next('/')
    }
  }
  next()
})

export default router