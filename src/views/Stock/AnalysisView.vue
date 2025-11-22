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
                                    :basicData="basicData" :techData="techData" />
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
const techScore = ref(0);
const chipScore = ref(0);
const basicScore = ref(0);
const basicData = ref(null);
const techData = ref(null);

// 各面分析 模擬資料
const basicAnalysis = ref({
    factor: '基本',
    direction: 0,
    description: '台積電展現出高度的穩定性與成長性。以2023年為例，全年每股盈餘（EPS）約為 30.16元新台幣，雖然較2022年略為下滑（主要受到終端需求調整與總體經濟不確定性影響），但仍處於歷史高檔區間。這反映出即使在全球半導體景氣循環調整的情況下，公司仍具強勁的獲利能力。'
});
const technicalAnalysis = ref({
    factor: '技術',
    direction: 0,
    description: '從近期的股價走勢來看，台積電在2025年2月9日的收盤價1125元後，稍微回落至1110元（2月10日），反映出市場對於加徵關稅的不安情緒。\n目前的5MA和10MA顯示短期的均線支撐相當接近，若能穩住在此區域，則可能形成盤整或反彈機會。'
});
const marketAnalysis = ref({
    factor: '消息',
    direction: 0,
    description: '隨著美國可能對多國徵收關稅，特別是針對半導體股，造成市場情緒不佳，這將對台積電的股價造成壓力。\n投資者需密切注意這方面的進展。然而長期來看，台積電的市場地位依然強勁，受到AI相關需求以及其他高科技產品的驅動，未來仍有增長潛力。'
});
const chipAnalysis = ref({
    factor: '籌碼',
    direction: 0,
    description: '在籌碼面方面，外資持股比例為73.45%，投信持股比例為1.86％，自營商持股比例為6.52%。\n值得注意的是，外資持股比例在近期有所下降，顯示外資對台積電的持股態度趨於保守。'
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
    try {
        const response = await callAPI({
            url: '/tech/score',
            params: { stock_id: stockId.value },
            funcName: 'fetchTechScore'
        });
        
        const techResponse = response?.technical_data ?? null;
        const direction = techResponse?.direction ?? 0;
        technicalAnalysis.value.direction = direction;
        techScore.value = direction;
        techData.value = techResponse;
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
        technicalAnalysis.value.direction = 0;
        techScore.value = 0;
        techData.value = null;
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
