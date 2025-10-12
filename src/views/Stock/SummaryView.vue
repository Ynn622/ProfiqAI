<template>
  <div class="screen">
    <!-- 載入中 spinner -->
    <LoadingMask v-if="loading" />
    <Nav />
    <div class="main-content">
      <div>
        <Aside :selected="1" />
      </div>
      <div class="content">
        <PriceBar :stockId="stockId" @updateStockData="handleStockDataUpdate"/>
        <div class="main-bottom">
          <KChart :k-data="kData" :loading="loading" />
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
import Aside from '@/components/Common/Aside.vue';
import Nav from '@/components/Common/Nav.vue';
import RiseProbability from '@/components//SummaryView/RiseProbability.vue';
import PriceBar from '@/components/Common/PriceBar.vue';
import KChart from '@/components//SummaryView/KChart.vue';
import BacktestingDesc from '@/components//SummaryView/BacktestingDesc.vue';
import AnalysisFactors from '@/components//SummaryView/AnalysisFactors.vue';
import LoadingMask from '@/components/Common/loadingMask.vue'; 

// 工具 & 套件
import { API_BASE_URL } from '@/utils/apiConfig';
import { logger } from '@/utils/logger';
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router'

const route = useRoute();
const loading = ref(false);

// 基本資料
const stockId = computed(() => route.params.stock);

// 從 PriceBar 接收的資料
const stockName = ref('');
const stockPrice = ref({ price: 0, change: 0, pct: 0, trend: true });

// K 線資料 (由 SummaryView 自己管理)
const kData = ref([]);

// 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
  stockName.value = data.stockName;
  stockPrice.value = data.stockPrice;
  updateKData(data);
}

/** 
 * API: 取得歷史股價資料 (K 線)
 */
async function fetchStockData(stockId) {
  const url = `${API_BASE_URL}/View/stockData?stock_id=${stockId}`;

  try {
    loading.value = true;
    logger.func.start(fetchStockData, [stockId]);
    const res = await fetch(url, { method: "GET" });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const response = await res.json();

    kData.value = response.data;
    // 如果 PriceBar 還沒有股票名稱，這裡也設定一下
    if (!stockName.value) {
      stockName.value = response.stockName;
    }

    logger.func.success(fetchStockData, [stockId]);
  } catch (err) {
    logger.func.error(fetchStockData, [stockId]);
    console.error('取得股票資料失敗:', err);
    throw err;
  } finally {
    loading.value = false;
  }
}

// 更新最新 K 線資料
function updateKData(newData) {
  if (kData.value.length === 0) return
  const dates = kData.value.Date
  const lastIndex = dates.length - 1
  
  // 檢查最後一筆是不是同一天
  if (lastIndex >= 0 && dates[lastIndex] === newData.Date) {
    // 覆蓋最後一筆
    kData.value.OHLC[lastIndex] = [newData.Open, newData.High, newData.Low, newData.Close]
    kData.value.Volume[lastIndex] = newData.Volume
  } else {
    // 新增
    kData.value.Date.push(newData.Date)
    kData.value.OHLC.push([newData.Open, newData.High, newData.Low, newData.Close])
    kData.value.Volume.push(newData.Volume)
  }
}

// 進入頁面時執行
onMounted(() => {
  fetchStockData(stockId.value);
});

// 監聽股票代碼變化
watch(
  () => route.params.stock,
  (newStock) => {
    logger.msg(`股票代碼變更: ${newStock}`);
    fetchStockData(newStock);
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