<template>
    <div>
        <div class="pill">隔日上漲機率</div>
        <div class="prob-circle" :class="{ up: isUp, down: !isUp }">
            <div class="prob-text">{{ props.probability }}%</div>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { computed } from 'vue'

// Props
const props = defineProps({
    probability: { type: Number, required: true, default: 50 }
})


// 計算屬性，機率大於 50% 就上漲
const isUp = computed(() => props.probability > 50)

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

.prob-text {
    font-size: clamp(30px, 6vw, 60px);
    font-weight: 900;
}

@media (max-width: 768px) {
    .prob-circle {
        width: 50vw;
    }
}
</style>