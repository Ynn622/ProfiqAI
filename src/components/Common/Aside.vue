<template>
  <div class="aside" v-if="!isMobile">
    <div class="function-item" :class="{ selected: selected === 1 }" @click="asidePage(1)">
      <i class="fa-solid fa-chart-column"></i>
      <span>股票速覽</span>
    </div>
    <div class="function-item" :class="{ selected: selected === 2 }" @click="asidePage(2)">
      <i class="fa-solid fa-gauge"></i>
      <span>分析儀表</span>
    </div>
    <div class="function-item" :class="{ selected: selected === 3 }" @click="asidePage(3)">
      <i class="fa-solid fa-cloud"></i>
      <span>新聞股雲</span>
    </div>
  </div>
</template>

<script setup>
// 工具 & 套件
import { useRouter, useRoute } from 'vue-router';
import { useWindowSize } from '@vueuse/core';
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';

// Props
const props = defineProps({
  selected: { type: Number, default: 1 },
});

const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

const router = useRouter();
const route = useRoute();

function asidePage(page) {
  const PageDict = {
    1: 'stock-summary',
    2: 'stock-analysis',
    3: 'stock-wordcloud'
  };
  
  // 嘗試從當前路由獲取 stock 參數
  let stock = route.params.stock;
  
  // 如果當前路由沒有 stock，嘗試從 localStorage 獲取
  if (!stock) {
      const history = localStorage.getItem('searchHistory');
      if (history) {
          const searchHistory = JSON.parse(history);
          if (searchHistory.length > 0) {
              stock = searchHistory[0];
          }
      }
  }

  if (PageDict[page]) {
    if (stock) {
        logger.msg(`Aside導航至: ${PageDict[page]}, Stock: ${stock}`);
        router.push({ name: PageDict[page], params: { stock } });
    } else {
        message.warning('請先搜尋股票');
    }
  }
}

</script>

<style scoped>
.aside {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 10px 5px;
  width: 90px;
}
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}
.btn:hover {
  background: #e0e0e0;
}

.function-item {
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 500;
  color: #0f172a;
  padding: 7px 7px 3px 7px;
  cursor: pointer;
}

.function-item i {
  font-size: 38px;
}

.selected {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>