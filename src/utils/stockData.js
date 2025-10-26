import { ref, computed } from 'vue';
import { API_BASE_URL } from '@/utils/apiConfig';

// 全域股票資料狀態
const stocksData = ref(new Map());
const currentStockId = ref('');

// 建立響應式的當前股票資料
const currentStock = computed(() => {
  if (!currentStockId.value) return null;
  return stocksData.value.get(currentStockId.value) || null;
});

export function useStockData() {
  
  // 設定當前股票ID
  function setCurrentStockId(stockId) {
    currentStockId.value = stockId;
    
    // 如果這支股票沒有資料，初始化它
    if (!stocksData.value.has(stockId)) {
      stocksData.value.set(stockId, {
        stockId,
        stockName: '',
        stockPrice: { price: 0, change: 0, pct: 0, trend: true },
        lastUpdate: null,
        isLoading: false
      });
    }
  }

  // 更新股票資料
  function updateStockData(stockId, data) {
    if (!stocksData.value.has(stockId)) {
      setCurrentStockId(stockId);
    }
    
    const stockData = stocksData.value.get(stockId);
    if (stockData) {
      stockData.stockName = data.stockName || stockData.stockName;
      stockData.stockPrice = data.stockPrice || stockData.stockPrice;
      stockData.lastUpdate = new Date();
      stocksData.value.set(stockId, stockData);
    }
  }

  // 設定載入狀態
  function setLoading(stockId, isLoading) {
    const stockData = stocksData.value.get(stockId);
    if (stockData) {
      stockData.isLoading = isLoading;
      stocksData.value.set(stockId, stockData);
    }
  }

  // 取得即時股票資訊
  async function fetchLiveStockInfo(stockId) {
    const url = `${API_BASE_URL}/View/liveStockInfo?stock_id=${stockId}`;

    try {
      setLoading(stockId, true);
      logger.func.start(fetchLiveStockInfo, [stockId]);
      
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      
      const response = await res.json();

      // 更新全域狀態
      updateStockData(stockId, {
        stockName: response.info.StockName,
        stockPrice: {
          price: response.info.Close,
          change: response.info.Change,
          pct: response.info.ChangePct,
          trend: response.info.Trend
        }
      });

      logger.func.success(fetchLiveStockInfo, [stockId]);
      return {
        stockName: response.info.StockName,
        stockPrice: {
          price: response.info.Close,
          change: response.info.Change,
          pct: response.info.ChangePct,
          trend: response.info.Trend
        },
        liveInfo: response.info
      };
    } catch (err) {
      logger.func.error(fetchLiveStockInfo, [stockId]);
      logger.error('取得即時股票資訊錯誤:', err);
    } finally {
      setLoading(stockId, false);
    }
  }

  // 檢查資料是否需要更新（超過30秒就重新取得）
  function shouldRefresh(stockId) {
    const stockData = stocksData.value.get(stockId);
    if (!stockData || !stockData.lastUpdate) return true;
    
    const now = new Date();
    const diff = now - stockData.lastUpdate;
    return diff > 30000; // 30秒
  }

  // 取得台灣股市開盤時間
  function isTaiwanMarketOpen() {
    const now = new Date();
    const taipeiTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    const week = taipeiTime.getDay();
    const hours = taipeiTime.getHours();
    const minutes = taipeiTime.getMinutes();

    if (week < 1 || week > 5) return false;

    const timeInMinutes = hours * 60 + minutes;
    const start = 9 * 60;
    const end = 13 * 60 + 30;
    return timeInMinutes >= start && timeInMinutes <= end;
  }

  return {
    // 狀態
    currentStock,
    currentStockId,
    
    // 方法
    setCurrentStockId,
    updateStockData,
    fetchLiveStockInfo,
    shouldRefresh,
    isTaiwanMarketOpen,
    
    // 計算屬性
    getCurrentStockData: () => currentStock.value
  };
}