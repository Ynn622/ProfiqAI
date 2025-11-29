<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>技術面分析</h3>
                <Bias :score="techScore" variant="circle" />
            </div>
            <div class="analysis-right">
                <SquareData 
                    v-for="item in indicatorTiles" 
                    :key="item.title"
                    :title="item.title"
                    :value="item.value"
                    :color="item.color"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { computed } from 'vue';
import { getTechStatusColor } from '@/utils/colorHelper.js';

// 組件
import SquareData from '../SquareData.vue';
import Bias from '../Common/Bias.vue';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true },
    techScore: { type: Number, default: -99 },
    techData: { type: Object, default: null }
});

const indicatorTiles = computed(() => {
    const data = props.techData || {};
    return [
        { title: 'EMA', value: data.EMA_Status ?? '-', color: getTechStatusColor(data.EMA_label) },
        { title: 'MACD', value: data.MACD_Status ?? '-', color: getTechStatusColor(data.MACD_label) },
        { title: 'KD', value: data.KD_Status ?? '-', color: getTechStatusColor(data.KD_label) },
        { title: 'RSI', value: data.RSI_Status ?? '-', color: getTechStatusColor(data.RSI_label) },
        { title: 'ROC', value: data.ROC_Status ?? '-', color: getTechStatusColor(data.ROC_label) },
        { title: 'BIAS', value: data.BIAS_Status ?? '-', color: getTechStatusColor(data.BIAS_label) },
    ];
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
