<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>基本面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <SquareData :title="'EPS'" :value="'13.95'" :change="2.01" :color="'bg-red'" />
                <SquareData :title="'P/E Ratio'" :value="'20倍'" :color="'bg-green'" />
                <SquareData :title="'營收(YoY)'" :value="'▲100%'" :color="'bg-green'" />
                <SquareData :title="'股利'" :value="'無發放'" :color="'bg-green'" />
                <SquareData :title="'ROA'" :value="'0.56%'" :color="'bg-green'" />
                <SquareData :title="'ROE'" :value="'3.14%'" :color="'bg-red'" />
            </div>
        </div>
    </div>
</template>

<script setup>
import SquareData from '../SquareData.vue';
import ProbCircle from '../probCircle.vue';

const props = defineProps({
    isUp: {
        type: Boolean,
        default: false
    },
    directionLabel: {
        type: String,
        default: ''
    }
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