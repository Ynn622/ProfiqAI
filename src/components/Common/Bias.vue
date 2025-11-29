<template>
  <span v-if="variant === 'badge'" class="badge" :class="badgeClass">{{ label }}</span>
  <div v-else class="bias-circle" :class="circleClass">
    <div class="bias-circle__text">{{ label }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  score: {
    type: Number,
    default: 1,
    validator: (value) => (value >= -2 && value <= 2) || value === -99,
  },
  variant: {
    type: String,
    default: 'badge', // badge | circle
  },
});

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

const badgeClass = computed(() => {
  if (props.score === 2) return 'badge--extreme-bull';
  if (props.score === 1) return 'badge--bull';
  if (props.score === -1) return 'badge--bear';
  if (props.score === -2) return 'badge--extreme-bear';
  if (props.score === 0) return 'badge--flat';
  return 'badge--neutral';
});

const circleClass = computed(() => {
  if (props.score === 2) return 'circle--extreme-bull';
  if (props.score === 1) return 'circle--bull';
  if (props.score === -1) return 'circle--bear';
  if (props.score === -2) return 'circle--extreme-bear';
  if (props.score === 0) return 'circle--flat';
  return 'circle--neutral';
});
</script>

<style scoped>
/* badge */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 14px;
  border: 1.5px solid transparent;
  box-shadow: var(--shadow-small);
}

.badge--bull {
  color: #c0392b;
  background: #ffd6d6;
  border-color: #ff6b6b;
}

.badge--extreme-bull {
  color: #fff9f9;
  background: #ff6b6b;
  border-color: #e74c3c;
}

.badge--bear {
  color: #148f48;
  background: #d6f8df;
  border-color: #2ecc71;
}

.badge--extreme-bear {
  color: #f7fff9;
  background: #2ecc71;
  border-color: #27ae60;
}

.badge--flat {
  color: #8c6f1d;
  background: #fff5bf;
  border-color: #f5c542;
}

.badge--neutral {
  color: #6b7280;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

/* circle */
.bias-circle {
  aspect-ratio: 1/1;
  border-radius: 50%;
  box-shadow: var(--shadow);
  display: grid;
  place-items: center;
  transition: background-color 0.3s ease-in-out;
  max-width: 100%;
  margin: 10px 20px;
}

.bias-circle__text {
  font-size: clamp(20px, 2.5vw, 30px);
  font-weight: 800;
  padding: 25px;
}

.circle--flat {
  background: var(--lightFlat);
}

.circle--bull {
  background: var(--lightBull);
}

.circle--extreme-bull {
  background: var(--darkBull);
}

.circle--bear {
  background: var(--lightBear);
}

.circle--extreme-bear {
  background: var(--darkBear);
}

.circle--neutral {
  background: var(--gray);
}

@media (max-width: 900px) {
  .bias-circle {
    width: 100px;
  }
}
</style>
