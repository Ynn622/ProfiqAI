<template>
  <div class="kbar" :class="{ 'no-data': !hasData }">
    <div v-if="hasData" class="chart">
      <div class="wick" :style="wickStyle"></div>
      <div class="body" :class="trendClass" :style="bodyStyle"></div>
    </div>
    <div v-else-if="allNull" class="chart">
      <div class="flat-line"></div>
    </div>
    <div v-else class="placeholder">無資料</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  ohlc: {
    type: Object,
    default: () => ({})
  }
});

const chartHeight = 90;

const values = computed(() => {
  const parseNum = (val) => {
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  };
  const open = parseNum(props.ohlc?.open);
  const high = parseNum(props.ohlc?.high);
  const low = parseNum(props.ohlc?.low);
  const close = parseNum(props.ohlc?.close);
  return { open, high, low, close };
});

const hasData = computed(() => {
  const vals = Object.values(values.value);
  return vals.every((v) => v !== null) && !vals.every((v) => v === 0);
});

const allNull = computed(() => Object.values(values.value).every((v) => v === null));

const maxVal = computed(() => Math.max(values.value.open, values.value.high, values.value.low, values.value.close));
const minVal = computed(() => Math.min(values.value.open, values.value.high, values.value.low, values.value.close));
const range = computed(() => Math.max(maxVal.value - minVal.value, 1));
const scale = computed(() => chartHeight / range.value);

const wickStyle = computed(() => {
  const top = (maxVal.value - values.value.high) * scale.value;
  const height = (values.value.high - values.value.low) * scale.value;
  return { top: `${top}px`, height: `${height}px` };
});

const bodyStyle = computed(() => {
  const openY = (maxVal.value - values.value.open) * scale.value;
  const closeY = (maxVal.value - values.value.close) * scale.value;
  const top = Math.min(openY, closeY);
  const height = Math.max(Math.abs(openY - closeY), 2); // 保留最小高度
  return { top: `${top}px`, height: `${height}px` };
});

const trendClass = computed(() => {
  if (values.value.close > values.value.open) return 'up';
  if (values.value.close < values.value.open) return 'down';
  return 'flat';
});
</script>

<style scoped>
.kbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 70px;
}

.chart {
  position: relative;
  width: 48px;
  height: 90px;
}

.wick {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: #444;
  border-radius: 2px;
}

.body {
  position: absolute;
  left: 8px;
  right: 8px;
  border-radius: 4px;
}

.body.up {
  background: var(--darkBull, #2aa952);
}

.body.down {
  background: var(--darkBear, #dc3c3c);
}

.body.flat {
  background: var(--pill, #888);
}

.flat-line {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  margin-top: -1px;
  background: #888;
  border-radius: 4px;
}

.placeholder {
  width: 48px;
  height: 90px;
  display: grid;
  place-items: center;
  color: #999;
  font-size: 12px;
  border-radius: 6px;
  background: #f5f6fa;
  border: 1px dashed #d4d7e2;
}
</style>
