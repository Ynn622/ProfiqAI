<template>
  <div class="screen">
    <Nav />
    <div class="main-content">
      <div>
        <Aside :selected="1" />
      </div>
      <div class="content">
        <PriceBar :stockId="stockId" :stockName="stockName" :stockPrice="stockPrice" :stockChange="stockChange" />
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

import { API_BASE_URL } from '@/utils/apiConfig';
import kDataJson from '@/data//2330_stock_data.json';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { computed, watch } from 'vue';


const route = useRoute();

const stockId = computed(() => route.params.stock);
const stockPrice = ref(949);
const stockChange = ref({ value: 31, percent: 3.38, up: false });
const kData = ref(kDataJson)    // 導入的 K 線資料 (可日後改為 API 取得後再指派)
const stockName = ref('');

async function fetchStockData(stockId) {
  const startDate = '2024-05-10';
  const url = `${API_BASE_URL}/View/stockData?stock_id=${stockId}&start_date=${startDate}`;

  try {
    console.log("🔵 Fetching data for stock:", stockId);
    const res = await fetch(url, { method: "GET" });
    if (res.ok) {
      const response = await res.json();
      kData.value = response.data;
      stockName.value = response.stockName;
      stockPrice.value = response.data.OHLC.at(-1)[3];
      stockChange.value = {
        value: response.data.OHLC.at(-1)[3] - response.data.OHLC.at(-2)[3],
        percent: ((response.data.OHLC.at(-1)[3] - response.data.OHLC.at(-2)[3]) / response.data.OHLC.at(-2)[3] * 100).toFixed(2),
        up: response.data.OHLC.at(-1)[3] > response.data.OHLC.at(-2)[3]
      };
      console.log("🟢 Fetched Stock Data Successfully");
    }
  } catch (err) {
    console.error("🔴 Error fetching stock data:", err);
    // 你可以在這裡用 UI 呈現錯誤
    throw err;
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
    fetchStockData(newStock)
  }
)


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