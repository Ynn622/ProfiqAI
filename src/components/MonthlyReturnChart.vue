<template>
    <div class="monthly-return-chart">
        <div class="chart-header">
            <h4>歷年同月股價分析</h4>
            <div class="chart-controls">
                <a-select
                    v-model:value="selectedMonth"
                    @change="fetchData"
                    style="width: 120px"
                    placeholder="選擇月份"
                >
                    <a-select-option v-for="month in months" :key="month.value" :value="month.value">
                        {{ month.label }}
                    </a-select-option>
                </a-select>
                <a-segmented
                    v-model:value="priceMode"
                    :options="modeOptions"
                    @change="fetchData"
                />
            </div>
        </div>
        <div class="chart-container">
            <v-chart
                v-if="chartOption"
                :option="chartOption"
                :autoresize="true"
                class="chart"
            />
            <div v-else class="loading">載入中...</div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { callAPI } from '@/utils/apiConfig.js';
import { isMobileView } from '@/utils/userInterface';

// 註冊 ECharts 組件
use([
    LineChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    CanvasRenderer,
]);

// Props
const props = defineProps({
    stockId: { type: String, required: true },
});

// 狀態
const selectedMonth = ref(new Date().getMonth() + 1); // 預設本月
const priceMode = ref('return'); // 'return': 報酬率模式, 'price': 價格模式
const chartData = ref(null);
const { isMobile } = isMobileView();

// 月份選項
const months = [
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' },
];

// 模式選項
const modeOptions = [
    { label: '報酬％', value: 'return' },
    { label: '股價＄', value: 'price' },
];

// 獲取數據
const fetchData = async () => {
    try {
        const response = await callAPI({
            url: '/stock/monthlyCumulativeReturn',
            params: {
                stock_id: props.stockId,
                target_month: selectedMonth.value,
                price_mode: priceMode.value === 'price', // 轉換為布林值
            },
            funcName: 'fetchMonthlyReturn',
        });
        
        chartData.value = response.result;
    } catch (error) {
        logger.error('獲取歷年同月數據失敗:', error);
        chartData.value = null;
    }
};

// 圖表配置
const chartOption = computed(() => {
    if (!chartData.value) return null;

    // 生成 x 軸標籤（交易日）
    const maxLength = Math.max(...chartData.value.map(series => series.data.length));
    const xAxisData = Array.from({ length: maxLength }, (_, i) => `第${i + 1}日`);

    return {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: {
                color: '#333',
            },
            formatter: (params) => {
                let result = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`;
                params.forEach((param) => {
                    let value;
                    if (param.value === null || param.value === undefined) {
                        value = 'N/A';
                    } else {
                        value = priceMode.value === 'price' 
                            ? `$${param.value.toFixed(2)}` 
                            : `${(param.value * 100).toFixed(2)}%`;
                    }
                    result += `
                        <div style="display: flex; align-items: center; margin: 3px 0;">
                            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 5px;"></span>
                            <span>${param.seriesName}: ${value}</span>
                        </div>
                    `;
                });
                return result;
            },
        },
        legend: {
            data: chartData.value.map(series => series.name),
            top: 10,
            textStyle: {
                fontSize: isMobile.value ? 12 : 14,
            },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '60px',
            containLabel: true,
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            axisLabel: {
                fontSize: isMobile.value ? 10 : 12,
                interval: Math.floor(maxLength / 10), // 控制標籤密度
            },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: priceMode.value === 'price' ? '${value}' : (value) => `${(value * 100).toFixed(0)}%`,
                fontSize: isMobile.value ? 10 : 12,
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#e0e0e0',
                },
            },
        },
        series: chartData.value.map((series) => {
            const currentYear = new Date().getFullYear().toString();
            const isCurrentYear = series.name === currentYear;
            
            return {
                name: series.name,
                type: series.type,
                data: series.data,
                smooth: false,
                lineStyle: {
                    width: isCurrentYear ? 4 : 2,
                },
                showSymbol: false,
                emphasis: {
                    focus: 'series',
                },
                z: isCurrentYear ? 10 : 1, // 今年的線顯示在最上層
            };
        }),
    };
});

// 監聽 stockId 變化
watch(() => props.stockId, () => {
    fetchData();
});

// 組件掛載時獲取數據
onMounted(() => {
    fetchData();
});
</script>

<style scoped>
.monthly-return-chart {
    margin-top: 30px;
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: var(--shadow-small);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    flex-wrap: wrap;
    gap: 10px;
}

.chart-header h4 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
}

.chart-controls {
    display: flex;
    gap: 15px;
    align-items: center;
}

.chart-container {
    width: 100%;
    min-height: 500px;
    position: relative;
}

.chart {
    width: 100%;
    height: 500px;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    font-size: 16px;
    color: #999;
}

@media (max-width: 768px) {
    .monthly-return-chart {
        padding: 15px;
    }

    .chart-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .chart-header h4 {
        font-size: 18px;
    }

    .chart-controls {
        width: 100%;
        gap: 10px;
        justify-content: space-between;
    }

    .chart-container {
        min-height: 300px;
    }

    .chart {
        height: 300px;
    }

    .loading {
        height: 300px;
    }
}
</style>
