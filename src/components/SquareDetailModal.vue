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
                        <!-- 圖表區域（預留空間） -->
                        <div class="chart-section">
                            <h3 class="section-title">
                                <i class="fa-solid fa-chart-line"></i>
                                {{ detailData?.trend || '趨勢圖表' }}
                            </h3>
                            <div class="chart-placeholder">
                                <i class="fa-solid fa-chart-area chart-icon"></i>
                                <p>圖表區域預留空間</p>
                                <p class="chart-type" v-if="detailData?.chartType">
                                    圖表類型：{{ getChartTypeName(detailData.chartType) }}
                                </p>
                            </div>
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

function formatValue(val) {
    if (val === null || val === undefined) return '';
    return `${val}`;
}

function getChartTypeName(type) {
    const types = {
        'bar': '柱狀圖',
        'line': '折線圖',
        'pie': '圓餅圖',
        'area': '面積圖'
    };
    return types[type] || type;
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
    padding: 10px 40px;
}

/* 圖表區域 */
.chart-section {
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

.chart-placeholder {
    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
    border: 2px dashed #ccc;
    border-radius: 12px;
    padding: 60px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 300px;
}

.chart-icon {
    font-size: 64px;
    color: #aaa;
    margin-bottom: 10px;
}

.chart-placeholder p {
    margin: 0;
    color: #666;
    font-size: 16px;
}

.chart-type {
    font-size: 14px !important;
    color: #888 !important;
    font-style: italic;
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

    .chart-placeholder {
        padding: 40px 20px;
        min-height: 200px;
    }

    .chart-icon {
        font-size: 48px;
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

    .chart-placeholder {
        padding: 30px 15px;
        min-height: 180px;
    }

    .chart-icon {
        font-size: 40px;
    }
}
</style>
