<template>
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="isVisible" class="modal-overlay" @click="handleOverlayClick">
                <div class="modal-container" :class="color" @click.stop>
                    <!-- 關閉按鈕 -->
                    <button class="close-button" @click="closeModal">
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                    <!-- 標題區 -->
                    <div class="modal-header">
                        <div class="header-main">
                            <div class="header-left">
                                <h2 class="modal-title">{{ detailData?.title || title }}</h2>
                                <p class="modal-subtitle" v-if="detailData?.fullName">{{ detailData.fullName }}</p>
                            </div>
                            <div class="header-right">
                                <div class="current-value">
                                    <span class="value-number">{{ valuePrefix }}{{ formatValue(value) }}{{ valueSuffix }}</span>
                                </div>
                                <div class="value-change" v-if="change !== 0">
                                    <span class="change-value" :class="changeClass">
                                        {{ trend }}{{ change }}
                                        <span v-html="changeIcon"></span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 內容區 -->
                    <div class="modal-content">
                        <!-- 文字說明區 -->
                        <div class="description-section" v-if="detailData?.description || detailData?.formula">
                            <h3 class="section-title">
                                <i class="fa-solid fa-info-circle"></i>
                                指標說明
                            </h3>
                            <p class="description-text">{{ detailData.description }}</p>
                            <p v-if="detailData?.formula" class="formula-inline">
                                <span class="inline-label"><i class="fa-solid fa-calculator"></i> 計算方式：</span>{{ detailData.formula }}
                            </p>
                            <div v-if="detailData?.bullish || detailData?.bearish" class="bias-wrapper">
                                <p v-if="detailData?.bullish" class="bias-line"><span class="bias-label bull"><i class="fa-solid fa-arrow-trend-up"></i> 偏多：</span>{{ detailData.bullish }}</p>
                                <p v-if="detailData?.bearish" class="bias-line"><span class="bias-label bear"><i class="fa-solid fa-arrow-trend-down"></i> 偏空：</span>{{ detailData.bearish }}</p>
                            </div>
                        </div>
                        <!-- 圖表區域 -->
                        <div v-if="title === 'EPS' && hasEpsData" class="chart-section">
                            <h3 class="section-title">
                                <i class="fa-solid fa-chart-line"></i>
                                {{ detailData?.trend || '趨勢圖' }}
                            </h3>
                            <TimeSeriesChart 
                                :chartData="epsChartData"
                                chartType="bar"
                                yAxisName="EPS"
                                seriesName="EPS"
                            />
                        </div>

                        <!-- 營收 YoY/MoM 圖表 -->
                        <div v-if="title === '營收 (YoY)' && hasRevenueData" class="chart-section">
                            <h3 class="section-title">
                                <i class="fa-solid fa-chart-line"></i>
                                {{ detailData?.trend || '趨勢圖' }}
                            </h3>
                            <TimeSeriesChart 
                                :chartData="revenueChartData"
                                chartType="line"
                                yAxisName="增長率 (%)"
                                :multiSeries="true"
                            />
                        </div>

                        <!-- 現金股利 & 股票股利圖表 -->
                        <div v-if="title === '現金股利' && hasDividendData" class="chart-section">
                            <h3 class="section-title">
                                <i class="fa-solid fa-chart-column"></i>
                                {{ detailData?.trend || '趨勢圖' }}
                            </h3>
                            <TimeSeriesChart 
                                :chartData="dividendChartData"
                                chartType="bar"
                                yAxisName="股利 (元)"
                                :multiSeries="true"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import squareDescData from '@/data/squareDesc.json';
import TimeSeriesChart from '@/components/SquareDetailChart.vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: ''
    },
    value: {
        type: [String, Number],
        default: ''
    },
    valuePrefix: {
        type: String,
        default: ''
    },
    valueSuffix: {
        type: String,
        default: ''
    },
    change: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: ''
    },
    basicData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'close']);

const isVisible = ref(props.visible);

