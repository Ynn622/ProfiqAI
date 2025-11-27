<template>
    <div class="main-top">
        <!-- 股票代號 + 名稱 -->
        <span class="stock-info">{{ stockId }} {{ stockName }}</span>

        <!-- 價格與漲跌 -->
        <span class="stock-price">
            <template v-if="stockPrice.price === 0">
                {{ isTaiwanMarketOpen() ? '目前價格' : '收盤價' }}：<span class="no-data">{{ stockError ? '載入失敗' : '載入中' }}</span>
            </template>
            <template v-else>
                {{ isTaiwanMarketOpen() ? '目前價格' : '收盤價' }}：{{ stockPrice.price }}
                <span class="stock-change" :class="{ up: stockPrice.trend == 1, flat: stockPrice.trend == 0, down: stockPrice.trend == -1 }">
                    {{ stockPrice.trend == -1 ? '-' : '+' }}{{ stockPrice.change }}
                    ({{ stockPrice.trend == 1 ? '▲' : stockPrice.trend == -1 ? '▼' : '' }}{{ stockPrice.pct }}%)
                </span>
            </template>
        </span>
        <span></span>

        <!-- 自選按鈕 -->
        <button class="watchlist-btn" @click="addToWatchlist"><i class="fa-solid fa-plus" />自選</button>
    </div>
</template>

<script setup>
// 工具 & 套件
import { useStockData } from '@/utils/stockData';
import { watch, onMounted, onUnmounted, computed, ref } from 'vue';
import stockList from '@/data/stockList.json';

// Props
const props = defineProps({
    stockId: { type: String, required: true }
});

// Emits
const emit = defineEmits(['updateStockData']);

const stockError = ref(false);

// 使用全域股票資料管理
const { 
  currentStock, 
  setCurrentStockId, 
  fetchLiveStockInfo, 
  isTaiwanMarketOpen 
} = useStockData();

let liveInfoInterval = null; // 保存 interval id

// 靜態股票代號/名稱對照
const stockNameMap = new Map(
  stockList.map(item => {
    if (typeof item === 'string') return [item, ''];
    return [item.code, item.name || ''];
  })
);

// 計算屬性，從全域狀態取得資料
const stockName = computed(() => {
  const liveName = currentStock.value?.stockName?.trim();
  if (liveName) return liveName;
  return stockNameMap.get(props.stockId) || '';
});
const stockPrice = computed(() => currentStock.value?.stockPrice || { price: 0, change: 0, pct: 0, trend: 0 });

// 執行股票資料更新
async function updateStock() {
  try {
    const data = await fetchLiveStockInfo(props.stockId);
    
    // 透過 emit 回傳資料給父元件
    emit('updateStockData', data.liveInfo);
    stockError.value = false;
  } catch (err) {
    stockError.value = true;
    logger.error('更新股票資料失敗:', err);
  }
}

function addToWatchlist() {
    alert('已加入自選');
}

// 初始化和監聽邏輯
onMounted(() => {
  // 設定當前股票ID並立即更新資料
  setCurrentStockId(props.stockId);
  updateStock();

  // 每 10 秒更新一次即時資料
  liveInfoInterval = setInterval(() => {
    if (isTaiwanMarketOpen()) {
      updateStock();
    }
  }, 10000);
});

// 離開頁面清除 interval
onUnmounted(() => {
  if (liveInfoInterval) {
    clearInterval(liveInfoInterval);
    logger.msg('清除 interval');
  }
});

// 監聽股票代碼變化
watch(
  () => props.stockId,
  (newStockId) => {
    if (newStockId) {
      logger.msg(`股票代碼變更: ${newStockId}`);
      setCurrentStockId(newStockId);
      updateStock();
    }
  }
);
</script>

<style scoped>
.main-top {
    display: flex;
    width: 100%;
    padding: 10px 20px;
    margin-top: 5px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 50px;
    align-items: center;
    justify-content: space-between;
    font-size: 24px;
}

.stock-info {
    font-weight: 900;
}

.stock-price {
    font-weight: 600;
    font-size: 20px;
}

.stock-change {
    color: var(--darkBull);
    font-weight: bold;
    font-size: 18px;
}

.stock-change.up {
    color: var(--darkBull);
}

.stock-change.down {
    color: var(--darkBear);
}

.stock-change.flat {
  color: var(--pill);
}

.watchlist-btn {
    padding: 5px 10px;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    border-radius: 10px;
    cursor: pointer;
    background-color: lemonchiffon;
    border: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background 0.3s ease;
}
.watchlist-btn:hover {
    background-color: gold;
}

.no-data {
    color: #888888;
    font-size: 0.8em;
}

@media (max-width: 768px) {
    .main-top {
        flex-direction: column;
        align-items: flex-start;
        height: auto;
    }
}
</style>