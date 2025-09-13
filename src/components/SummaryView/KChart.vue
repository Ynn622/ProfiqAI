<template>
    <div class="kchart-wrapper">
        <!-- 工具欄 -->
        <div class="toolbar">
            <label class="toolbar-item">
                K線覆蓋：
                <select v-model="overlayIndicator" class="select-input">
                    <option value="none">無</option>
                    <option value="MA">MA</option>
                    <option value="EMA">EMA</option>
                    <option value="BOLL">布林通道</option>
                </select>
            </label>

            <label class="toolbar-item">
                下方顯示：
                <select v-model="bottomMode" class="select-input">
                    <optgroup label="量能">
                        <option value="volume">成交量</option>
                    </optgroup>
                    <optgroup label="籌碼">
                        <option value="foreign">外資</option>
                        <option value="trust">投信</option>
                        <option value="dealer">自營商</option>
                        <option value="three">三大法人</option>
                    </optgroup>
                    <optgroup label="主力">
                        <option value="major">主力買賣超</option>
                    </optgroup>
                </select>
            </label>
        </div>

        <!-- 圖表容器 -->
        <div v-if="hasValidData" ref="chartRef" class="kchart-container"></div>
        <div v-else class="placeholder">
            K 線資料異常！<br />請確認網路狀態，或稍後再試。
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { SMA, EMA, BollingerBands } from 'trading-signals'
import * as echarts from 'echarts'

// ===== Props & Refs =====
const props = defineProps({
  kData: { 
    type: Object, 
    required: true 
  }
})

// 響應式資料
const innerData = ref(null)
const bottomMode = ref('volume')
const overlayIndicator = ref('MA') // none | MA | EMA | BOLL
const chartRef = ref(null)

// 圖表實例
let chartInstance = null

// ===== 常數定義 =====
const BOTTOM_LABEL_MAP = {
  volume: '成交量',
  foreign: '外資',
  trust: '投信',
  dealer: '自營商',
  three: '三大法人',
  major: '主力買賣超'
}

const MA_COLORS = ['#f2c500', '#ff7f50', '#6bc1ff', '#91cc75', '#5470c6', '#ee6666']
const MA_PERIODS = [5, 10, 20, 60, 120, 240]
const DEFAULT_VISIBLE_PERIODS = [5, 10, 20]

// ===== 工具函數 =====
/**
 * 將數值轉換為數字或 null
 */
