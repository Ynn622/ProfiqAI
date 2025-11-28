<template>
    <div>
        <div class="pill">隔日上漲機率</div>
        <div class="prob-circle" :class="{
            up: probState === 'up',
            down: probState === 'down',
            unknown: probState === 'unknown'
        }">
            <div v-if="probState === 'unknown'" class="prob-text">--</div>
            <div v-else class="prob-text">{{ formattedProb }}%</div>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { computed } from 'vue'

// Props
const props = defineProps({
    probability: { type: Number, default: null }
})

const formattedProb = computed(() => {
    if (props.probability === null) return null
    return props.probability.toFixed(1).replace(/\.?0+$/, '')
})

// 回傳狀態：unknown / up / down
const probState = computed(() => {
    if (props.probability === null) return 'unknown'
    if (props.probability > 50) return 'up'
    return 'down'
})

</script>

<style scoped>
@import '/src/assets/main.css';

.prob-circle {
    aspect-ratio: 1/1;
    background: var(--lightBull);
    border-radius: 50%;
    box-shadow: var(--shadow);
    display: grid;
    place-items: center;
    margin-left: 70px;
    margin-top: -30px;
}
.prob-circle.up {
    background: var(--lightBull);
}
.prob-circle.down {
    background: var(--lightBear);
}
.prob-circle.unknown {
    background: var(--gray);
}

.prob-text {
    font-size: clamp(30px, 6vw, 54px);
    font-weight: 800;
}

@media (max-width: 768px) {
    .prob-circle {
        width: 40vw;
    }
}
</style>