<template>
  <div class="stacked-bar">
    <div class="stacked-bar__track" :style="{ borderRadius: rounded ? '10px' : '4px', height: `${height}px` }">
      <a-tooltip
        v-for="(segment, idx) in normalizedSegments"
        :key="idx"
        :title="`${segment.label}: ${formatValue(segment)}`"
        placement="top"
      >
        <div
          class="stacked-bar__segment"
          :class="{ 'stacked-bar__segment--small': segment.percentage < minDisplayWidth }"
          :style="{ width: `${segment.percentage}%`, backgroundColor: segment.color || '#d1d5db', color: '#111' }"
        >
          <span v-if="segment.percentage >= minDisplayWidth" class="stacked-bar__value">
            {{ formatValue(segment) }}
          </span>
          <span v-else class="stacked-bar__question"></span>
        </div>
      </a-tooltip>
    </div>
    <div v-if="showLabels" class="stacked-bar__labels">
      <div
        v-for="(segment, idx) in normalizedSegments"
        :key="`label-${idx}`"
        class="stacked-bar__label"
        :style="{ width: `${segment.percentage}%` }"
      >
        {{ segment.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Tooltip as ATooltip } from 'ant-design-vue';

const props = defineProps({
  segments: {
    type: Array,
    default: () => [
      { label: '外資', value: -1000, color: '#7da8f5' },
      { label: '投信', value: -2000, color: '#f3c45c' },
      { label: '自營', value: 1000, color: '#a88cf3' },
    ],
  },
  height: { type: Number, default: 32 },
  rounded: { type: Boolean, default: true },
  showLabels: { type: Boolean, default: true },
  valueSuffix: { type: String, default: '' },
  showPlus: { type: Boolean, default: true },
  minDisplayWidth: { type: Number, default: 15 }, // 最小顯示數值的寬度百分比
});

const normalizedSegments = computed(() => {
  if (!props.segments?.length) return [];
  const total = props.segments.reduce((sum, seg) => sum + Math.abs(seg.value || 0), 0);

  // 如果沒有數值，也用平均寬度展示結構
  if (!total) {
    const share = 100 / props.segments.length;
    return props.segments.map((segment) => ({ ...segment, percentage: share }));
  }

  return props.segments.map((segment) => {
    const widthPct = (Math.abs(segment.value || 0) / total) * 100;
    return {
      ...segment,
      percentage: Number.isFinite(widthPct) ? widthPct : 0,
    };
  });
});

const formatValue = (segment) => {
  const raw = segment?.displayValue ?? segment?.value;
  if (raw === null || raw === undefined) return '--';
  if (typeof segment?.displayValue === 'string') return segment.displayValue;

  if (typeof raw === 'number') {
    const prefix = props.showPlus && raw > 0 ? '+' : '';
    const unit = segment?.unit || props.valueSuffix || '';
    return `${prefix}${raw}${unit}`;
  }
  return raw;
};
</script>

<style scoped>
.stacked-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stacked-bar__track {
  width: 100%;
  overflow: hidden;
  display: flex;
  gap: 2px;
  box-shadow: var(--shadow-small);
}

.stacked-bar__segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: opacity 0.2s;
}

.stacked-bar__segment:hover {
  opacity: 0.85;
}

.stacked-bar__labels {
  display: flex;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #4b5563;
  line-height: normal;
}

.stacked-bar__label {
  text-align: center;
}

.stacked-bar__value {
  white-space: nowrap;
}

.stacked-bar__question {
  font-size: 16px;
  font-weight: 700;
  opacity: 0.7;
}
</style>
