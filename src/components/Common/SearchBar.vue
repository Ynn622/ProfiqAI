<template>
  <div class="search" :class="[design, { 'mobile-expanded': isMobileExpanded }]">
    <input
      type="text"
      id="input-stock-id"
      placeholder="輸入股票代碼…"
      v-model="stockId"
      @keyup.enter="searchStock(true)"
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
          :key="history.code"
          class="stock-item history-item"
        >
          <div class="history-content" @mousedown="selectHistory(history)">
            <div class="history-number">{{ history.code }}</div>
            <div class="history-name" v-if="history.name"> {{ history.name }}</div>
          </div>
          <button
            class="remove-history"
            @mousedown.prevent.stop="removeHistory(index)"
            aria-label="刪除歷史紀錄"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
      
      <!-- 股票清單 -->
      <div v-else-if="stockId && filteredStocks.length > 0">
        <div 
          v-for="stock in filteredStocks" 
          :key="stock.code"
          class="stock-item"
          @mousedown="selectStock(stock)"
        >
          {{ stock.code }}{{ stock.name ? ' ' + stock.name : '' }}
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

const normalizedStockList = computed(() => {
  // 將 stockList 統一轉成 { code, name } 物件，保留相容舊格式（純代碼字串）
  return stockList.map(stock => {
    if (typeof stock === 'string') {
      return { code: stock, name: '' };
    }
    return stock;
  });
});

// 過濾股票清單
const filteredStocks = computed(() => {
  const keyword = stockId.value.trim().toLowerCase();
  if (!keyword) return [];
  
  // 根據輸入的數字過濾股票（前綴匹配）
  return normalizedStockList.value
    .filter(stock => 
      stock.code.toLowerCase().startsWith(keyword) ||
      (stock.name && stock.name.toLowerCase().includes(keyword))
    )
    .sort((a, b) => a.code.localeCompare(b.code, 'zh-Hant', { numeric: true }))
    .slice(0, 10); // 限制顯示前10個結果
});

// 載入搜尋歷史
onMounted(() => {
  const history = localStorage.getItem('searchHistory');
  if (history) {
    searchHistory.value = JSON.parse(history).map(normalizeHistoryEntry).slice(0, 10); // 限制顯示前10筆歷史紀錄
  }
});

function handleBlur() {
  // 延遲隱藏下拉選單，以便點擊選項時不會立即消失
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function searchStock(useFirstMatch = false) {
  if (!stockId.value) {
    alert('請輸入股票代碼!')
    return
  }

  const match = findMatchedStock(stockId.value, useFirstMatch);
  if (!match) {
    alert('找不到符合的股票');
    return;
  }

  stockId.value = match.code;
  addToSearchHistory(match);
  logger.msg(`搜尋股票: ${match.code}`);
  router.push({ name: 'stock-summary', params: { stock: match.code } });
}

function closeSearch() {
  emit('close-search');
}

// 刪除歷史紀錄功能
function removeHistory(index) {
  // 移除指定索引的歷史紀錄
  searchHistory.value.splice(index, 1);
  // 更新 localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}

// 選擇歷史紀錄功能
function selectHistory(stock) {
  const entry = normalizeHistoryEntry(stock);
  stockId.value = entry.code;
  showDropdown.value = false;
  addToSearchHistory(entry);
  searchStock();
}

// 選擇股票功能
function selectStock(stock) {
  const entry = normalizeHistoryEntry(stock);
  stockId.value = entry.code;
  showDropdown.value = false;
  addToSearchHistory(entry);
  searchStock();
}

// 加入搜尋歷史功能
function addToSearchHistory(stock) {
  const entry = normalizeHistoryEntry(stock);
  // 移除重複的歷史紀錄（依代碼）
  const history = searchHistory.value.filter(item => item.code !== entry.code);
  // 將新的紀錄放在最前面
  history.unshift(entry);
  // 限制歷史紀錄數量為 10
  searchHistory.value = history.slice(0, 10);
  // 儲存到 localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}

function findMatchedStock(input, useFirstMatch) {
  const keyword = input.trim().toLowerCase();
  if (!keyword) return null;

  const matchList = filteredStocks.value.length > 0 && useFirstMatch
    ? filteredStocks.value
    : normalizedStockList.value;

  return matchList.find(stock =>
    stock.code.toLowerCase().startsWith(keyword) ||
    (stock.name && stock.name.toLowerCase().includes(keyword))
  ) || null;
}

function normalizeHistoryEntry(entry) {
  if (typeof entry === 'string') return { code: entry, name: '' };
  return { code: entry.code, name: entry.name || '' };
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
  position: relative; /* 為下拉選單提供相對定位 */
  z-index: 100; 
}

.search.mobile-expanded {
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 16px;
  min-height: 40px;
  width: calc(100% - 75px - 10px);
  z-index: 100; 
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
  z-index: 101; /* 確保下拉選單在搜尋框上方 */
  margin-top: 5px;
  width: 100%;
  box-sizing: border-box;
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
  justify-content: flex-start;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  font-size: 16px;
  font-weight: 500;
  position: relative;
  text-align: left;
}

/* 歷史紀錄 */
.history-item {
  justify-content: flex-start;
}

.history-content {
  flex: 1;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.history-number {
  text-align: left;
  margin-right: 6px;
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
  z-index: 1; /* 確保按鈕在數字上方 */
  position: absolute;
  right: 16px;
}

.remove-history:hover {
  background-color: #eee;
  color: #666;
}
</style>
