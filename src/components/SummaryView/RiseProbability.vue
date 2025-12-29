<template>
    <div>
        <a-tooltip :title="functionDesc.riseProbability" placement="bottom">
            <div class="pill clickable">
                隔日上漲機率
            </div>
        </a-tooltip>
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
import { computed, ref, watch } from 'vue'
import functionDesc from '@/data/functionDesc.json'

// Props
const props = defineProps({
    probability: { type: Number, default: null }
})

// 將 probability 限制在 5~95% 之間
const boundedProbability = computed(() => {
    if (props.probability === null) return null
    return Math.max(5, Math.min(95, props.probability))
})

const displayProb = ref(0)
let animationFrame = null

const formattedProb = computed(() => {
    if (displayProb.value === null) return null
    return displayProb.value.toFixed(1).replace(/\.?0+$/, '')
})

// 回傳狀態：unknown / up / down
const probState = computed(() => {
    if (boundedProbability.value === null) return 'unknown'
    if (boundedProbability.value > 50) return 'up'
    return 'down'
})

// 監聽 probability 變化，執行動畫
watch(() => boundedProbability.value, (newVal, oldVal) => {
    // 如果有進行中的動畫，取消它
    if (animationFrame) {
        cancelAnimationFrame(animationFrame)
    }

    // 如果新值是 null，直接設為 0
    if (newVal === null) {
        displayProb.value = 0
        return
    }

    // 如果舊值是 null (從 unknown 狀態變成有值)，從 0 開始動畫
    const startVal = (oldVal === null) ? 0 : displayProb.value
    const targetVal = newVal
    const duration = 2000 // 動畫時長 (ms)
    const startTime = performance.now()

    const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // 使用 easeOutCubic 緩動函數
        const easeProgress = 1 - Math.pow(1 - progress, 10)
        
        displayProb.value = startVal + (targetVal - startVal) * easeProgress

        if (progress < 1) {
            animationFrame = requestAnimationFrame(animate)
        } else {
            displayProb.value = targetVal
            animationFrame = null
        }
    }

    animationFrame = requestAnimationFrame(animate)
}, { immediate: true })

</script>

<style scoped>
@import '/src/assets/main.css';

.clickable {
    cursor: pointer;
    user-select: none;
}

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
    
    .tooltip {
        max-width: 250px;
        font-size: 13px;
    }
}
</style>