function numberOrNull(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * 驗證資料格式是否有效
 */
function validateData(data) {
  if (!data || typeof data !== 'object') return false
  
  const { category, values, volumes } = data
  if (!Array.isArray(category) || !Array.isArray(values) || !Array.isArray(volumes)) {
    return false
  }
  
  if (category.length !== values.length || values.length !== volumes.length) {
    return false
  }
  
  return values.every(row => 
    Array.isArray(row) && 
    row.length >= 4 && 
    row.every(num => typeof num === 'number')
  )
}

/**
 * 將新版資料格式轉換為內部格式
 * 新版格式：{ Date, OHLC, Volume, Foreign, Dealer, Investor, MainForce }
 * 內部格式：{ category, values, volumes, chips... }
 */
function parseNewFormatData(rawData) {
  if (!rawData || typeof rawData !== 'object') return null
  
  const dates = Array.isArray(rawData.Date) ? rawData.Date : []
  const ohlc = Array.isArray(rawData.OHLC) ? rawData.OHLC : []
  const volumes = Array.isArray(rawData.Volume) ? rawData.Volume : []
  const foreignArr = Array.isArray(rawData.Foreign) ? rawData.Foreign : []
  const trustArr = Array.isArray(rawData.Dealer) ? rawData.Dealer : []
  const dealerArr = Array.isArray(rawData.Investor) ? rawData.Investor : []
  const majorArr = Array.isArray(rawData.MainForce) ? rawData.MainForce : []

  const dataLength = Math.min(dates.length, ohlc.length, volumes.length)
  const result = {
    category: [],
    values: [],
    volumes: [],
    chipsForeign: [],
    chipsTrust: [],
    chipsDealer: [],
    chipsMajor: [],
    chipsThree: []
  }

  for (let i = 0; i < dataLength; i++) {
    const date = dates[i]
    const ohlcRow = ohlc[i]
    
    if (!Array.isArray(ohlcRow) || ohlcRow.length < 4) continue
    
    const [open, high, low, close] = ohlcRow.map(Number)
    const volume = Number(volumes[i])
    
    if ([open, high, low, close, volume].some(num => Number.isNaN(num))) continue

    // ECharts K線需要 [open, close, low, high] 格式
    result.category.push(date)
    result.values.push([open, close, low, high])
    result.volumes.push(volume)

    // 籌碼資料處理
    const foreign = numberOrNull(foreignArr[i])
    const trust = numberOrNull(trustArr[i])
    const dealer = numberOrNull(dealerArr[i])
    const major = numberOrNull(majorArr[i])

    result.chipsForeign.push(foreign)
    result.chipsTrust.push(trust)
    result.chipsDealer.push(dealer)
    result.chipsMajor.push(major)

    // 計算三大法人總和
    const validChips = [foreign, trust, dealer].filter(val => typeof val === 'number')
    const threeSum = validChips.length > 0 
      ? validChips.reduce((sum, val) => sum + val, 0) 
      : null
    result.chipsThree.push(threeSum)
  }

  return result
}

// ===== 計算屬性 =====
// 監聽 props 變化並轉換資料格式
watch(() => props.kData, (newData) => {
  const parsedData = newData && typeof newData === 'object' 
    ? parseNewFormatData(newData) 
    : null
  innerData.value = validateData(parsedData) ? parsedData : null
}, { immediate: true })

// 檢查是否有有效資料
const hasValidData = computed(() => validateData(innerData.value))

// 取得收盤價陣列
const closePrices = computed(() => 
  hasValidData.value 
    ? innerData.value.values.map(row => row[1]) 
    : []
)

// 取得底部圖表資料
const bottomData = computed(() => {
  if (!hasValidData.value) return []
  
  const data = innerData.value
  const modeMap = {
    volume: data.volumes,
    foreign: data.chipsForeign,
    trust: data.chipsTrust,
    dealer: data.chipsDealer,
    three: data.chipsThree,
    major: data.chipsMajor
  }
  
  return modeMap[bottomMode.value] || data.chipsMajor
})

// ===== 技術指標計算 =====
/**
 * 計算技術指標
 * @param {string} type - 指標類型 (MA, EMA, BOLL)
 * @param {number} period - 週期
 * @param {number} multiplier - 布林通道倍數
 */
function calculateIndicator(type, period, multiplier = 2) {
  const prices = closePrices.value
  if (!prices.length) {
    return type === 'BOLL' 
      ? { mid: [], upper: [], lower: [] } 
      : []
  }
  
  switch (type) {
    case 'MA': {
      const sma = new SMA(period)
      return prices.map(price => {
        const result = sma.update(price)
        return result ? Number(result.toFixed(2)) : null
      })
    }
    
    case 'EMA': {
      const ema = new EMA(period)
      return prices.map(price => {
        const result = ema.update(price)
        return result ? Number(result.toFixed(2)) : null
      })
    }
    
    case 'BOLL': {
      const bb = new BollingerBands(period, multiplier)
      const result = { mid: [], upper: [], lower: [] }
      
      for (const price of prices) {
        const bollResult = bb.update(price)
        if (bollResult) {
          result.mid.push(Number(bollResult.middle.toFixed(2)))
          result.upper.push(Number(bollResult.upper.toFixed(2)))
          result.lower.push(Number(bollResult.lower.toFixed(2)))
        } else {
          result.mid.push(null)
          result.upper.push(null)
          result.lower.push(null)
        }
      }
      return result
    }
    
    default:
      return []
  }
}

// 快取計算結果，避免重複計算
const indicators = computed(() => {
  if (!hasValidData.value) return {}
  
  const result = {}
  
  // MA 系列指標
  result.MA = MA_PERIODS.reduce((acc, period) => {
    acc[period] = calculateIndicator('MA', period)
    return acc
  }, {})
  
  // EMA 系列指標
  result.EMA = MA_PERIODS.reduce((acc, period) => {
    acc[period] = calculateIndicator('EMA', period)
    return acc
  }, {})
  
  // 布林通道
  result.BOLL = calculateIndicator('BOLL', 22, 2)
  
  return result
})

// ===== 圖表配置 =====
/**
 * 建構底部圖表系列資料
 */
function buildBottomSeries() {
  const isVolumeMode = bottomMode.value === 'volume'
  const { values } = innerData.value
  
  if (isVolumeMode) {
    // 成交量圖表
    const volumeData = bottomData.value.map((volume, index) => {
      const [open, close] = values[index]
      return {
        value: volume,
        itemStyle: { 
          color: close > open ? '#d60000' : '#00aa55' 
        }
      }
    })
    
    return {
      name: '成交量',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: volumeData,
      large: true
    }
  } else {
    // 籌碼圖表
    const chipsData = bottomData.value.map(value => 
      value == null ? null : {
        value,
        itemStyle: { 
          color: value >= 0 ? '#d60000' : '#00aa55' 
        }
      }
    )
    
    return {
      name: BOTTOM_LABEL_MAP[bottomMode.value] || '籌碼',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: chipsData,
      large: true
    }
  }
}

/**
 * 建構覆蓋指標系列資料
 */
function buildOverlaySeries() {
  const overlay = []
  const legendItems = ['K線']
  const indicatorData = indicators.value
  
  if (overlayIndicator.value === 'MA') {
    MA_PERIODS.forEach((period, index) => {
      overlay.push({
        name: `MA${period}`,
        type: 'line',
        data: indicatorData.MA?.[period] || [],
        smooth: true,
        showSymbol: false,
        lineStyle: { 
          width: 1, 
          color: MA_COLORS[index % MA_COLORS.length] 
        },
        emphasis: { disabled: true },
        legendHoverLink: false
      })
      legendItems.push(`MA${period}`)
    })
  } else if (overlayIndicator.value === 'EMA') {
    MA_PERIODS.forEach((period, index) => {
      overlay.push({
        name: `EMA${period}`,
        type: 'line',
        data: indicatorData.EMA?.[period] || [],
        smooth: true,
        showSymbol: false,
        lineStyle: { 
          width: 1, 
          color: MA_COLORS[index % MA_COLORS.length] 
        },
        emphasis: { disabled: true },
        legendHoverLink: false
      })
      legendItems.push(`EMA${period}`)
    })
  } else if (overlayIndicator.value === 'BOLL') {
    const bollData = indicatorData.BOLL || { mid: [], upper: [], lower: [] }
    overlay.push(
      {
        name: 'BOLL_MID',
        type: 'line',
        data: bollData.mid,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#f2c500' },
        emphasis: { disabled: true }
      },
      {
        name: 'BOLL_UPPER',
        type: 'line',
        data: bollData.upper,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#6bc1ff' },
        emphasis: { disabled: true }
      },
      {
        name: 'BOLL_LOWER',
        type: 'line',
        data: bollData.lower,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#ee6666' },
        emphasis: { disabled: true }
      }
    )
    legendItems.push('BOLL_MID', 'BOLL_UPPER', 'BOLL_LOWER')
  }
  
  return { overlay, legendItems }
}

/**
 * 建構完整的圖表配置選項
 */
function buildChartOption() {
  if (!hasValidData.value) {
    return { series: [] }
  }

  const { category, values } = innerData.value
  const { overlay, legendItems } = buildOverlaySeries()
  const bottomSeries = buildBottomSeries()
  
  // 添加底部圖表標籤到圖例
  legendItems.push(BOTTOM_LABEL_MAP[bottomMode.value] || '成交量')

  return {
    animation: false,
    backgroundColor: 'transparent',
    
    // 工具提示配置
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        if (!params || !params.length) return ''
        
        const data = params[0]
        const date = data.axisValue
        let content = `<div style="margin-bottom: 8px; font-weight: bold;">${date}</div>`
        
        // K線數據顯示
        const candlestickData = params.find(p => p.seriesName === 'K線')
        if (candlestickData && candlestickData.data) {
          const [index, open, close, low, high] = candlestickData.data
          const color = close > open ? '#d60000' : '#00aa55'
          content += `
            <div style="margin-bottom: 4px;">
              <span style="color: ${color};">●</span> 開盤: ${open.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: ${color};">●</span> 收盤: ${close.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #8b5cf6;">●</span> 最高: ${high.toFixed(2)}
            </div>
            <div style="margin-bottom: 4px;">
              <span style="color: #5470c6;">●</span> 最低: ${low.toFixed(2)}
            </div>
            <hr style="background-color: #eee;"/>
          `
        }
        
        // 其他指標顯示
        params.forEach(param => {
          if (param.seriesName !== 'K線' && param.value != null) {
            const color = param.color || '#666'
            const value = typeof param.value === 'number' 
              ? param.value.toFixed(2) 
              : param.value
            content += `
              <div style="margin-bottom: 4px;">
                <span style="color: ${color};">★</span> ${param.seriesName}: ${value}
              </div>
            `
          }
        })
        
        return content
      }
    },
    
    // 圖例配置
    legend: {
      type: 'scroll',
      data: legendItems,
      top: 6,
      left: 16,
      right: 16,
      orient: 'horizontal',
      textStyle: { color: '#ccc' },
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 12,
      pageIconColor: '#ccc',
      pageTextStyle: { color: '#ccc' },
      selected: generateLegendSelection(legendItems)
    },
    
    // 網格配置
    grid: [
      { left: 50, right: 20, top: 70, height: '56%' },
      { left: 50, right: 20, top: '72%', height: '20%' }
    ],
    
    // 軸指針聯動
    axisPointer: { 
      link: [{ xAxisIndex: [0, 1] }] 
    },
    
    // X軸配置
    xAxis: [
      {
        type: 'category',
        data: category,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: { color: '#666' },
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 1,
        data: category,
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#999' } },
        axisLabel: { color: '#666' }
      }
    ],
    
    // Y軸配置
    yAxis: [
      {
        scale: true,
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { lineStyle: { color: '#eee' } },
        axisLabel: { color: '#666' }
      },
      {
        gridIndex: 1,
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { show: false },
        axisLabel: { color: '#666' }
      }
    ],
    
    // 資料縮放配置
    dataZoom: [
      { 
        type: 'inside', 
        xAxisIndex: [0, 1], 
        start: 60, 
        end: 100 
      },
      { 
        type: 'slider', 
        xAxisIndex: [0, 1], 
        top: '95%', 
        start: 60, 
        end: 100 
      }
    ],
    
    // 系列資料
    series: [
      {
        name: 'K線',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: '#d60000',      // 上漲顏色
          color0: '#00aa55',     // 下跌顏色
          borderColor: '#d60000',
          borderColor0: '#00aa55'
        }
      },
      ...overlay,
      bottomSeries
    ]
  }
}

