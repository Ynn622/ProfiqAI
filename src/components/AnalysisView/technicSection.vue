<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>技術面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <SquareData title="MACD" value="11.72" :change="2.01" color="bg-red" />
                <SquareData title="KD" value="高檔鈍化" color="bg-green" />
                <SquareData title="RSI" value="死亡交叉" color="bg-green" />
                <SquareData title="週線" value="接近股價" color="bg-yellow" />
                <SquareData title="月線" value=">股價" color="bg-green" />
                <SquareData title="季線" value="<股價" color="bg-red" />
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import SquareData from '../SquareData.vue';
import ProbCircle from '../Common/probCircle.vue';

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