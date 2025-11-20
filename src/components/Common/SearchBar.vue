<template>
  <div class="search" :class="[design, { 'mobile-expanded': isMobileExpanded }]">
    <input
      type="text"
      id="input-stock-id"
      placeholder="輸入股票代碼…"
      v-model="stockId"
      @keyup.enter="searchStock"
      autocomplete="off"
      @focus="showDropdown = true"
      @blur="handleBlur"
    />
    <button 
      v-if="isMobileExpanded" 
      class="back-icon" 
      aria-label="返回" 
      @click="closeSearch"
    >
      <i class="fa-solid fa-arrow-left"></i>
    </button>
    <button class="icon" aria-label="搜尋" @click="searchStock">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
    
    <!-- 下拉選單 (搜尋歷史或股票清單) - 放在 .search 內，定位相對於搜尋欄 -->
    <div v-if="showDropdown && (searchHistory.length > 0 || filteredStocks.length > 0)" class="stock-dropdown">
      <!-- 搜尋歷史 -->
      <div v-if="!stockId && searchHistory.length > 0">
        <div class="dropdown-header">搜尋歷史</div>
        <div 
          v-for="(history, index) in searchHistory" 
          :key="history"
          class="stock-item history-item"
        >
          <div class="history-content" @mousedown="selectHistory(history)">
            <div class="history-number">{{ history }}</div>
          </div>
          <button class="remove-history" @mousedown.stop="removeHistory(index)" aria-label="刪除歷史紀錄">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      
      <!-- 股票清單 -->
      <div v-else-if="stockId && filteredStocks.length > 0">
        <div 
          v-for="stock in filteredStocks" 
          :key="stock"
          class="stock-item"
          @mousedown="selectStock(stock)"
        >
          {{ stock }}
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
// 工具 & 套件
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import stockList from '@/data/stockList.json';

// Props
const props = defineProps({
  design: { type: String, default: '' },
  isMobileExpanded: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close-search'])

const router = useRouter();
const stockId = ref('');
const showDropdown = ref(false);
const searchHistory = ref([]);

// 过滤股票清单
const filteredStocks = computed(() => {
  if (!stockId.value) return [];
  
  // 根据输入的数字过滤股票 (前缀匹配)
  return stockList.filter(stock => 
    stock.startsWith(stockId.value)
  ).slice(0, 10); // 限制显示前10个结果
});

// 载入搜寻历史
onMounted(() => {
  const history = localStorage.getItem('searchHistory');
  if (history) {
    searchHistory.value = JSON.parse(history).slice(0, 10); // 限制显示前10个历史记录
  }
});

function handleBlur() {
  // 延迟隐藏下拉菜单，以便点击选项时不会立即消失
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function searchStock() {
  if (!stockId.value) {
    alert('請輸入股票代碼!')
    return
  }
  addToSearchHistory(stockId.value);
  logger.msg(`搜尋股票: ${stockId.value}`);
  router.push({ name: 'stock-summary', params: { stock: stockId.value } });
}

function closeSearch() {
  emit('close-search');
}

// 删除历史记录功能
function removeHistory(index) {
  // 移除指定索引的历史记录
  searchHistory.value.splice(index, 1);
  // 更新 localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}

// 选择历史记录功能
function selectHistory(stock) {
  stockId.value = stock;
  showDropdown.value = false;
  addToSearchHistory(stock);
  searchStock();
}

// 选择股票功能
function selectStock(stock) {
  stockId.value = stock;
  showDropdown.value = false;
  addToSearchHistory(stock);
  searchStock();
}

// 添加到搜索历史功能
function addToSearchHistory(stock) {
  // 移除重复的历史记录
  const history = searchHistory.value.filter(item => item !== stock);
  // 将新的记录放在最前面
  history.unshift(stock);
  // 限制历史记录数量为10
  searchHistory.value = history.slice(0, 10);
  // 储存到 localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}
</script>

<style scoped>
/* 搜尋區塊 */
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 20px;
  padding: 10px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  max-width: 560px;
  width: 100%;
  box-sizing: border-box;
  position: relative; /* 为下拉菜单提供相对定位 */
  z-index: 9999; /* 确保搜索框在最上层 */
}

.search.mobile-expanded {
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 16px;
  min-height: 40px;
  width: calc(100% - 75px - 10px);
  z-index: 9999; /* 确保移动端搜索框在最上层 */
}

.search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  background: transparent;
  margin-left: 10px;
  width: 100%;
}

.search.mobile-expanded input {
  font-size: 16px;
  margin-left: 8px;
}

.search .icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e9eef3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search.mobile-expanded .icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

/* 返回按鈕 */
.back-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e9eef3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.search.mobile-expanded .back-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

.home {
    width: 80vw;
}

/* 平板樣式 */
@media (max-width: 1024px) and (min-width: 769px) {
    .search {
        max-width: 400px;
        padding: 8px 12px;
        min-height: 40px;
    }
    
    .search input {
        font-size: 16px;
        margin-left: 8px;
    }
    
    .search .icon {
        width: 32px;
        height: 32px;
    }
    
    .back-icon {
        width: 32px;
        height: 32px;
    }
}

/* 桌面版樣式 */
@media (min-width: 1025px) {
    .search {
        max-width: 560px;
        padding: 10px 14px;
        min-height: 44px;
    }
    
    .search input {
        font-size: 18px;
        margin-left: 10px;
    }
    
    .search .icon {
        width: 36px;
        height: 36px;
    }
    
    .back-icon {
        width: 36px;
        height: 36px;
    }
}

/* 下拉選單 */
.stock-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10000; /* 确保下拉菜单在搜索框上方 */
  margin-top: 5px;
  width: 100%;
  box-sizing: border-box;
}

/* 移动端下拉菜单特殊处理 */
.search.mobile-expanded .stock-dropdown {
  z-index: 10001; /* 移动端确保下拉菜单在最上层 */
}

.dropdown-header {
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  /* 以搜尋欄為參考，水平置中標題文字 */
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.stock-item {
  display: flex;
  justify-content: center; /* Center the content */
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 16px;
  font-weight: 500;
  position: relative;
  text-align: center; /* Center text alignment */
}

/* 特別针对历史记录中的股票代码居中 */
.history-item {
  justify-content: center; /* Center content */
}

.history-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.history-number {
  text-align: center;
}

.stock-item:hover {
  background-color: #f5f5f5;
}

.remove-history {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  z-index: 1; /* 确保按钮在数字上方 */
  position: absolute;
  right: 16px;
}

.remove-history:hover {
  background-color: #eee;
  color: #666;
}
</style>