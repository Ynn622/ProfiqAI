<template>
    <div class="prob-circle" :class="circleClass">
        <div class="prob-text">{{ label }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
    score: {
        type: Number,
        required: true,
        validator: (value) => (value >= -2 && value <= 2) || value == -99
    }
});

// 根據分數計算標籤
const label = computed(() => {
    switch (props.score) {
        case -99:
            return '－－';
        case -2:
            return '極空';
        case -1:
            return '偏空';
        case 0:
            return '持平';
        case 1:
            return '偏多';
        case 2:
            return '極多';
        default:
            return '持平';
    }
});

// 根據分數計算樣式類別
const circleClass = computed(() => {
    if (props.score === 2) {
        return 'extreme-up';
    } else if (props.score === 1) {
        return 'up';
    } else if (props.score === -1) {
        return 'down';
    } else if (props.score === -2) {
        return 'extreme-down';
    } else if (props.score === 0) {
        return 'flat';
    } else {
        return 'neutral';
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
    transition: background-color 0.3s ease-in-out;
}
.prob-circle:hover {
    box-shadow: var(--shadow-hover);
}

.prob-text {
    font-size: clamp(20px, 2.5vw, 30px);
    font-weight: 800;
    padding: 25px;
}

.prob-circle.flat {
    background: var(--lightFlat);
}
.prob-circle.flat:hover {
    background: var(--lightFlat-hover);
}

.prob-circle.up {
    background: var(--lightBull);
}

.prob-circle.up:hover {
    background: var(--lightBull-hover);
}

.prob-circle.extreme-up {
    background: var(--darkBull);
}

.prob-circle.extreme-up:hover {
    background: var(--darkBull-hover);
}

.prob-circle.down {
    background: var(--lightBear);
}

.prob-circle.down:hover {
    background: var(--lightBear-hover);
}

.prob-circle.extreme-down {
    background: var(--darkBear);
}

.prob-circle.extreme-down:hover {
    background: var(--darkBear-hover);
}

.prob-circle.neutral {
    background: var(--gray);
}

.prob-circle.neutral:hover {
    background: var(--gray-hover);
}

@media (max-width: 900px) {
    .prob-circle {
        width: 100px;
    }
}
</style>