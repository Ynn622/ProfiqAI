<template>
    <div class="prob-circle" :class="{ up: isUp, down: !isUp }">
        <div class="prob-text">{{ directionLabel }}</div>
    </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    isUp: {
        type: Boolean,
        default: false
    },
    directionLabel: {
        type: String,
        default: ''
    }
});
</script>

<style scoped>
.prob-circle {
    aspect-ratio: 1/1;
    background: var(--lightBull);
    border-radius: 50%;
    box-shadow: var(--shadow);
    display: grid;
    place-items: center;
    margin: 10px 20px;
}

.prob-text {
    font-size: clamp(20px, 6vw, 32px);
    font-weight: 900;
    padding: 25px;
}

.prob-circle.up {
    background: var(--lightBull);
}

.prob-circle.down {
    background: var(--lightBear);
}

@media (max-width: 900px) {
    .prob-circle {
        width: 100px;
    }
}
</style>