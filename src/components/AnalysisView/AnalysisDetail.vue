<template>
    <div class="analysis-card">
        <div class="pill">{{ factor }}面分析</div>
        <div class="analysis-section">
            <div>
                <ProbCircle :isUp="isUp" :directionLabel="directionLabel" />
            </div>
            <div class="analysis-desc" v-html="description">
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import ProbCircle from '../probCircle.vue';
const props = defineProps({
    factor: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: '從近期的股價走勢來看，台積電在2025年2月9日的收盤價1125元後，稍微回落至1110元（2月10日），反映出市場對於加徵關稅的不安情緒。目前的5MA和10MA顯示短期的均線支撐相當接近，若能穩住在此區域，則可能形成盤整或反彈機會。'
    },
    direction: {
        type: Number,
        default: 0
    }
});

const isUp = computed(() => props.direction > 0)

const directionLabel = computed(() => {
    if (props.direction > 0) return '偏多';
    if (props.direction < 0) return '偏空';
    return '持平';
});

</script>

<style scoped>
@import '/src/assets/main.css';

.analysis-section {
    display: flex;
    gap: 10px;
    padding: 18px;
    margin-top: -10px;
    margin-left: 20px;
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
}

.analysis-desc {
    flex: 1;
    font-size: 18px;
    font-weight: 600;
    white-space: pre-wrap;
}

@media (max-width: 500px) {
    .analysis-section {
        flex-direction: column;
    }
}
</style>