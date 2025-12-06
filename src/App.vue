<script setup>
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { startVersionCheck, stopVersionCheck, forceReload } from '@/utils/versionCheck'

// 版本檢測
onMounted(() => {
  startVersionCheck(() => {
    // 檢測到新版本時顯示提示
    message.info({
      content: '檢測到新版本，建議重新載入頁面以獲得最佳體驗',
      duration: 10,
      onClick: () => {
        forceReload()
      }
    })
  })
})

onUnmounted(() => {
  stopVersionCheck()
})
</script>

<template>
  <RouterView />
  
</template>

<style scoped>
/* 全局由各頁自行掌控版面，這裡保持極簡 */
</style>
