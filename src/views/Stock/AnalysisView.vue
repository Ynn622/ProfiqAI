<template>
    <div class="screen">
        <!-- 載入中 spinner -->
        <LoadingMask v-if="loading" />
        <Nav />
        <div class="main-content">
            <div>
                <Aside :selected="2" />
            </div>
            <div class="content">
                <PriceBar :stock-id="stockId" @updateStockData="handleStockDataUpdate" />
                <div class="main-bottom">
                    <div class="analysis-detail">
                        <AnalysisDetail v-bind="technicalAnalysis" />
                        <AnalysisDetail v-bind="chipAnalysis" />
                        <AnalysisDetail v-bind="marketAnalysis" />
                        <AnalysisDetail v-bind="basicAnalysis" />
                    </div>
                </div>
                <div class="segment">
                    <a-segmented class="segment" v-model:value="segmentValue" :options="segmentOptions" />&nbsp; 詳細資料
                </div>
                <div class="segment-section">
                    <keep-alive>
                        <component :is="componentMap[segmentValue]" :stockId="stockId" :stockName="stockName" 
                                    :techScore="techScore" :chipScore="chipScore" :basicScore="basicScore" 
                                    :basicData="basicData" :techData="techData" :newsScore="newsScore" />
                    </keep-alive>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import Aside from '@/components/Common/Aside.vue';
import Nav from '@/components/Common/Nav.vue';
import PriceBar from '@/components/Common/PriceBar.vue';
import LoadingMask from '@/components/Common/loadingMask.vue';
import AnalysisDetail from '@/components/AnalysisView/AnalysisDetail.vue';
import basicSection from '@/components/AnalysisView/basicSection.vue';
import chipSection from '@/components/AnalysisView/chipSection.vue';
import newsSection from '@/components/AnalysisView/newsSection.vue';
import technicSection from '@/components/AnalysisView/technicSection.vue';

// 工具 & 套件
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { callAPI } from '@/utils/apiConfig.js';
import { saveToLocalStorage, shouldCallAPI } from '@/utils/localStorageTool.js';

// 取得路由參數
const route = useRoute();
const stockId = computed(() => route.params.stock);

// segment 選擇器
const segmentOptions = ['基本', '技術', '消息', '籌碼'];
// segment 目前選擇值 (預設為第一個)
const segmentValue = ref(segmentOptions[0]);
// segment 對應的組件
const componentMap = {
    '基本': basicSection,
    '技術': technicSection,
    '消息': newsSection,
    '籌碼': chipSection,
};

// 載入中
const loading = ref(false)

// 從 PriceBar 接收的資料
const stockName = ref('');
const basicData = ref(null);
const techData = ref(null);
const techScore = ref(0);
const chipScore = ref(0);
const basicScore = ref(0);
const newsScore = ref(0);

// 各面分析 模擬資料
const basicAnalysis = ref({
    factor: '基本',
    direction: 0,
    description: 'AI 分析生成中...'
});
const technicalAnalysis = ref({
    factor: '技術',
    direction: 0,
    description: 'AI 分析生成中...'
});
const marketAnalysis = ref({
    factor: '消息',
    direction: 0,
    description: 'AI 分析生成中...'
});
const chipAnalysis = ref({
    factor: '籌碼',
    direction: 0,
    description: 'AI 分析生成中...'
});

/** 
 * API: 取得基本面分數和資料
 */
async function fetchBasicScore() {
    const STORAGE_KEY = `basicScore_${stockId.value}`;
    
    // 檢查是否需要重新打 API
    if (!shouldCallAPI(STORAGE_KEY)) {
        // 從 localStorage 載入
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            basicAnalysis.value.direction = parsedData.direction ?? 0;
            basicAnalysis.value.description = parsedData?.basicData?.ai_insight ?? 'AI 未提供分析內容';
            basicScore.value = parsedData.direction ?? 0;
            basicData.value = parsedData.basicData ?? null;
            return;
        }
    }
    
    try {
        const response = await callAPI({
            url: '/basic/score',
            params: { stock_id: stockId.value },
            funcName: 'fetchBasicScore'
        });
        
        const direction = response?.basicData?.direction ?? 0;
        basicAnalysis.value.direction = direction;
        basicAnalysis.value.description = response?.basicData?.ai_insight ?? 'AI 未提供分析內容';
        basicScore.value = direction;
        basicData.value = response?.basicData ?? null;
        
        // 儲存到 localStorage
        saveToLocalStorage(STORAGE_KEY, {
            direction,
            basicData: response?.basicData
        });
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
        basicAnalysis.value.direction = 0;
        basicScore.value = 0;
        basicData.value = null;
    }
}

