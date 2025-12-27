<template>
    <b>最後更新時間：{{ updateTime }} （整點更新）</b>
    <div v-if="loading" class="word-cloud-container"><loadingMask type="small" loadingText="新聞截取分析中..." /></div>
    <div v-else-if="wordCounts === null" class="no-data word-cloud-container">資料異常，請稍後再試！</div>
    <div v-else-if="Object.keys(wordCounts).length === 0" class="no-data word-cloud-container">新聞不足，文字雲無資料！</div>
    <div v-else ref="wordCloudContainer" class="word-cloud-container"></div>
</template>

<script setup>
// 組件
import loadingMask from './Common/loadingMask.vue';

// 工具 & 套件
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { callAPI } from '@/utils/apiConfig.js';
import { isMobileView } from '@/utils/userInterface.js';
import { getCurrentHourString, saveToLocalStorage, shouldCallAPI } from '@/utils/localStorageTool.js';
import * as echarts from 'echarts/core';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-wordcloud';

// Register necessary components
echarts.use([TooltipComponent, CanvasRenderer]);

// Props
const props = defineProps({
    stockId: { type: String, required: true }
});

// Emits
const emit = defineEmits(['loading-start', 'loading-end']);

const { width, isMobile } = isMobileView();
const wordCounts = ref(null);
const wordCloudContainer = ref(null);
let chartInstance = null;
const updateTime = ref('Loading...');
const WORDCLOUD_STORAGE_KEY = `wordCloud_${props.stockId}`;
const loading = ref(false);

/** 
 * API: 取得文字雲資料
 */
async function callWordCloudAPI(stockId) {
    try {
        const response = await callAPI({
            url: '/news/wordCloud',
            params: { stock_id: stockId },
            funcName: 'callWordCloudAPI'
        });

        wordCounts.value = response.wordCounts;
        
        // 存儲更新到 localStorage
        saveToLocalStorage(WORDCLOUD_STORAGE_KEY, response.wordCounts);

        logger.debug('文字雲資料:', wordCounts.value);
    } catch (err) {
        // 錯誤已經在 callAPI 中記錄
    }
}

/**
 * 初始化 ECharts 實例
 */
function initChart() {
    if (wordCloudContainer.value && !chartInstance) {
        chartInstance = echarts.init(wordCloudContainer.value);
        logger.debug('ECharts 實例已初始化');
    }
}

/**
 * 轉換資料格式並渲染文字雲
 */
function renderWordCloud() {
    if (!chartInstance || !wordCounts.value) return;

    try {
        // 將 wordCounts 轉換為 ECharts 文字雲所需的格式
        const data = Object.entries(wordCounts.value).map(([name, value]) => ({name, value}));

        const option = {
            tooltip: {
                show: true,
                formatter: function(params) {
                    return `${params.name}: ${params.value}`;
                }
            },
            series: [{
                type: 'wordCloud',
                gridSize: 5,
                sizeRange: isMobile.value ? [16, 50] : [30, 150],
                rotationRange: [-45, 45],
                width: '100%',
                height: '100%',
                drawOutOfBound: false,
                layoutAnimation: true,
                textStyle: {
                    fontFamily: 'sans-serif',
                    fontWeight: 'bold',
                    color: function () {
                        // 隨機顏色
                        const colors = [
                            '#E74C3C', // 深紅（溫暖）
                            '#16A085', // 深青綠
                            '#2980B9', // 深藍
                            '#27AE60', // 森綠
                            '#F1C40F', // 柔和金黃（不刺眼）
                            '#8E44AD', // 葡萄紫
                            '#D35400', // 深橘
                            '#2C82C9', // 海藍
                            '#7DCEA0', // 淡綠作平衡
                            '#A569BD'  // 柔紫紅
                        ];
                        return colors[Math.floor(Math.random() * colors.length)];
                    }
                },
                emphasis: {
                    focus: 'self',
                    blur: {
                        textStyle: {
                            opacity: 0.9 // 也可單獨調整文字透明度
                        }
                    },
                    textStyle: {
                        shadowBlur: 10,
                        shadowColor: '#333'
                    }
                },
                data: data
            }]
        };

        chartInstance.setOption(option);
        logger.debug('文字雲渲染完成');
    } catch (err) {
        logger.error('文字雲渲染錯誤:', err);
    }
}

/**
 * 調整圖表大小
 */
function resizeChart() {
    if (chartInstance) {
        chartInstance.resize();
        logger.debug('文字雲大小已調整');
    }
}

onMounted(async () => {
    loading.value = true;
    try {
        // 檢查是否需要重新打 API
        if (shouldCallAPI(WORDCLOUD_STORAGE_KEY)) {
            // 需要更新，調用 API
            await callWordCloudAPI(props.stockId);
        } else {
            // 不需要更新，從 localStorage 載入
            const storedData = localStorage.getItem(WORDCLOUD_STORAGE_KEY);
            if (storedData) {
                wordCounts.value = JSON.parse(storedData);
                logger.debug('從 localStorage 載入文字雲資料', wordCounts.value);
            }
        }
        // 更新顯示的時間
        updateTime.value = getCurrentHourString();
        
    } catch (err) {
        logger.error('文字雲初始化錯誤:', err);
    } finally {
        loading.value = false;
        
        // 在 loading 結束後，等待 DOM 更新完成再初始化圖表
        await nextTick();
        
        // 確認有資料且容器已渲染
        if (wordCounts.value && Object.keys(wordCounts.value).length > 0) {
            // 初始化圖表
            initChart();
            
            // 渲染文字雲
            renderWordCloud();
            
            // 監聽視窗大小變化
            window.addEventListener('resize', resizeChart);
        }
    }
});

onUnmounted(() => {
    // 移除事件監聽器
    window.removeEventListener('resize', resizeChart);
    
    // 銷毀圖表實例
    if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
        logger.debug('ECharts 實例已銷毀');
    }
});

</script>

<style scoped>
@import '/src/assets/main.css';

.word-cloud-container {
    width: 100%;
    height: 600px;
    min-height: 400px;
    background-color: transparent;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.word-cloud-container:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #585858;
    font-size: 18px;
    font-weight: 700;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .word-cloud-container {
        height: 400px;
        min-height: 300px;
    }
}

@media (max-width: 480px) {
    .word-cloud-container {
        height: 350px;
        min-height: 250px;
    }
}
</style>