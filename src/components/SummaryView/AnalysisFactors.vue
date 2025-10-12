<template>
    <div class="factors">
        <div class="pill small">{{ factor }}</div>
        <div class="direction" :class="directionClass">
          {{ directionLabel }}  <i :class="directionIcon"></i>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { computed } from 'vue';

// Props
const props = defineProps({
    factor: {
        type: String,
        default: ''
    },
    direction: {
        type: Number,
        default: 0
    }
});


const directionLabel = computed(() => {
    if (props.direction > 0) return '偏多';
    if (props.direction < 0) return '偏空';
    return '持平';
});

const directionIcon = computed(() => {
  if (props.direction > 0) return 'fa-solid fa-arrow-trend-up';
  if (props.direction < 0) return 'fa-solid fa-arrow-trend-down';
  return 'fa-solid fa-arrow-trend-flat';
});

// For the CSS class
const directionClass = computed(() => {
  if (props.direction > 0) return 'up';
  if (props.direction < 0) return 'down';
  return 'flat';
});
</script>

<style scoped>
@import '/src/assets/main.css';

.factors {
  display: flex;
  align-items: center;
  gap: 8px;
}

.direction {
  font-weight: 600;
  font-size: 16px;
}

.direction.up {
  color: var(--darkBull);
}

.direction.down {
  color: var(--darkBear);
}

.direction.flat {
  color: var(--text);
}
</style>