<template>
    <div class="analysis-card">
        <a-tooltip :title="tooltipText" placement="bottom" :z-index="100">
            <div class="pill clickable">{{ factor }}面分析</div>
        </a-tooltip>
        <div class="analysis-section">
            <div>
                <Bias :score="direction" variant="circle" />
            </div>
            <div class="analysis-desc" v-html="description">
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import Bias from '../Common/Bias.vue';
import { computed } from 'vue';
import functionDesc from '@/data/functionDesc.json';

// Props
const props = defineProps({
    factor: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    direction: {
        type: Number,
        default: -99
    }
});

// 根據 factor 取得對應的 tooltip 文字
const tooltipText = computed(() => {
    const mapping = {
        '技術': functionDesc.technical,
        '消息': functionDesc.news,
        '基本': functionDesc.basic,
        '籌碼': functionDesc.chip
    };
    return mapping[props.factor] || '';
});

</script>

<style scoped>
@import '/src/assets/main.css';

.clickable {
    cursor: pointer;
    user-select: none;
}

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
    text-indent: 2em;
}

@media (max-width: 500px) {
    .analysis-section {
        flex-direction: column;
    }
}
</style>
