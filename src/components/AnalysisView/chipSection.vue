<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>籌碼面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <div class="segment">
                    <a-segmented class="segment" v-model:value="segmentValue" :options="segmentOptions" />
                    <ChipChart :chipData="chipData" :segmentValue="segmentValue" />
                    <ChipTable :chipData="chipData" :segmentValue="segmentValue" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import ProbCircle from '../Common/probCircle.vue';

// 工具 & 套件
import { ref, onMounted, computed } from 'vue';
import { API_BASE_URL } from '@/utils/apiConfig.js';
import ChipChart from '../chipChart.vue';
import ChipTable from '../chipTable.vue';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});
// Emits
const emit = defineEmits(['loading-start', 'loading-end'])


// segment 選擇器
const segmentOptions = ['三大法人', '主力', '融資＆融券'];
// segment 目前選擇值 (預設為第一個)
const segmentValue = ref(segmentOptions[0]);

const chipData = ref(null);

/** 
 * API: 取得籌碼資料 (三大法人、主力、融資、融券)
 */
async function callChipAPI(stockId) {
    const url = `${API_BASE_URL}/View/section/chipInfo?stockID=${stockId}`;

    try {
        logger.func.start(callChipAPI, [stockId]);
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const response = await res.json();
        chipData.value = response;

        // 計算三大法人總和
        if (chipData.value && chipData.value.Foreign && chipData.value.Dealer && chipData.value.Investor) {
            chipData.value.Total = chipData.value.Foreign.map((foreign, index) => {
                const dealer = chipData.value.Dealer[index] || 0;
                const investor = chipData.value.Investor[index] || 0;
                return foreign + dealer + investor;
            });
        }

        logger.func.success(callChipAPI, [stockId]);
    } catch (err) {
        logger.func.error(callChipAPI, [stockId]);
    }
}

onMounted(async () => {
    emit('loading-start') // 通知父組件：開始載入
    await callChipAPI(props.stockId);
    emit('loading-end')   // 通知父組件：結束載入
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