<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>基本面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <SquareData title="EPS" 
                            :value="basicData?.eps?.toFixed(2)" 
                            :change="basicData?.epsGap"
                            :color="getColorByValue(basicData?.epsGap)" />
                <SquareData :title="'P/E Ratio'" 
                            :value="basicData?.PE_ratio"
                            :valueSuffix="' 倍'"
                            :color="getColorByValue(basicData?.PE_ratio)" />
                <SquareData :title="'營收 (YoY)'" 
                            :value="basicData?.MoM"
                            :valueSuffix="' %'"
                            :color="getColorByValue(basicData?.MoM)" />
                <SquareData :title="'現金股利'" 
                            :value="basicData?.stockSplits" 
                            :valueSuffix="' 元'"
                            :color="getColorByValue(basicData?.stockSplits)" />
                <SquareData :title="'ROA'" 
                            :value="basicData?.ROA"
                            :valueSuffix="' %'"
                            :color="getColorByValue(basicData?.ROA)" />
                <SquareData :title="'ROE'" 
                            :value="basicData?.ROE"
                            :valueSuffix="' %'"
                            :color="getColorByValue(basicData?.ROE)" />
            </div>
        </div>
    </div>
</template>

<script setup>
import SquareData from '../SquareData.vue';
import ProbCircle from '../probCircle.vue';
import { ref, onMounted, computed } from 'vue';
import { API_BASE_URL } from '@/utils/apiConfig.js';
import { getColorByValue } from '@/utils/colorHelper.js';

const loading = ref(false);
const basicDataList = ref({
    "basicData": {
        "PE_ratio": null,
        "PE_ratio_compare": null,
        "GPM": null,
        "ROA": null,
        "OPM": null,
        "ROE": null,
        "PTPM": null,
        "eps": null,
        "epsGap": null,
        "MoM": null,
        "YoY": null,
        "stockSplits": null,
        "dateDividend": null
    },
    "revenue": {
        "month": [],
        "mom": [],
        "yoy": [],
        "dividend": []
    },
    "eps": {
        "quarter": [],
        "eps": []
    }
});

const basicData = computed(() => basicDataList.value.basicData);

const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});

async function callBasicSectionAPI(stockId) {
    loading.value = true;
    try {
        logger.func.start(callBasicSectionAPI, [stockId]);
        const response = await fetch(`${API_BASE_URL}/View/basicStockInfo?stockID=${stockId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        
        const data = await response.json();
        basicDataList.value = data || [];

        logger.func.success(callBasicSectionAPI, [stockId]);
    } catch (error) {
        logger.func.error(callBasicSectionAPI, error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    callBasicSectionAPI(props.stockId);
});

</script>

<style scoped>
.analysis {
    flex: 1;
}
.analysis-container {
    display: flex;
    gap: 20px;
}

.analysis-right {
    flex: 1;
    display: grid;
    gap: 30px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    height: 100%;
}
@media (max-width: 900px) {
    .analysis-container {
        flex-direction: column;
    }
}
@media (max-width: 480px) {
    .analysis-right {
        grid-template-columns: 2fr 2fr;
        gap: 20px;
    }
}
</style>