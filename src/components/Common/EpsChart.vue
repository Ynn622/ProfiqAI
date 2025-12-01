<template>
    <div class="time-series-chart-container">
        <h3 class="section-title">
            <i class="fa-solid fa-chart-line"></i>
            {{ chartTitle }}
        </h3>
        <v-chart class="chart" :option="chartOption" autoresize />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart } from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// 註冊 ECharts 組件
use([
    CanvasRenderer,
    BarChart,
    LineChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    LegendComponent
]);

const props = defineProps({
    chartData: {
        type: Object,
        required: true,
        validator: (value) => {
            return value?.labels?.length > 0 && value?.values?.length > 0;
        }
    },
    chartTitle: {
        type: String,
        default: '趨勢圖'
    },
    chartType: {
        type: String,
        default: 'bar',
        validator: (value) => ['bar', 'line'].includes(value)
    },
    yAxisName: {
        type: String,
        default: ''
    },
    seriesName: {
        type: String,
        default: ''
    }
});

const chartOption = computed(() => {
    const labels = props.chartData.labels;
    const values = props.chartData.values;

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: props.chartType === 'line' ? 'cross' : 'shadow'
            },
            formatter: (params) => {
                const data = params[0];
                return `${data.name}<br/>${props.seriesName || props.yAxisName}: ${data.value}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                rotate: 45,
                fontSize: 12
            }
        },
        yAxis: {
            type: 'value',
            name: props.yAxisName,
            axisLabel: {
                formatter: '{value}'
            }
        },
        series: [
            {
                name: props.seriesName || props.yAxisName,
                type: props.chartType,
                data: values,
                itemStyle: props.chartType === 'bar' ? {
                    color: (params) => {
                        // 根據數值正負設定淺色系顏色
                        return params.value >= 0 ? '#ff2727' : '#54fc00';
                    }
                } : {
                    color: '#1976d2'
                },
                ...(props.chartType === 'bar' && {
                    label: {
                        show: true,
                        position: 'insideTop',
                        formatter: '{c}',
                        fontSize: 13
                    }
                }),
                ...(props.chartType === 'line' && {
                    smooth: true,
                    lineStyle: {
                        width: 2
                    },
                    symbol: 'circle',
                    symbolSize: 8
                })
            }
        ]
    };
});
</script>

<style scoped>
.time-series-chart-container {
    margin-bottom: 30px;
}

.section-title {
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin: 6px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-title i {
    color: var(--primary-color, #1976d2);
}

.chart {
    width: 100%;
    height: 400px;
}

@media (max-width: 768px) {
    .chart {
        height: 300px;
    }
}

@media (max-width: 480px) {
    .chart {
        height: 250px;
    }
}
</style>
