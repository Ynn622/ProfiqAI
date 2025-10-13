<template>
    <div class="chip-chart-container">
        <v-chart v-if="chartOption" class="chart" :option="chartOption" autoresize />
        <div v-if="loading" class="loading">載入中...</div>
        <div v-else class="no-data">籌碼圖表資料異常，請稍後再試！</div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { use } from 'echarts/core';
import {
    CanvasRenderer
} from 'echarts/renderers';
import {
    BarChart
} from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// 註冊 ECharts 組件
use([
    CanvasRenderer,
    BarChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent
]);

// Props
const props = defineProps({
    chipData: { type: Object, default: null },
    segmentValue: { type: String, default: '三大法人' },
    loading: { type: Boolean, default: false }
});

// 數據映射配置
const dataMapping = {
    '三大法人': {
        keys: ['Foreign', 'Dealer', 'Investor'],
        labels: ['外資', '投信', '自營商'],
        colors: ['#FFA552', '#00C49A', '#0081A7']
    },
    '主力': {
        keys: ['Master'],
        labels: ['主力'],
        colors: ['#FF6B6B']
    },
    '融資＆融券': {
        keys: ['MarginBuy', 'MarginSell'],
        labels: ['融資', '融券'],
        colors: ['#FF6B6B', '#3dfca3']
    }
};

// 計算圖表配置
const chartOption = computed(() => {
    if (!props.chipData || !props.chipData.Date) {
        return null;
    }

    const config = dataMapping[props.segmentValue];
    if (!config) {
        return null;
    }

    // 格式化日期（只顯示月/日）
    const dates = props.chipData.Date.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    // 準備系列數據
    const series = config.keys.map((key, index) => ({
        name: config.labels[index],
        type: 'bar',
        data: props.chipData[key] || [],
        itemStyle: {
            color: config.colors[index]
        },
        emphasis: {
            itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
        },
        stack: props.segmentValue === '三大法人' ? 'total' : undefined,   // 只有三大法人堆疊
    }));

    return {
        title: {
            text: `${props.segmentValue} 買賣超`,
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                let result = `${params[0].axisValue}<br/>`;
                let total = 0;
                
                params.forEach(param => {
                    const value = param.value;
                    const color = param.color;
                    
                    // 檢查 value 是否為 null 或 undefined
                    if (value === null || value === undefined) {
                        result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
                        result += `${param.seriesName}: --<br/>`;
                        return; // 跳過後續處理
                    }
                    
                    result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
                    result += `${param.seriesName}: ${value > 0 ? '+' : ''}${value.toLocaleString()}<br/>`;
                    
                    // 如果是三大法人模式，累加到總計
                    if (props.segmentValue === '三大法人') {
                        total += value;
                    }
                });
                
                // 如果是三大法人模式，顯示總計
                if (props.segmentValue === '三大法人') {
                    result += `<hr style="margin: 5px 0; border: none; border-top: 1px solid #ddd;">`;
                    result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#8B5CF6;"></span>`;
                    result += `<strong>總計: ${total > 0 ? '+' : ''}${total.toLocaleString()}</strong>`;
                }
                
                return result;
            }
        },
        legend: {
            data: config.labels,
            top: 30,
            left: 'center'
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLabel: {
                rotate: 45,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function(value) {
                    // 檢查 value 是否為 null 或 undefined
                    if (value === null || value === undefined) {
                        return '--';
                    }
                    return value.toLocaleString();
                }
            }
        },
        series: series
    };
});

// 監聽 props 變化
watch([() => props.chipData, () => props.segmentValue], () => {
    // 當數據或選擇項變化時，圖表會自動重新渲染
}, { deep: true });

</script>

<style scoped>
.chip-chart-container {
    width: 100%;
    height: 500px;
}

.chart {
    width: 100%;
    height: 100%;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
}

.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
    font-size: 16px;
}
</style>