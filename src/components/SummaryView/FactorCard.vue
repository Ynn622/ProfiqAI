<template>
  <div class="factor-card">
    <div class="factor-card__header">
      <h3 class="factor-card__title">{{ title }}</h3>
      <Bias :score="score" />
    </div>
    <div class="factor-card__body">
      <template v-if="type === 'stackedBar'">
        <StackedBar :segments="segments" :show-plus="barShowPlus" :value-suffix="barValueSuffix" />
      </template>
      <template v-else>
        <ul class="indicator-list">
          <li v-for="(item, idx) in indicators" :key="`indicator-${idx}`" class="indicator-item">
            <span class="indicator-icon" :class="item.direction">
              <span class="arrow">{{ item.direction === 'down' ? '↘' : '↗' }}</span>
            </span>
            <span class="indicator-label">{{ item.label }}</span>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup>
import Bias from '../Common/Bias.vue';
import StackedBar from './StackedBar.vue';

defineProps({
  title: { type: String, default: '技術面' },
  score: { type: Number, default: 1 },
  type: { type: String, default: 'indicatorList' }, // indicatorList | stackedBar
  indicators: {
    type: Array,
    default: () => [
      { label: 'EMA、 RSI', direction: 'up' },
      { label: 'ROC', direction: 'down' },
    ],
  },
  segments: {
    type: Array,
    default: () => [
      { label: '外資', value: -1000, color: '#7da8f5' },
      { label: '投信', value: -2000, color: '#f3c45c' },
      { label: '自營', value: 1000, color: '#a88cf3' },
    ],
  },
  barShowPlus: { type: Boolean, default: true },
  barValueSuffix: { type: String, default: '' },
});
</script>

<style scoped>
.factor-card {
  background: var(--card);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.factor-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.factor-card__title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.factor-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.indicator-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 18px;
}

.indicator-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 900;
  box-shadow: var(--shadow-small);
}

.indicator-icon.up {
  color: #fa7a8f;
  background: #ffe6ea;
}

.indicator-icon.down {
  color: #31c879;
  background: #e5f8ec;
}

.arrow {
  line-height: 1;
}

.indicator-label {
  color: var(--text);
}

@media (max-width: 768px) {
  .indicator-item {
    font-size: 16px;
  }
}
</style>
