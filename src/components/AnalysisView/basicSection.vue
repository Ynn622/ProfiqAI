<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>基本面分析</h3>
                <Bias :score="basicScore" variant="circle" />
            </div>
            <!-- SquareData 區塊（上方） -->
            <div class="analysis-right">
                <div class="analysis-right-square">
                    <SquareData title="EPS" :value="displayData?.eps?.toFixed(2)" :change="displayData?.epsGap"
                        :color="getColorByValue('eps', displayData?.eps)" :basicData="props.basicData" />
                    <SquareData :title="'P/E Ratio'" :value="displayData?.PE_ratio" :valueSuffix="' 倍'"
                        :color="getColorByValue('pe', displayData?.PE_ratio)" />
                    <SquareData :title="'營收 (YoY)'" :value="displayData?.MoM"
                        :valuePrefix="(displayData?.MoM > 0) ? '+' : ''" :valueSuffix="' %'"
                        :color="getColorByValue('mom', displayData?.MoM)" :basicData="props.basicData" />
                    <SquareData :title="'現金股利'" :value="displayData?.stockSplits" :valueSuffix="' 元'"
                        :color="getColorByValue('dividend', displayData?.stockSplits)" :basicData="props.basicData" />
                    <SquareData :title="'ROA'" :value="displayData?.ROA" :valueSuffix="' %'"
                        :color="getColorByValue('roa', displayData?.ROA)" />
                    <SquareData :title="'ROE'" :value="displayData?.ROE" :valueSuffix="' %'"
                        :color="getColorByValue('roe', displayData?.ROE)" />
                </div>
                <!-- 歷年同月股價分析圖表（下方） -->
                <MonthlyReturnChart :stockId="props.stockId" />
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import SquareData from '../SquareData.vue';
import Bias from '../Common/Bias.vue';
import MonthlyReturnChart from '../MonthlyReturnChart.vue';

// 工具 & 套件
import { computed } from 'vue';
import { getColorByValue } from '@/utils/colorHelper.js';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true },
    basicScore: { type: Number, default: -99 },
    basicData: { type: Object, default: null }
});

// 使用從 props 傳入的 basicData
const displayData = computed(() => props.basicData || {
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
    display: flex;
    flex-direction: column;
    margin-top: 30px;
}

.analysis-right-square {
    display: grid;
    gap: 30px;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    height: 100%;
}

@media (max-width: 665px) {
    .analysis-container {
        flex-direction: column;
    }
}
@media (max-width: 480px) {
    .analysis-right-square {
        grid-template-columns: 2fr 2fr;
        gap: 20px;
    }
    .analysis-right {
        margin-top: 0;
    }
}
</style>
