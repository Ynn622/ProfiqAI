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
        default: ''
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
    text-indent: 2em;
}

@media (max-width: 500px) {
    .analysis-section {
        flex-direction: column;
    }
}
</style>