<template>
    <div class="time-series-chart-container">
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
import { isMobileView } from '@/utils/userInterface.js';

const { isMobile } = isMobileView();

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
            // 支援單系列 (values) 或多系列 (series)
            return value?.labels?.length > 0 && 
                   (value?.values?.length > 0 || value?.series?.length > 0);
        }
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
    },
    multiSeries: {
        type: Boolean,
        default: false
    }
});

const chartOption = computed(() => {
    const labels = props.chartData.labels;
    const isMultiSeries = props.multiSeries && props.chartData.series;

    // 多系列圖表配置
    if (isMultiSeries) {
        const series = props.chartData.series.map((s, index) => {
            const colors = ['#1976d2', '#9c27b0', '#ff9800', '#00acc1', '#7cb342'];
            return {
                name: s.name,
                type: props.chartType,
                data: s.data,
                itemStyle: {
                    color: colors[index % colors.length]
                },
                ...(props.chartType === 'line' && {
                    smooth: true,
                    lineStyle: { width: 2 },
                    symbol: 'circle',
                    symbolSize: 6
                })
            };
        });

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: props.chartType === 'line' ? 'cross' : 'shadow'
                }
            },
            legend: {
                data: props.chartData.series.map(s => s.name),
                top: 0,
                textStyle: {
                    fontSize: isMobile.value ? 11 : 13
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '12%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: labels,
                axisLabel: {
                    rotate: 45,
                    fontSize: isMobile.value ? 10 : 12
                }
            },
            yAxis: {
                type: 'value',
                name: props.yAxisName,
                axisLabel: {
                    formatter: '{value}'
                }
            },
            series: series
        };
    }

    // 單系列圖表配置
    const values = props.chartData.values;

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: props.chartType === 'line' ? 'cross' : 'shadow'
            },
            formatter: (params) => {
                const data = params[0];
                return `<b>${data.name}</b><br/>${props.seriesName || props.yAxisName}: ${data.value}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                rotate: 45,
                fontSize: isMobile.value ? 10 : 12
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
                        fontSize: isMobile.value ? 11 : 13
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
    margin-bottom: 10px;
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
    height: 350px;
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