/**
 * 生成圖例選擇狀態
 */
function generateLegendSelection(legendItems) {
  const selected = {}
  legendItems.forEach(item => {
    // 對於長期移動平均線，預設隱藏
    if (item.match(/^(MA|EMA)(60|120|240)$/)) {
      selected[item] = false
    } else {
      selected[item] = true
    }
  })
  return selected
}

// ===== 圖表管理 =====
/**
 * 初始化圖表
 */
function initChart() {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption(buildChartOption())
  window.addEventListener('resize', handleResize)
}

/**
 * 處理視窗大小調整
 */
function handleResize() {
  chartInstance?.resize()
}

/**
 * 更新圖表
 */
function updateChart() {
  if (!chartInstance) return
  
  try {
    chartInstance.setOption(buildChartOption(), true)
  } catch (error) {
    logger.error('圖表更新錯誤:', error, innerData.value)
  }
}

// ===== 生命週期與監聽器 =====
// 監聽底部模式變化
watch(() => bottomMode.value, updateChart)

// 監聽覆蓋指標變化
watch(() => overlayIndicator.value, updateChart)

// 監聽資料變化
watch(() => innerData.value, updateChart, { deep: true })

// 組件掛載時初始化圖表
onMounted(() => {
  if (hasValidData.value) {
    initChart()
  }
})

