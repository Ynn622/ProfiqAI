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
                        <AnalysisDetail v-bind="analysis.technical" />
                        <AnalysisDetail v-bind="analysis.chip" />
                        <AnalysisDetail v-bind="analysis.news" />
                        <AnalysisDetail v-bind="analysis.basic" />
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
import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { fetchBasicAnalysis, fetchTechAnalysis, fetchNewsAnalysis, fetchChipAnalysis } from '@/services/analysisService';

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

function createDefaultAnalysis(factor) {
    return {
        factor,
        direction: -99,
        description: 'AI 分析生成中...'
    };
}

const analysis = reactive({
    basic: createDefaultAnalysis('基本'),
    technical: createDefaultAnalysis('技術'),
    news: createDefaultAnalysis('消息'),
    chip: createDefaultAnalysis('籌碼')
});

// 從 PriceBar 接收的資料
const stockName = ref('');
const basicData = ref(null);
const techData = ref(null);

const basicScore = computed(() => analysis.basic.direction ?? -99);
const techScore = computed(() => analysis.technical.direction ?? -99);
const newsScore = computed(() => analysis.news.direction ?? -99);
const chipScore = computed(() => analysis.chip.direction ?? -99);

// Emits: 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
    stockName.value = data.stockName;
}

async function loadAnalysis() {
    loading.value = true;
    try {
        const [basic, tech, news, chip] = await Promise.all([
            fetchBasicAnalysis(stockId.value),
            fetchTechAnalysis(stockId.value),
            fetchNewsAnalysis(stockId.value),
            fetchChipAnalysis(stockId.value)
        ]);

        analysis.basic.direction = basic.direction;
        analysis.basic.description = basic.description;
        basicData.value = basic.basicData ?? null;

        analysis.technical.direction = tech.direction;
        analysis.technical.description = tech.description;
        techData.value = tech.technicalData ?? null;

        analysis.news.direction = news.direction;
        analysis.news.description = news.description;

        analysis.chip.direction = chip.direction;
        analysis.chip.description = chip.description;
    } finally {
        loading.value = false;
    }
}

// 頁面載入時取得各面分數
onMounted(async () => {
    await loadAnalysis();
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
        display: flex;
        flex-direction: column;
    }
    
    .segment-section {
        padding: 14px 20px;
    }
}
</style>
