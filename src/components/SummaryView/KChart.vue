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
    <v-chart v-if="hasValidData" 
      :option="chartOption" 
      :autoresize="true"
      class="kchart-container" />
    <div v-else-if="props.loading" class="placeholder loading">
      <div class="loading-spinner"></div>
      載入中...
    </div>
    <div v-else-if="isEmptyData" class="placeholder empty">
      等待資料載入...
    </div>
    <div v-else-if="showError" class="placeholder error">
      K 線資料異常！<br />請確認網路狀態，或稍後再試。
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { CandlestickChart, LineChart, BarChart } from 'echarts/charts'
import {
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  AxisPointerComponent
} from 'echarts/components'
import { isMobileView } from '@/utils/userInterface.js';

// 註冊 ECharts 組件
use([
  CanvasRenderer,
  CandlestickChart,
  LineChart,
  BarChart,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  AxisPointerComponent
])

const { width, isMobile } = isMobileView();

// Props
const props = defineProps({
  kData: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// 響應式資料
const overlayIndicator = ref('MA')
const bottomMode = ref('volume')

// 常數定義
const BOTTOM_LABEL_MAP = {
  volume: '成交量',
  foreign: '外資',
  trust: '投信', 
  dealer: '自營商',
  three: '三大法人',
  major: '主力買賣超'
}

// 檢查是否為空資料（初始狀態）
const isEmptyData = computed(() => {
  return !props.kData || 
         !props.kData.Date || 
         !props.kData.OHLC || 
         !props.kData.Volume ||
         !Array.isArray(props.kData.Date) ||
         !Array.isArray(props.kData.OHLC) ||
         !Array.isArray(props.kData.Volume)
})

// 檢查資料是否有效
const hasValidData = computed(() => {
  if (isEmptyData.value) return false
  
  return props.kData.Date.length > 0 && 
         props.kData.OHLC.length > 0 && 
         props.kData.Volume.length > 0
})

// 判斷是否顯示錯誤訊息（非載入中且資料無效）
const showError = computed(() => {
  return !props.loading && !isEmptyData.value && !hasValidData.value
})

// 處理資料格式
const processedData = computed(() => {
  if (!hasValidData.value) return null
  
  const { 
    Date: dates, 
    OHLC: ohlc, 
    Volume: volumes,
    Foreign: foreign = [],
    Dealer: dealer = [],
    Investor: investor = [],
    MainForce: mainForce = []
  } = props.kData
  
  const result = {
    dates: [],
    candleData: [],
    volumeData: [],
    foreignData: [],
    trustData: [],
    dealerData: [],
    majorData: [],
    threeData: [],
    closePrices: []
  }
  
  const dataLength = Math.min(dates.length, ohlc.length, volumes.length)
  
  for (let i = 0; i < dataLength; i++) {
    if (Array.isArray(ohlc[i]) && ohlc[i].length >= 4) {
      const [open, high, low, close] = ohlc[i]
      const volume = volumes[i]
      
      result.dates.push(dates[i])
      result.candleData.push([open, close, low, high]) // ECharts 格式
      result.closePrices.push(close)
      
      // 成交量資料
      result.volumeData.push({
        value: volume,
        itemStyle: { 
          color: close > open ? '#d60000' : '#00aa55' 
        }
      })
      
      // 籌碼面資料
      const foreignVal = foreign[i] || 0
      const dealerVal = dealer[i] || 0
      const investorVal = investor[i] || 0
      const majorVal = mainForce[i] || 0
      
      result.foreignData.push({
        value: foreignVal,
        itemStyle: { color: foreignVal >= 0 ? '#d60000' : '#00aa55' }
      })
      
      result.trustData.push({
        value: investorVal,
        itemStyle: { color: investorVal >= 0 ? '#d60000' : '#00aa55' }
      })
      
      result.dealerData.push({
        value: dealerVal,
        itemStyle: { color: dealerVal >= 0 ? '#d60000' : '#00aa55' }
      })
      
      result.majorData.push({
        value: majorVal,
        itemStyle: { color: majorVal >= 0 ? '#d60000' : '#00aa55' }
      })
      
      // 三大法人總和
      const threeSum = foreignVal + dealerVal + investorVal
      result.threeData.push({
        value: threeSum,
        itemStyle: { color: threeSum >= 0 ? '#d60000' : '#00aa55' }
      })
    }
  }
  
  return result
})

// 簡單移動平均線計算
const calculateMA = (data, period) => {
  return data.map((_, index) => {
    if (index < period - 1) return null
    
    const sum = data.slice(index - period + 1, index + 1).reduce((a, b) => a + b, 0)
    return Number((sum / period).toFixed(2))
  })
}

// 指數移動平均線計算
const calculateEMA = (data, period) => {
  const multiplier = 2 / (period + 1)
  return data.map((price, index) => {
    if (index === 0) return price
    if (index < period - 1) return null
    
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period
    for (let i = period; i <= index; i++) {
      ema = (data[i] - ema) * multiplier + ema
    }
    return Number(ema.toFixed(2))
  })
}

// 布林通道計算
const calculateBOLL = (data, period = 20, multiplier = 2) => {
  const ma = calculateMA(data, period)
  
  return data.map((_, index) => {
    if (index < period - 1) return { mid: null, upper: null, lower: null }
    
    const slice = data.slice(index - period + 1, index + 1)
    const mean = slice.reduce((a, b) => a + b, 0) / period
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period
    const stdDev = Math.sqrt(variance)
    
    return {
      mid: Number(mean.toFixed(2)),
      upper: Number((mean + stdDev * multiplier).toFixed(2)),
      lower: Number((mean - stdDev * multiplier).toFixed(2))
    }
  })
}

// 技術指標計算
const indicators = computed(() => {
  if (!processedData.value) return {}
  
  const { closePrices } = processedData.value
  
  return {
    MA5: calculateMA(closePrices, 5),
    MA10: calculateMA(closePrices, 10),
    MA20: calculateMA(closePrices, 20),
    MA60: calculateMA(closePrices, 60),
    MA120: calculateMA(closePrices, 120),
    MA240: calculateMA(closePrices, 240),
    EMA5: calculateEMA(closePrices, 5),
    EMA10: calculateEMA(closePrices, 10),
    EMA20: calculateEMA(closePrices, 20),
    EMA60: calculateEMA(closePrices, 60),
    EMA120: calculateEMA(closePrices, 120),
    EMA240: calculateEMA(closePrices, 240),
    BOLL: calculateBOLL(closePrices, 20, 2)
  }
})

// 取得底部圖表資料
const bottomChartData = computed(() => {
  if (!processedData.value) return []
  
  const dataMap = {
    volume: processedData.value.volumeData,
    foreign: processedData.value.foreignData,
    trust: processedData.value.trustData,
    dealer: processedData.value.dealerData,
    three: processedData.value.threeData,
    major: processedData.value.majorData
  }
  
  return dataMap[bottomMode.value] || processedData.value.volumeData
})

// 圖表配置
const chartOption = computed(() => {
  if (!processedData.value) return {}
  
  const { dates, candleData, volumeData } = processedData.value
  const indicatorData = indicators.value
  
  // 建構系列資料
  const series = [
    {
      name: 'K線',
      type: 'candlestick',
      data: candleData,
      itemStyle: {
        color: '#d60000',
        color0: '#00aa55',
        borderColor: '#d60000',
        borderColor0: '#00aa55'
      }
    }
  ]
  
  // 圖例資料
  const legendData = ['K線']
  
  // 添加技術指標
  const legendSelected = {}
  if (overlayIndicator.value === 'MA') {
    const maColors = ['#f2c500', '#ff7f50', '#6bc1ff', '#91cc75', '#9a60b4', '#ea7ccc']
    const maPeriods = [5, 10, 20, 60, 120, 240]
    
    maPeriods.forEach((period, index) => {
      series.push({
        name: `MA${period}`,
        type: 'line',
        data: indicatorData[`MA${period}`],
        smooth: true,
        showSymbol: false,
        lineStyle: { 
          width: 1, 
          color: maColors[index] 
        }
      })
      legendData.push(`MA${period}`)
      // 預設只顯示 5/10/20，其餘關閉，可透過圖例點擊開啟
      legendSelected[`MA${period}`] = (period === 5 || period === 10 || period === 20)
    })
  } else if (overlayIndicator.value === 'EMA') {
    const emaColors = ['#f2c500', '#ff7f50', '#6bc1ff', '#91cc75', '#9a60b4', '#ea7ccc']
    const emaPeriods = [5, 10, 20, 60, 120, 240]

    emaPeriods.forEach((period, index) => {
      series.push({
        name: `EMA${period}`,
        type: 'line',
        data: indicatorData[`EMA${period}`],
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1,
          color: emaColors[index]
        }
      })
      legendData.push(`EMA${period}`)
      legendSelected[`EMA${period}`] = (period === 5 || period === 10 || period === 20)
    })
  } else if (overlayIndicator.value === 'BOLL') {
    const bollData = indicatorData.BOLL
    
    series.push(
      {
        name: 'BOLL中線',
        type: 'line',
        data: bollData.map(item => item.mid),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#f2c500' }
      },
      {
        name: 'BOLL上線',
        type: 'line',
        data: bollData.map(item => item.upper),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#ff7f50', type: 'dashed' }
      },
      {
        name: 'BOLL下線',
        type: 'line',
        data: bollData.map(item => item.lower),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1, color: '#6bc1ff', type: 'dashed' }
      }
    )
    legendData.push('BOLL中線', 'BOLL上線', 'BOLL下線')
  }
  
  // 添加底部圖表
  series.push({
    name: BOTTOM_LABEL_MAP[bottomMode.value],
    type: 'bar',
    xAxisIndex: 1,
    yAxisIndex: 1,
    data: bottomChartData.value
  })
  legendData.push(BOTTOM_LABEL_MAP[bottomMode.value])
  
  return {
    animation: true,
    backgroundColor: '#0f0c28',
    
    // 全域座標指示器（同步上下兩個網格的 x 軸游標）
    axisPointer: {
      link: [
        { xAxisIndex: [0, 1] }
      ],
      snap: true,
      label: { show: true },
      lineStyle: { color: '#aaa' },
      crossStyle: { color: '#aaa' }
    },
    
    // 圖例配置
    legend: {
      type: 'scroll',   // 可滾動
      top: isMobile ? 5 : 10,
      left: isMobile ? 15 : 30,
      data: legendData,
      textStyle: { color: '#fafafa' },
      itemGap: 12,
      selected: legendSelected
    },
    
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      backgroundColor: 'rgba(50, 50, 50, 0.9)',
      borderColor: '#999',
      textStyle: { color: '#fafafa' },
      // 自訂游標資訊視窗內容
      formatter: (params) => {
        // params 為同一 x 軸對應的各 series 資訊
        if (!params || !params.length) return ''
        const idx = (params.find(p => p.seriesName === 'K線') || params[0]).dataIndex
        const dateStr = dates[idx] ?? ''
        const c = candleData[idx] || [] // [open, close, low, high]
        const [open, close, low, high] = [c?.[0], c?.[1], c?.[2], c?.[3]]

        const volObj = volumeData[idx]
        const volume = typeof volObj === 'object' ? volObj.value : volObj

        const fmtNum = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toLocaleString('zh-TW'))
        const fmtPrice = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : Number(v).toFixed(2))

        // 收集指標（目前覆蓋在 K 線上的線: MA/EMA/BOLL）並格式化為多行：5MA: xxx、10MA: xxx
        const indicatorItems = []
        params.forEach(p => {
          if (p.seriesType !== 'line') return
          const val = p.data
          const show = (val === null || val === undefined) ? '—' : Number(val).toFixed(2)

          // MAx -> xMA: value
          if (/^MA\d+/.test(p.seriesName)) {
            const period = Number(p.seriesName.replace('MA', ''))
            indicatorItems.push({ label: `${period}MA: ${show}`, order: period })
            return
          }

          // EMAx -> xEMA: value
          if (/^EMA\d+/.test(p.seriesName)) {
            const period = Number(p.seriesName.replace('EMA', ''))
            indicatorItems.push({ label: `${period}EMA: ${show}`, order: period })
            return
          }

          // BOLL上線/中線/下線 -> BOLL上/中/下: value
          if (p.seriesName.startsWith('BOLL')) {
            let pos = '中', ord = 2
            if (p.seriesName.includes('上')) { pos = '上'; ord = 1 }
            else if (p.seriesName.includes('下')) { pos = '下'; ord = 3 }
            indicatorItems.push({ label: `BOLL${pos}: ${show}`, order: ord })
          }
        })
        indicatorItems.sort((a, b) => a.order - b.order)
        const indicatorLine = indicatorItems.length ? indicatorItems.map(i => i.label).join('<br/>') : '—'

        // 組合 HTML 內容
        return [
          `<div style="font-weight:600;margin-bottom:4px;">${dateStr}</div>`,
          `<div>開盤：<span style="font-weight:600;color:#ffd166;">${fmtPrice(open)}</span></div>`,
          `<div>收盤：<span style="font-weight:600;color:#ffffff;">${fmtPrice(close)}</span></div>`,
          `<div>最高：<span style="font-weight:600;color:#ff7f50;">${fmtPrice(high)}</span></div>`,
          `<div>最低：<span style="font-weight:600;color:#6bc1ff;">${fmtPrice(low)}</span></div>`,
          `<div><span style="font-weight:600;">${indicatorLine}</span></div><hr/>`,
          (() => {
            const bottomObj = (bottomChartData.value && bottomChartData.value[idx]) || null
            const bottomRaw = bottomObj && typeof bottomObj === 'object' ? bottomObj.value : bottomObj
            const label = BOTTOM_LABEL_MAP[bottomMode.value] || '下方'
            const color = bottomMode.value === 'volume' ? '#ffd166' : (Number(bottomRaw) >= 0 ? '#d60000' : '#00aa55')
            return `<div>${label}：<span style="font-weight:600;color:${color};">${fmtNum(bottomRaw)}</span></div>`
          })()
        ].join('')
      }
    },
    
    grid: [
      {
        left: isMobile ? '50px' : '60px',
        right: isMobile ? '20px' : '30px',
        top: '8%',
        height: '64%'
      },
      {
        left: isMobile ? '50px' : '60px',
        right: isMobile ? '20px' : '30px',
        top: '80%',
        height: '12%'
      }
    ],
    
    xAxis: [
      {
        type: 'category',
        data: dates,
        gridIndex: 0,
        axisPointer: { show: true },
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { show: false },
        axisLabel: { color: '#666' }
      },
      {
        type: 'category',
        gridIndex: 1,
        data: dates,
        axisPointer: { show: true },
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { show: false },
        axisLabel: { show: false }
      }
    ],
    
    yAxis: [
      {
        scale: true,
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { show: true, lineStyle: { color: '#2a2a2a' } },
        axisLabel: { color: '#666' }
      },
      {
        scale: true,
        gridIndex: 1,
        axisLine: { lineStyle: { color: '#999' } },
        splitLine: { show: false },
        axisLabel: { color: '#666' }
      }
    ],
    
    dataZoom: [
      {
        type: 'inside',
        height: '4%',
        xAxisIndex: [0, 1],
        start: 60,
        end: 100
      },
      {
        type: 'slider',
        height: '4%',
        xAxisIndex: [0, 1],
        top: '94%',
        start: 60,
        end: 100
      }
    ],
    
    series: series
  }
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
    border-radius: 12px;
  }
}
</style>