watch(() => props.visible, (newVal) => {
    isVisible.value = newVal;
    if (newVal) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

const detailData = computed(() => {
    return squareDescData[props.title] || null;
});

const trend = computed(() => (props.change > 0 ? '+' : ''));

const changeIcon = computed(() => {
    if (props.change > 0) return '<i class="fa-solid fa-arrow-trend-up"></i>';
    if (props.change < 0) return '<i class="fa-solid fa-arrow-trend-down"></i>';
    return '';
});

const changeClass = computed(() => {
    if (props.change > 0) return 'positive';
    if (props.change < 0) return 'negative';
    return '';
});

// EPS 圖表資料
const hasEpsData = computed(() => {
    return props.basicData?.eps_trend?.quarter?.length > 0 && props.basicData?.eps_trend?.eps?.length > 0;
});

const epsChartData = computed(() => {
    if (!hasEpsData.value) return { labels: [], values: [] };
    return {
        labels: [...props.basicData.eps_trend.quarter].reverse(),
        values: [...props.basicData.eps_trend.eps].reverse()
    };
});

// 營收 YoY/MoM 圖表資料
const hasRevenueData = computed(() => {
    return props.basicData?.revenue?.month?.length > 0 && 
           props.basicData?.revenue?.yoy?.length > 0 && 
           props.basicData?.revenue?.mom?.length > 0;
});

const revenueChartData = computed(() => {
    if (!hasRevenueData.value) return { labels: [], series: [] };
    // 取最近12個月的資料並反轉（從舊到新）
    const labels = [...props.basicData.revenue.month].reverse();
    const yoyValues = [...props.basicData.revenue.yoy].reverse();
    const momValues = [...props.basicData.revenue.mom].reverse();
    
    return {
        labels: labels,
        series: [
            { name: 'YoY (%)', data: yoyValues },
            { name: 'MoM (%)', data: momValues }
        ]
    };
});

// 現金股利 & 股票股利圖表資料
const hasDividendData = computed(() => {
    return props.basicData?.dividend?.date?.length > 0 && 
           props.basicData?.dividend?.capitalGains?.length > 0 && 
           props.basicData?.dividend?.stockSplits?.length > 0;
});

const dividendChartData = computed(() => {
    if (!hasDividendData.value) return { labels: [], series: [] };
    // 取最近20筆資料並反轉
    const maxPoints = 20;
    const labels = [...props.basicData.dividend.date].slice(0, maxPoints).reverse();
    const capitalGains = [...props.basicData.dividend.capitalGains].slice(0, maxPoints).reverse().map(v => parseFloat(v) || 0);
    const stockSplits = [...props.basicData.dividend.stockSplits].slice(0, maxPoints).reverse().map(v => parseFloat(v) || 0);
    
    return {
        labels: labels,
        series: [
            { name: '現金股利 (元)', data: capitalGains },
            { name: '股票股利 (元)', data: stockSplits }
        ]
    };
});

function formatValue(val) {
    if (val === null || val === undefined) return '';
    return `${val}`;
}

function closeModal() {
    isVisible.value = false;
    emit('update:visible', false);
    emit('close');
    document.body.style.overflow = '';
}

function handleOverlayClick() {
    closeModal();
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 20px;
    overflow-y: auto;
}

.modal-container {
    background: white;
    border-radius: 16px;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
/* 將顏色套用到整個容器 */
.modal-container.bg-red { background-color: var(--lightBull); }
.modal-container.bg-dark-red { background-color: var(--darkBull); }
.modal-container.bg-green { background-color: var(--lightBear); }
.modal-container.bg-dark-green { background-color: var(--darkBear); }
.modal-container.bg-yellow { background-color: var(--lightFlat); }
.modal-container.bg-gray { background-color: var(--gray); }

/* 關閉按鈕 */
.close-button {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: #666;
    transition: all 0.3s ease;
    z-index: 10;
}

.close-button:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
    transform: rotate(90deg);
}

/* 標題區（右上顯示數值） */
.modal-header {
    padding: 20px 40px 10px;
    border-bottom: 2px solid rgba(0,0,0,0.06);
}

.header-main {
    display: flex;
    align-items: flex-start;
    gap: 16px;
}

.header-right {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: baseline;
}

.modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
}

.modal-subtitle {
    font-size: 14px;
    color: rgba(0,0,0,0.55);
    margin: 0;
}
/* 右上數值樣式 */

.current-value,
.value-change {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.value-label,
.change-label {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 600;
}

.value-number {
    font-size: 34px;
    font-weight: 700;
    color: #333;
}

.change-value {
    font-size: 18px;
    font-weight: 700;
}

.change-value.positive {
    color: #d32f2f;
}

.change-value.negative {
    color: #388e3c;
}

/* 內容區 */
.modal-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 40px;
}

.section-title i {
    color: var(--primary-color, #1976d2);
}

.section-title {
    margin-bottom: 5px;
}

/* 文字說明區 */
.description-section {
    display: flex;
    flex-direction: column;
}


.description-item {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 12px;
    border-left: 4px solid var(--primary-color, #1976d2);
}

.description-text,
.formula-text {
    margin: 0;
    line-height: 1.8;
    color: #555;
    font-size: 15px;
}

.description-text {
    text-indent: 2em;
}

.formula-inline { margin-top: 8px; color: #444; }
.inline-label { font-weight: 700; margin-right: 6px; }

/* 多空參考區 */
.bias-wrapper { margin-top: 6px; display: flex; flex-direction: column; gap: 4px; }
.bias-line { margin: 0; line-height: 1.6; font-size: 14px; }
.bias-label { font-weight: 700; }
.bias-label.bull { color: #d32f2f; }
.bias-label.bear { color: #388e3c; }
/* 通用 icon spacing */
.inline-label i, .bias-label i { margin-right: 4px; }

/* 動畫效果 */
.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
    transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
    transform: scale(0.9) translateY(-20px);
}

/* 響應式設計 */
@media (max-width: 768px) {
    .modal-container {
        max-height: 95vh;
        border-radius: 12px;
    }

    .modal-header {
        padding: 24px 20px 12px;
    }

    .modal-title {
        font-size: 22px;
    }

    .modal-subtitle {
        font-size: 14px;
    }

    .value-number {
        font-size: 28px;
    }

    .change-value {
        font-size: 20px;
    }

    .modal-content {
        padding: 5px 20px;
    }

    .section-title {
        font-size: 18px;
    }

    .description-item {
        padding: 15px;
    }

    .close-button {
        top: 15px;
        right: 15px;
        width: 36px;
        height: 36px;
        font-size: 18px;
    }
}

@media (max-width: 480px) {
    .modal-overlay {
        padding: 10px;
    }

    .modal-title {
        font-size: 20px;
    }

    .value-number {
        font-size: 24px;
    }

    .change-value {
        font-size: 18px;
    }
}
</style>
