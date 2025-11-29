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
        <RiseProbability :probability="prob" />
        <div class="analysis-factors">
          <FactorCard
            title="技術面"
            :score="techScore"
            type="indicatorList"
            :indicators="techIndicators"
          />
          <FactorCard
            title="籌碼面"
            :score="chipScore"
            type="stackedBar"
            :segments="chipSegments"
          />
          <FactorCard
            title="消息面"
            :score="newsScore"
            type="stackedBar"
            :segments="newsSegments"
            :bar-show-plus="false"
            bar-value-suffix="%"
          />
          <FactorCard
            title="基本面"
            :score="fundamentalScore"
            type="indicatorList"
            :indicators="fundamentalIndicators"
          />
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
import FactorCard from '@/components/SummaryView/FactorCard.vue';
import PriceBar from '@/components/Common/PriceBar.vue';
import KChart from '@/components//SummaryView/KChart.vue';
import LoadingMask from '@/components/Common/loadingMask.vue'; 

// 工具 & 套件
import { callAPI } from '@/utils/apiConfig';
import { logger } from '@/utils/logger';
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router'

const route = useRoute();
const loading = ref(false);

// 基本資料
const stockId = computed(() => route.params.stock);

// 從 PriceBar 接收的資料
const stockName = ref('');
const stockPrice = ref({ close: 0, change: 0, pct: 0, trend: 0 });

// K 線資料 (由 SummaryView 自己管理)
const kData = ref([]);

// 隔日上漲機率
const prob = ref(null);

// 因子預設資料
const techScore = ref(2);
const chipScore = ref(1);
const newsScore = ref(-1);
const fundamentalScore = ref(-2);

const techIndicators = [
  { label: 'EMA、 RSI', direction: 'up' },
  { label: 'ROC', direction: 'down' },
];

const fundamentalIndicators = [
  { label: 'EPS、 ROE', direction: 'up' },
  { label: 'P/E Ratio', direction: 'down' },
];

const chipSegments = [
  { label: '外資', value: -1000, color: '#7da8f5' }, // blue
  { label: '投信', value: -2000, color: '#f3c45c' }, // amber
  { label: '自營', value: 1000, color: '#a88cf3' }, // purple
];

const newsSegments = [
  { label: '負面', value: 20, color: '#7bef83' },
  { label: '中立', value: 40, color: '#ffe666' },
  { label: '正面', value: 20, color: '#f9acb0' },
];

// 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
  stockName.value = data.stockName;
  stockPrice.value = data;
  updateKData(data);
}

/** 
 * API: 取得歷史股價資料 (K 線)
 */
async function fetchStockData(stockId) {
  try {
    const response = await callAPI({
      url: '/stock/stockData',
      params: { stock_id: stockId },
      funcName: 'fetchStockData'
    });

    kData.value = response.data;
    // 如果 PriceBar 還沒有股票名稱，這裡也設定一下
    if (!stockName.value) {
      stockName.value = response.stockName;
    }
  } catch (err) {
    // 錯誤已經在 callAPI 中記錄
  }
}

/** 
 * API: 取得股票 隔日上漲機率
 */
async function fetchStockPredict(stockId) {
  try {
    const response = await callAPI({
      url: '/predict/futureUpProb',
      params: { stock_id: stockId },
      funcName: 'fetchStockPredict'
    });

    prob.value = response.futureUpProb * 100;
  } catch (err) {
    // 錯誤已經在 callAPI 中記錄
  }
}

// 更新最新 K 線資料
function updateKData(newData) {
  if (kData.value.length === 0) return
  const dates = kData.value.Date
  const lastIndex = dates.length - 1
  const newDate = newData.date
  if (!newDate) return
  
  // 檢查最後一筆是不是同一天
  if (lastIndex >= 0 && dates[lastIndex] === newDate) {
    // 覆蓋最後一筆
    kData.value.OHLC[lastIndex] = [newData.open, newData.high, newData.low, newData.close]
    kData.value.Volume[lastIndex] = newData.volume
  } else {
    // 新增
    kData.value.Date.push(newDate)
    kData.value.OHLC.push([newData.open, newData.high, newData.low, newData.close])
    kData.value.Volume.push(newData.volume)
  }
}

const loadData = async () => {
  loading.value = true;
  fetchStockPredict(stockId.value);
  await fetchStockData(stockId.value);
  loading.value = false;
};

// 進入頁面時執行
onMounted(async () => {
  await loadData();
});

// 監聽股票代碼變化
watch(
  () => route.params.stock,
  async (newStock) => {
    logger.msg(`股票代碼變更: ${newStock}`);
    await loadData();
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
  gap: 16px;
  width: 300px;
  margin-right: 20px;
  margin-top: 10px;
}

.analysis-factors {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  width: 100%;
}

@media (max-width: 1200px) {
  .other {  
    width: 280px;
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
