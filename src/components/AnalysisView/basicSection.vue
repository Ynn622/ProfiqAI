<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>基本面分析</h3>
                <ProbCircle :score="basicScore" />
            </div>
            <div class="analysis-right">
                <SquareData title="EPS" 
                            :value="displayData?.eps?.toFixed(2)" 
                            :change="displayData?.epsGap"
                            :color="getColorByValue('eps', displayData?.eps)" />
                <SquareData :title="'P/E Ratio'" 
                            :value="displayData?.PE_ratio"
                            :valueSuffix="' 倍'"
                            :color="getColorByValue('pe', displayData?.PE_ratio)" />
                <SquareData :title="'營收 (YoY)'" 
                            :value="displayData?.MoM"
                            :valuePrefix="(displayData?.MoM > 0) ? '+' : ''"
                            :valueSuffix="' %'"
                            :color="getColorByValue('mom', displayData?.MoM)" />
                <SquareData :title="'現金股利'" 
                            :value="displayData?.stockSplits" 
                            :valueSuffix="' 元'"
                            :color="getColorByValue('dividend', displayData?.stockSplits)" />
                <SquareData :title="'ROA'" 
                            :value="displayData?.ROA"
                            :valueSuffix="' %'"
                            :color="getColorByValue('roa', displayData?.ROA)" />
                <SquareData :title="'ROE'" 
                            :value="displayData?.ROE"
                            :valueSuffix="' %'"
                            :color="getColorByValue('roe', displayData?.ROE)" />
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import SquareData from '../SquareData.vue';
import ProbCircle from '../Common/probCircle.vue';

// 工具 & 套件
import { computed } from 'vue';
import { getColorByValue } from '@/utils/colorHelper.js';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true },
    basicScore: { type: Number, default: 0 },
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
    .analysis-right {
        grid-template-columns: 2fr 2fr;
        gap: 20px;
    }
}
</style>