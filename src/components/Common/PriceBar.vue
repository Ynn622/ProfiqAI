<template>
    <div class="price-bar">
        <div class="main-top">
            <!-- 股票代號 + 名稱 -->
            <span class="stock-info">{{ stockId }} {{ stockName }}</span>

            <!-- 價格與漲跌 -->
            <div class="price-area">
                <button class="stock-price" :class="{ disabled: stockPrice.close === 0 }" @click="toggleDetail">
                    <template v-if="stockPrice.close === 0">
                        {{ isTaiwanMarketOpen() ? '目前價格' : '收盤價' }}：<span class="no-data">{{ stockError ? '載入失敗' : '載入中' }}</span>
                    </template>
                    <template v-else>
                        {{ isTaiwanMarketOpen() ? '目前價格' : '收盤價' }}：
                        <span class="price-value">{{ stockPrice.close || stockPrice.preClose }}</span>
                        <span class="stock-change" :class="priceClass(stockPrice.close || stockPrice.preClose)">
                            {{ stockPrice.trend == -1 ? '-' : '+' }}{{ stockPrice.change }}
                            ({{ stockPrice.trend == 1 ? '▲' : stockPrice.trend == -1 ? '▼' : '' }}{{ stockPrice.pct }}%)
                        </span>
                    </template>
                    <span class="chevron" aria-hidden="true" :class="{ open: showDetail && stockPrice.close !== 0 }">▾</span>
                </button>

                <transition name="detail">
                    <div v-if="showDetail && stockPrice.close !== 0" class="detail-card">
                        <div class="detail-content">
                            <Candlestick class="detail-kbar" :ohlc="ohlcData" />
                            <div class="detail-rows">
                                <div class="detail-row">
                                    <span class="label">開盤</span>
                                    <span class="value" :class="priceClass(stockPrice.open)">{{ stockPrice.open ?? '-' }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">最高</span>
                                    <span class="value" :class="priceClass(stockPrice.high)">{{ stockPrice.high ?? '-' }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">最低</span>
                                    <span class="value" :class="priceClass(stockPrice.low)">{{ stockPrice.low ?? '-' }}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">收盤</span>
                                    <span class="value" :class="priceClass(stockPrice.close ?? stockPrice.preClose)">
                                        {{ stockPrice.close ?? stockPrice.preClose ?? '-' }}
                                    </span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">成交量</span>
                                    <span class="value">{{ formattedVolume }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>
            <span></span>

            <!-- 自選按鈕 -->
            <button class="watchlist-btn" @click="addToWatchlist"><i class="fa-solid fa-plus" />自選</button>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { useStockData } from '@/utils/stockData';
import { watch, onMounted, onUnmounted, computed, ref } from 'vue';
import stockList from '@/data/stockList.json';
import Candlestick from '@/components/Candlestick.vue';

// Props
const props = defineProps({
    stockId: { type: String, required: true }
});

// Emits
const emit = defineEmits(['updateStockData']);

const stockError = ref(false);
const showDetail = ref(false);
const emptyPrice = { open: 0, high: 0, low: 0, close: 0, preClose: 0, volume: 0, change: 0, pct: 0, trend: 0 };

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
const stockPrice = computed(() => {
  if (!currentStock.value?.stockPrice) return emptyPrice;
  return { ...emptyPrice, ...currentStock.value.stockPrice };
});
const preClose = computed(() => Number(stockPrice.value.preClose) || 0);
const ohlcData = computed(() => ({
  open: stockPrice.value.open,
  high: stockPrice.value.high,
  low: stockPrice.value.low,
  close: stockPrice.value.close
}));
const formattedVolume = computed(() => {
  const volume = stockPrice.value?.volume;
  if (typeof volume === 'number') return volume.toLocaleString('en-US');
  return '-';
});

function priceClass(val) {
  const num = Number(val);
  if (Number.isNaN(num)) return 'flat';
  if (num > preClose.value) return 'up';
  if (num < preClose.value) return 'down';
  return 'flat';
}

// 執行股票資料更新
async function updateStock() {
  try {
    const data = await fetchLiveStockInfo(props.stockId);
    
    // 透過 emit 回傳資料給父元件
    emit('updateStockData', data.stockPrice);
    stockError.value = false;
  } catch (err) {
    stockError.value = true;
    logger.error('更新股票資料失敗:', err);
  }
}

function addToWatchlist() {
    alert('已加入自選');
}

function toggleDetail() {
  if (stockPrice.value.close === 0) return;
  showDetail.value = !showDetail.value;
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
      showDetail.value = false;
    }
  }
);
</script>

<style scoped>
@import '/src/assets/main.css';
.price-bar {
    width: 100%;
}

.price-area {
    position: relative;
    display: flex;
    align-items: center;
}

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
    display: flex;
    align-items: baseline;
    gap: 5px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 20px;
    padding: 6px;
    border-radius: 8px;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    color: var(--color-text)
}

.stock-change {
    font-weight: bold;
    font-size: 18px;
}

.price-value {
    font-weight: 700;
}

.up {
    color: var(--darkBull);
}

.down {
    color: var(--darkBear);
}

.flat {
    color: var(--pill);
}

.stock-price:hover {
    background-color: #f4f6f8;
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.05);
}

.stock-price.disabled {
    cursor: not-allowed;
    opacity: 0.7;
    box-shadow: none;
    background: transparent;
}

.chevron {
    font-size: 14px;
    transition: transform 0.2s ease;
}

.chevron.open {
    transform: rotate(180deg);
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

.detail-enter-active,
.detail-leave-active {
    transition: all 0.2s ease;
}

.detail-enter-from,
.detail-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
}

.detail-card {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 5;
    min-width: 260px;
    padding: 12px 14px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.05);
    display: block;
    font-size: 14px;
}

.detail-content {
    display: flex;
    align-items: center;
    gap: 14px;
}

.detail-rows {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 6px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
}

.detail-row .label {
    color: #555;
}

.detail-row .value {
    font-weight: 700;
}

@media (max-width: 768px) {
    .main-top {
        flex-direction: column;
        align-items: flex-start;
        height: auto;
    }
    .detail-card {
        left: 0;
        right: auto;
        width: 70dvw;
        max-width: 360px;
    }
}
</style>
