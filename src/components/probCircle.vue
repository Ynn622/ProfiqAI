<template>
    <div class="prob-circle" :class="{ up: isUp, down: !isUp }">
        <div class="prob-text">{{ directionLabel }}</div>
    </div>
</template>

<script setup>
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

.prob-circle.up {
    background: var(--lightBull);
}

.prob-circle.up:hover {
    background: var(--lightBull-hover);
}

.prob-circle.down {
    background: var(--lightBear);
}

.prob-circle.down:hover {
    background: var(--lightBear-hover);
}

@media (max-width: 900px) {
    .prob-circle {
        width: 100px;
    }
}
</style>