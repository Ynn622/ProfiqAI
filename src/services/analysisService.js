// 共用的分析資料取得服務，提供 SummaryView 與 AnalysisView 重複利用
import { callAPI } from '@/utils/apiConfig';
import { saveToLocalStorage, shouldCallAPI } from '@/utils/localStorageTool';

const inFlightRequests = {
  basic: new Map(),
  tech: new Map(),
  news: new Map(),
  chip: new Map(),
};

const memoryCache = {
  basic: new Map(),
  tech: new Map(),
  news: new Map(),
  chip: new Map(),
};

const STORAGE_KEYS = {
  basic: (stockId) => `basicScore_${stockId}`,
  tech: (stockId) => `techScore_${stockId}`,
  news: (stockId) => `newsScore_${stockId}`,
  chip: (stockId) => `chipScore_${stockId}`,
};

const DEFAULT_DESCRIPTION = 'AI 未提供分析內容';

function normalizeBasic(source = {}) {
  const basicData = source?.basicData ?? null;
  const direction = source?.direction ?? basicData?.direction ?? -99;
  return {
    direction,
    description: basicData?.ai_insight ?? DEFAULT_DESCRIPTION,
    basicData,
  };
}

function normalizeTech(source = {}) {
  const technicalData = source?.technical_data ?? null;
  const direction = source?.direction ?? technicalData?.direction ?? -99;
  return {
    direction,
    description: technicalData?.ai_insight ?? DEFAULT_DESCRIPTION,
    technicalData,
  };
}

function normalizeNews(source = {}) {
  const newsData = source?.news_data ?? null;
  const direction = source?.direction ?? newsData?.direction ?? -99;
  return {
    direction,
    description: newsData?.ai_insight ?? DEFAULT_DESCRIPTION,
    newsData,
  };
}

function normalizeChip(source = {}) {
  const chipData = source?.chip_data ?? null;
  const direction = source?.direction ?? chipData?.direction ?? -99;
  return {
    direction,
    description: chipData?.ai_insight ?? DEFAULT_DESCRIPTION,
    chipData,
  };
}

function readLocal(storageKey, normalizer) {
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return normalizer(parsed);
  } catch (err) {
    // localStorage 解析失敗時，返回 null 讓呼叫端重新打 API
    return null;
  }
}

async function fetchWithCache(type, stockId, fetcher, normalizer, savePayload) {
  const storageKey = STORAGE_KEYS[type](stockId);

  // 如已有同筆請求進行中，直接共用
  const pending = inFlightRequests[type].get(storageKey);
  if (pending) return pending;

  // 先嘗試讀取本地快取
  const useLocal = !shouldCallAPI(storageKey);
  const cached = memoryCache[type].get(storageKey);
  if (useLocal && cached) {
    return cached;
  }

  if (useLocal) {
    const localData = readLocal(storageKey, normalizer);
    if (localData) {
      memoryCache[type].set(storageKey, localData);
      return localData;
    }
  }

  // 若本地沒有或需要更新，打 API，但仍要避免重複請求
  const requestPromise = (async () => {
    const response = await fetcher();
    const normalized = normalizer(response);
    if (savePayload) {
      savePayload(storageKey, normalized, response);
    }
    memoryCache[type].set(storageKey, normalized);
    return normalized;
  })().finally(() => {
    inFlightRequests[type].delete(storageKey);
  });

  inFlightRequests[type].set(storageKey, requestPromise);
  return requestPromise;
}

export function fetchBasicAnalysis(stockId) {
  return fetchWithCache(
    'basic',
    stockId,
    () =>
      callAPI({
        url: '/basic/score',
        params: { stock_id: stockId },
        funcName: 'fetchBasicScore',
      }),
    normalizeBasic,
    (storageKey, normalized, response) => {
      // 儲存原始 API 回應,讓 normalizer 可以正確處理
      saveToLocalStorage(storageKey, response);
    }
  );
}

export function fetchTechAnalysis(stockId) {
  return fetchWithCache(
    'tech',
    stockId,
    () =>
      callAPI({
        url: '/tech/score',
        params: { stock_id: stockId },
        funcName: 'fetchTechScore',
      }),
    normalizeTech,
    (storageKey, normalized, response) => {
      // 儲存原始 API 回應,讓 normalizer 可以正確處理
      saveToLocalStorage(storageKey, response);
    }
  );
}

export function fetchNewsAnalysis(stockId) {
  return fetchWithCache(
    'news',
    stockId,
    () =>
      callAPI({
        url: '/news/score',
        params: { stock_id: stockId },
        funcName: 'fetchNewsScore',
      }),
    normalizeNews,
    (storageKey, normalized, response) => {
      // 儲存原始 API 回應,讓 normalizer 可以正確處理
      saveToLocalStorage(storageKey, response);
    }
  );
}

export function fetchChipAnalysis(stockId) {
  return fetchWithCache(
    'chip',
    stockId,
    () =>
      callAPI({
        url: '/chip/score',
        params: { stock_id: stockId },
        funcName: 'fetchChipScore',
      }),
    normalizeChip,
    (storageKey, normalized, response) => {
      // 儲存原始 API 回應,讓 normalizer 可以正確處理
      saveToLocalStorage(storageKey, response);
    }
  );
}

export async function fetchAllAnalysis(stockId) {
  const [basic, tech, news, chip] = await Promise.all([
    fetchBasicAnalysis(stockId),
    fetchTechAnalysis(stockId),
    fetchNewsAnalysis(stockId),
    fetchChipAnalysis(stockId),
  ]);

  return { basic, tech, news, chip };
}
