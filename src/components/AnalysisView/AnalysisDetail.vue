<template>
    <div class="analysis-card">
        <div class="pill">{{ factor }}面分析</div>
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
    text-indent: 2em;
}

@media (max-width: 500px) {
    .analysis-section {
        flex-direction: column;
    }
}
</style>