// 組件卸載時清理資源
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
/* ===== 主容器樣式 ===== */
.kchart-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 5px;
}

/* ===== 工具欄樣式 ===== */
.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 14px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.toolbar-item {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #333;
  gap: 8px;
}

/* ===== 下拉選單樣式 ===== */
.select-input {
  padding: 8px 12px;
  padding-right: 32px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background-color: #ffffff;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  appearance: none;
  min-width: 120px;
}

.select-input:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

/* ===== 下拉選單選項樣式 ===== */
.select-input optgroup {
  font-weight: 600;
  color: #6b7280;
  background-color: #f9fafb;
  font-style: normal;
  padding: 4px 0;
}

.select-input option {
  padding: 8px 12px;
  color: #374151;
  background-color: #ffffff;
}

.select-input option:hover {
  background-color: #f3f4f6;
}

/* ===== 圖表容器樣式 ===== */
.kchart-container {
  flex: 1;
  min-height: 480px;
  width: 100%;
  background-color: #0f0c28;
  border-radius: 15px;
  overflow: hidden;
}

/* ===== 佔位符樣式 ===== */
.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: #fafafa;
  background: #0f0c28;
  border: 2px dashed #ccc;
  border-radius: 12px;
  font-size: 16px;
  min-height: 200px;
}

/* ===== 響應式設計 ===== */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .toolbar-item {
    width: 100%;
    justify-content: space-between;
  }
  
  .select-input {
    min-width: 150px;
  }
  
  .kchart-container {
    min-height: 400px;
  }
}

@media (max-width: 480px) {
  .kchart-wrapper {
    padding: 8px;
  }
  
  .toolbar {
    gap: 8px;
  }
  
  .select-input {
    font-size: 13px;
    padding: 6px 10px;
    padding-right: 28px;
  }
  
  .kchart-container {
    min-height: 350px;
    border-radius: 12px;
  }
}
</style>