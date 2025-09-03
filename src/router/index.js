import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

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
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
