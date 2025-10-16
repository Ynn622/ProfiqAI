<template>
    <b>最後更新時間：{{ getCurrentHourString() }} （整點更新）</b>
    <div ref="wordCloudContainer" class="word-cloud-container"></div>
</template>

<script setup>
// 工具 & 套件
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import { API_BASE_URL } from '@/utils/apiConfig.js';
import { isMobileView } from '@/utils/userInterface.js';
import * as echarts from 'echarts';
import 'echarts-wordcloud';

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

/**
 * 獲取當前整點時間字串 (格式: 2025-10-10 10:00)
 */
function getCurrentHourString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:00`;
}

/**
 * 檢查是否需要重新打 API
 */
function shouldCallAPI(stockId) {
    try {
        const lastUpdateKey = `wordCloud_lastUpdate_${stockId}`;
        const storedTime = localStorage.getItem(lastUpdateKey);
        const currentHour = getCurrentHourString();
        
        if (storedTime === currentHour) {
            logger.debug(`當前小時 ${currentHour} 已有資料，跳過 API 調用`);
            return false;
        }
        
        logger.debug(`需要更新資料，上次更新: ${storedTime || '無'}, 當前: ${currentHour}`);
        return true;
    } catch (err) {
        logger.error('檢查更新時間錯誤:', err);
        return true; // 出錯時重新打 API
    }
}

/**
 * 儲存更新時間
 */
function saveUpdateTime(stockId) {
    try {
        const lastUpdateKey = `wordCloud_lastUpdate_${stockId}`;
        const currentHour = getCurrentHourString();
        localStorage.setItem(lastUpdateKey, currentHour);
        logger.debug(`已儲存更新時間: ${currentHour}`);
    } catch (err) {
        logger.error('儲存更新時間錯誤:', err);
    }
}

/** 
 * API: 取得文字雲資料
 */
async function callWordCloudAPI(stockId) {
    const url = `${API_BASE_URL}/View/news/wordCloud?stockID=${stockId}`;

    try {
        logger.func.start(callWordCloudAPI, [stockId]);
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const response = await res.json();
        wordCounts.value = response.wordCounts;
        
        // 存儲資料到 localStorage
        const storageKey = `wordCloud_${stockId}`;
        localStorage.setItem(storageKey, JSON.stringify(response.wordCounts));
        
        // 存儲更新時間
        saveUpdateTime(stockId);

        logger.debug('文字雲資料:', wordCounts.value);
        logger.func.success(callWordCloudAPI, [stockId]);
    } catch (err) {
        logger.func.error(callWordCloudAPI, [stockId]);
        logger.error('文字雲 API 錯誤:', err);
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
    emit('loading-start') // 通知父組件：開始載入
    try {
        // 檢查是否需要重新打 API
        if (shouldCallAPI(props.stockId)) {
            // 需要更新，調用 API
            await callWordCloudAPI(props.stockId);
        } else {
            // 不需要更新，從 localStorage 載入
            const storageKey = `wordCloud_${props.stockId}`;
            const storedData = localStorage.getItem(storageKey);
            if (storedData) {
                wordCounts.value = JSON.parse(storedData);
                logger.debug('從 localStorage 載入文字雲資料');
            }
        }
        
        // 等待 DOM 渲染完成
        await nextTick();
        
        // 初始化圖表
        initChart();
        
        // 渲染文字雲
        if (wordCounts.value) {
            renderWordCloud();
        }
        
        // 監聽視窗大小變化
        window.addEventListener('resize', resizeChart);
        
    } catch (err) {
        logger.error('文字雲初始化錯誤:', err);
    } finally {
        emit('loading-end') // 通知父組件：結束載入
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