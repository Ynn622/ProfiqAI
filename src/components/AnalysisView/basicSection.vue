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
                            :color="getColorByValue('eps', basicData?.eps)" />
                <SquareData :title="'P/E Ratio'" 
                            :value="basicData?.PE_ratio"
                            :valueSuffix="' 倍'"
                            :color="getColorByValue('pe', basicData?.PE_ratio)" />
                <SquareData :title="'營收 (YoY)'" 
                            :value="basicData?.MoM"
                            :valuePrefix="(basicData?.MoM > 0) ? '+' : ''"
                            :valueSuffix="' %'"
                            :color="getColorByValue('mom', basicData?.MoM)" />
                <SquareData :title="'現金股利'" 
                            :value="basicData?.stockSplits" 
                            :valueSuffix="' 元'"
                            :color="getColorByValue('dividend', basicData?.stockSplits)" />
                <SquareData :title="'ROA'" 
                            :value="basicData?.ROA"
                            :valueSuffix="' %'"
                            :color="getColorByValue('roa', basicData?.ROA)" />
                <SquareData :title="'ROE'" 
                            :value="basicData?.ROE"
                            :valueSuffix="' %'"
                            :color="getColorByValue('roe', basicData?.ROE)" />
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import SquareData from '../SquareData.vue';
import ProbCircle from '../Common/probCircle.vue';

// 工具 & 套件
import { ref, onMounted, computed } from 'vue';
import { callAPI } from '@/utils/apiConfig.js';
import { getColorByValue } from '@/utils/colorHelper.js';
import { getCurrentHourString, saveToLocalStorage, shouldCallAPI } from '@/utils/localStorageTool.js';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});
// Emits
const emit = defineEmits(['loading-start', 'loading-end'])

const loading = ref(false);
const STORAGE_KEY = `basicData_${props.stockId}`;

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

/** 
 * API: 取得基本面資料
 */
async function callBasicSectionAPI(stockId) {
    try {
        const response = await callAPI({
            url: '/View/section/basicInfo',
            params: { stockID: stockId },
            funcName: 'callBasicSectionAPI'
        });

        basicDataList.value = response;

        // 儲存到 localStorage
        saveToLocalStorage(STORAGE_KEY, basicDataList.value);
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
    }
}

onMounted(async () => {
    emit('loading-start') // 通知父組件：開始載入
    try {
        // 檢查是否需要重新打 API
        if (shouldCallAPI(STORAGE_KEY)) {
            // 需要更新，調用 API
            await callBasicSectionAPI(props.stockId);
        } else {
            // 不需要更新，從 localStorage 載入
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                basicDataList.value = JSON.parse(storedData);
                logger.debug('從 localStorage 載入基本面資料', basicDataList.value);
            }
        }
        // 更新顯示的時間
        // updateTime.value = getCurrentHourString();
    } catch (err) {
        logger.error('基本面分析初始化錯誤:', err);
    } finally {
        emit('loading-end') // 通知父組件：結束載入
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