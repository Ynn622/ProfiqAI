<template>
  <div class="screen">
    <LoadingMask v-if="loading" />
    <Nav />
    <div class="main-content">
      <div>
        <Aside :selected="1" />
      </div>
      <div class="content">
        <PriceBar :stockId="stockId" :stockName="stockName" :stockPrice="stockPrice" />
        <div class="main-bottom">
          <KChart :k-data="kData" />
          <div class="other">
            <RiseProbability :probability="51" />
            <BacktestingDesc />
            <div class="analysis-factors">
              <AnalysisFactors :factor="'技術'" :direction="0" />
              <AnalysisFactors :factor="'籌碼'" :direction="-1" />
              <AnalysisFactors :factor="'消息'" :direction="0" />
              <AnalysisFactors :factor="'基本'" :direction="1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 組件
import Aside from '@/components/Aside.vue';
import Nav from '@/components/Nav.vue';
import RiseProbability from '@/components//SummaryView/RiseProbability.vue';
import PriceBar from '@/components/PriceBar.vue';
import KChart from '@/components//SummaryView/KChart.vue';
import BacktestingDesc from '@/components//SummaryView/BacktestingDesc.vue';
import AnalysisFactors from '@/components//SummaryView/AnalysisFactors.vue';
import LoadingMask from '@/components/loadingMask.vue'; 

import { API_BASE_URL } from '@/utils/apiConfig';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'

let liveInfoInterval = null; // 保存 interval id

const route = useRoute();
const loading = ref(false);
// PriceBar 資料
const stockId = computed(() => route.params.stock);
const stockName = ref('');
const stockPrice = ref({ price: 0, change: 0, pct: 0, trend: true });
// K 線資料
const kData = ref([])

/** 
 * API: 取得即時股票資訊
 */
async function fetchLiveStockInfo(stockId) {
  const url = `${API_BASE_URL}/View/liveStockInfo?stock_id=${stockId}`;

  try {
    
    logger.func.start(fetchLiveStockInfo, [stockId]);
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
      const response = await res.json();

      stockName.value = response.info.StockName;
      stockPrice.value = {
        price: response.info.Close,
        change: response.info.Change,
        pct: response.info.ChangePct,
        trend: response.info.Trend
      };
      updateKData(kData.value, response.info);
      logger.func.success(fetchLiveStockInfo,[stockId]);
  } catch (err) {
    logger.func.error(fetchLiveStockInfo,[stockId]);
    // 你可以在這裡用 UI 呈現錯誤
    throw err;
  }
}

/** 
 * API: 取得歷史股價資料 (K 線)
 */
async function fetchStockData(stockId) {
  const startDate = '2024-05-10';
  const url = `${API_BASE_URL}/View/stockData?stock_id=${stockId}&start_date=${startDate}`;

  try {
    loading.value = true;
    logger.func.start(fetchStockData, [stockId]);
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const response = await res.json();

      kData.value = response.data;
      stockName.value = response.stockName;

      logger.func.success(fetchStockData, [stockId]);
  } catch (err) {
    logger.func.error(fetchStockData, [stockId]);
    // 你可以在這裡用 UI 呈現錯誤
    throw err;
  } finally {
    loading.value = false;
  }
}

/** 
 * 取得台灣股市開盤時間
 */
function isTaiwanMarketOpen() {
  const now = new Date();

  // 轉成台灣時間（UTC+8）
  const taipeiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
  const week = taipeiTime.getDay(); // 0=Sunday, 1=Monday ... 6=Saturday
  const hours = taipeiTime.getHours();
  const minutes = taipeiTime.getMinutes();

  // 只允許星期一到五
  if (week < 1 || week > 5) { return false; }

  // 判斷時間範圍 9:00 - 13:30
  const timeInMinutes = hours * 60 + minutes;
  const start = 9 * 60;        // 9:00 = 540 分鐘
  const end = 13 * 60 + 30;    // 13:30 = 810 分鐘
  return timeInMinutes >= start && timeInMinutes <= end;
}

// 更新最新 K 線資料
function updateKData(rawData, newData) {
  if (kData.value.length === 0) return

  const dates = rawData.Date
  const lastIndex = dates.length - 1

  // 檢查最後一筆是不是同一天
  if (lastIndex >= 0 && dates[lastIndex] === newData.Date) {
    // 覆蓋最後一筆
    rawData.OHLC[lastIndex] = [newData.Open, newData.High, newData.Low, newData.Close]
    rawData.Volume[lastIndex] = newData.Volume
  } else {
    // 新增
    rawData.Date.push(newData.Date)
    rawData.OHLC.push([newData.Open, newData.High, newData.Low, newData.Close])
    rawData.Volume.push(newData.Volume)
  }
}

// 進入頁面時執行
onMounted(() => {
  fetchStockData(stockId.value);
  fetchLiveStockInfo(stockId.value);

  // 每 10 秒更新一次
  liveInfoInterval = setInterval(() => {
    if (isTaiwanMarketOpen()) {
      fetchLiveStockInfo(stockId.value);
    }
  }, 10000);
});

// 離開頁面清除 interval
onUnmounted(() => {
  if (liveInfoInterval) {
    clearInterval(liveInfoInterval);
    logger.msg(`清除 interval`);
  }
});

// 監聽股票代碼變化
watch(
  () => route.params.stock,
  (newStock) => {
    logger.msg(`股票代碼變更: ${newStock}`);
    fetchStockData(newStock);
    fetchLiveStockInfo(newStock);
  }
);
</script>

<style scoped>
@import '/src/assets/main.css';

.content {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.stock-info {
  font-weight: 900;
}

.stock-price {
  font-weight: 600;
  font-size: 20px;
}

.stock-change {
  color: red;
  font-weight: bold;
  font-size: 18px;
}

.stock-change.up { color: red; }
.stock-change.down { color: green; }

.stock-btn {
  padding: 5px 10px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 10px;
  cursor: pointer;
  background-color: lemonchiffon;
  border: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-bottom {
  display: flex;
  margin-top: 10px;
  gap: 30px;
  flex: 1;
}

.other {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 300px;
  margin-right: 20px;
  margin-top: 10px;
}

.analysis-factors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px;
}

@media (max-width: 1200px) {
  .other {  
    width: 250px;
  }
}

@media (max-width: 768px) {
  .main-bottom {
    flex-direction: column;
  }
  .other {
    width: 100%;
  }
}
</style>