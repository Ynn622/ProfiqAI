<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>籌碼面分析</h3>
                <ProbCircle :score="1" />
            </div>
            <div class="analysis-right">
                <div v-if="loading">
                    <LoadingMask type="small"/>
                </div>
                <div v-else class="segment">
                    <a-segmented class="segment" v-model:value="segmentValue" :options="segmentOptions" />
                    <ChipChart :chipData="chipData" :segmentValue="segmentValue" :loading="loading" />
                    <ChipTable :chipData="chipData" :segmentValue="segmentValue" :loading="loading" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import ChipChart from '../chipChart.vue';
import ChipTable from '../chipTable.vue';
import LoadingMask from '../Common/loadingMask.vue';
import ProbCircle from '../Common/probCircle.vue';

// 工具 & 套件
import { ref, onMounted, computed } from 'vue';
import { callAPI } from '@/utils/apiConfig.js';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});

const loading = ref(false);

// segment 選擇器
const segmentOptions = ['三大法人', '主力', '融資＆融券'];
// segment 目前選擇值 (預設為第一個)
const segmentValue = ref(segmentOptions[0]);

const chipData = ref(null);

/** 
 * API: 取得籌碼資料 (三大法人、主力、融資、融券)
 */
async function callChipAPI(stockId) {
    try {
        const response = await callAPI({
            url: '/chip/chipInfo',
            params: { stock_id: stockId },
            funcName: 'callChipAPI'
        });

        chipData.value = response;

        // 計算三大法人總和
        if (chipData.value && chipData.value.Foreign && chipData.value.Dealer && chipData.value.Investor) {
            chipData.value.Total = chipData.value.Foreign.map((foreign, index) => {
                const dealer = chipData.value.Dealer[index] || 0;
                const investor = chipData.value.Investor[index] || 0;
                return foreign + dealer + investor;
            });
        }
    } catch (err) {
        // 錯誤已經在 callAPI 中記錄
    }
}

onMounted(async () => {
    loading.value = true;
    await callChipAPI(props.stockId);
    loading.value = false;
});

</script>

<style scoped>

.segment {
    font-size: 15px;
}

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

/* Ant Design Segmented */
.ant-segmented {
    background-color: #cfcfcf;
}

@media (max-width: 900px) {
    .analysis-container {
        flex-direction: column;
    }
}
</style>