/** 
 * API: 取得技術面分數
 */
async function fetchTechScore() {
    const STORAGE_KEY = `techScore_${stockId.value}`;

    // 檢查是否需要重新打 API
    if (!shouldCallAPI(STORAGE_KEY)) {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            const direction = parsedData.direction ?? 0;
            technicalAnalysis.value.direction = direction;
            technicalAnalysis.value.description = parsedData?.technical_data?.ai_insight ?? 'AI 未提供分析內容';
            techScore.value = direction;
            techData.value = parsedData?.technical_data ?? null;
            return;
        }
    }

    try {
        const response = await callAPI({
            url: '/tech/score',
            params: { stock_id: stockId.value },
            funcName: 'fetchTechScore'
        });
        
        const techResponse = response?.technical_data ?? null;
        const direction = techResponse?.direction ?? 0;
        technicalAnalysis.value.direction = direction;
        technicalAnalysis.value.description = techResponse?.ai_insight ?? 'AI 未提供分析內容';
        techScore.value = direction;
        techData.value = techResponse;

        // 儲存到 localStorage
        saveToLocalStorage(STORAGE_KEY, {
            direction,
            technical_data: techResponse
        });
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
        technicalAnalysis.value.direction = 0;
        techScore.value = 0;
        techData.value = null;
    }
}

/** 
 * API: 取得消息面分數
 */
async function fetchNewsScore() {
    const STORAGE_KEY = `newsScore_${stockId.value}`;

    // 檢查是否需要重新打 API
    if (!shouldCallAPI(STORAGE_KEY)) {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            const direction = parsedData.direction ?? 0;
            marketAnalysis.value.direction = direction;
            marketAnalysis.value.description = parsedData.ai_insight ?? 'AI 未提供分析內容';
            newsScore.value = direction;
            return;
        }
    }

    try {
        const response = await callAPI({
            url: '/news/score',
            params: { stock_id: stockId.value },
            funcName: 'fetchNewsScore'
        });

        const direction = response?.direction ?? 0;
        marketAnalysis.value.direction = direction;
        marketAnalysis.value.description = response?.ai_insight ?? 'AI 未提供分析內容';
        newsScore.value = direction;

        // 儲存到 localStorage
        saveToLocalStorage(STORAGE_KEY, {
            direction,
            ai_insight: response?.ai_insight
        });
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
        marketAnalysis.value.direction = 0;
        newsScore.value = 0;
    }
}

/** 
 * API: 取得籌碼面分數
 */
async function fetchChipScore() {
    const STORAGE_KEY = `chipScore_${stockId.value}`;
    
    // 檢查是否需要重新打 API
    if (!shouldCallAPI(STORAGE_KEY)) {
        // 從 localStorage 載入
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            chipAnalysis.value.direction = parsedData.direction ?? 0;
            chipAnalysis.value.description = parsedData?.chip_data?.ai_insight ?? 'AI 未提供分析內容';
            chipScore.value = parsedData.direction ?? 0;
            return;
        }
    }
    
    try {
        const response = await callAPI({
            url: '/chip/score',
            params: { stock_id: stockId.value },
            funcName: 'fetchChipScore'
        });
        
        const direction = response?.chip_data?.direction ?? 0;
        chipAnalysis.value.direction = direction;
        chipAnalysis.value.description = response?.chip_data?.ai_insight ?? 'AI 未提供分析內容';
        chipScore.value = direction;
        
        // 儲存到 localStorage
        saveToLocalStorage(STORAGE_KEY, {
            direction,
            chip_data: response?.chip_data
        });
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
        chipAnalysis.value.direction = 0;
        chipScore.value = 0;
    }
}

// Emits: 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
    stockName.value = data.StockName;
}

// 頁面載入時取得各面分數
onMounted(async () => {
    loading.value = true;
    try {
        await Promise.all([
            fetchBasicScore(),
            fetchTechScore(),
            fetchNewsScore(),
            fetchChipScore()
        ]);
    } finally {
        loading.value = false;
    }
});

</script>

<style scoped>
@import '/src/assets/main.css';

.content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
}

.analysis-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: stretch;
    grid-auto-rows: 1fr;
}

.segment {
    font-size: 17px;
    font-weight: 600;
    padding: 5px;
}

/* Ant Design Segmented */
.ant-segmented {
    background-color: var(--pill);
}

.segment-section {
    display: flex;
    gap: 10px;
    padding: 18px 30px;
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
}

@media (max-width: 900px) {
    .analysis-detail {
        grid-template-columns: 1fr;
    }
    
    .segment-section {
        padding: 12px 22px;
    }
}
</style>
