import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd, { Segmented } from 'ant-design-vue'
import "@/utils/logger"

const app = createApp(App)

app.use(router)
app.use(Antd)

app.mount('#app')
