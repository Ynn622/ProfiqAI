<template>
    <div class="screen">
        <Nav />
        <div class="main-content">
            <div>
                <Aside :selected="2" />
            </div>
            <div class="content">
                <PriceBar 
                    :stock-id="stockId" 
                    @updateStockData="handleStockDataUpdate"
                />
                <div class="main-bottom">
                    <div class="analysis-detail">
                        <AnalysisDetail v-bind="technicalAnalysis" />
                        <AnalysisDetail v-bind="chipAnalysis" />
                        <AnalysisDetail v-bind="marketAnalysis" />
                        <AnalysisDetail v-bind="basicAnalysis" />
                    </div>
                </div>
                <div class="segment">
                    <a-segmented class="segment" v-model:value="value" :options="data" />&nbsp; 詳細資料
                </div>
                <div class="segment-section">
                    <component :is="componentMap[value]" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import Aside from '@/components/Aside.vue';
import Nav from '@/components/Nav.vue';
import PriceBar from '@/components/PriceBar.vue';
import AnalysisDetail from '@/components/AnalysisView/AnalysisDetail.vue';
import basicSection from '@/components/AnalysisView/basicSection.vue';
import chipSection from '@/components/AnalysisView/chipSection.vue';
import newsSection from '@/components/AnalysisView/newsSection.vue';
import technicSection from '@/components/AnalysisView/technicSection.vue';

import { ref, onMounted, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';

const data = reactive(['基本', '技術', '消息', '籌碼']);
const value = ref(data[0]);
const componentMap = {
    '基本': basicSection,
    '技術': technicSection,
    '消息': newsSection,
    '籌碼': chipSection,
};

const route = useRoute();
const stockId = computed(() => route.params.stock);

// 從 PriceBar 接收的資料
const stockName = ref('');
const stockPrice = ref({ price: 0, change: 0, pct: 0, trend: true });

// 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
  stockName.value = data.stockName;
  stockPrice.value = data.stockPrice;
}

// 各面分析 假資料
const basicAnalysis = ref({
    factor: '基本',
    direction: 1,
    description: '    台積電展現出高度的穩定性與成長性。以2023年為例，全年每股盈餘（EPS）約為 30.16元新台幣，雖然較2022年略為下滑（主要受到終端需求調整與總體經濟不確定性影響），但仍處於歷史高檔區間。這反映出即使在全球半導體景氣循環調整的情況下，公司仍具強勁的獲利能力。'
});
const technicalAnalysis = ref({
    factor: '技術',
    direction: 1,
    description: '    從近期的股價走勢來看，台積電在2025年2月9日的收盤價1125元後，稍微回落至1110元（2月10日），反映出市場對於加徵關稅的不安情緒。\n目前的5MA和10MA顯示短期的均線支撐相當接近，若能穩住在此區域，則可能形成盤整或反彈機會。'
});
const marketAnalysis = ref({
    factor: '消息',
    direction: -1,
    description: '    隨著美國可能對多國徵收關稅，特別是針對半導體股，造成市場情緒不佳，這將對台積電的股價造成壓力。\n投資者需密切注意這方面的進展。然而長期來看，台積電的市場地位依然強勁，受到AI相關需求以及其他高科技產品的驅動，未來仍有增長潛力。'
});
const chipAnalysis = ref({
    factor: '籌碼',
    direction: 1,
    description: '    在籌碼面方面，外資持股比例為73.45%，投信持股比例為1.86％，自營商持股比例為6.52%。\n值得注意的是，外資持股比例在近期有所下降，顯示外資對台積電的持股態度趨於保守。'
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
    
}
</style>