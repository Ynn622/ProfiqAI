<template>
    <div class="kchart-wrapper">
        <div class="toolbar">
            <label>
                K線覆蓋：
                <select v-model="overlayIndicator">
                    <option value="none">無</option>
                    <option value="MA">MA</option>
                    <option value="EMA">EMA</option>
                    <option value="BOLL">布林通道</option>
                </select>
            </label>
            <label>
                下方顯示：
                <select v-model="bottomMode">
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
        <div v-if="hasValidData" ref="chartRef" class="kchart-container"></div>
        <div v-else class="placeholder">尚未提供有效 K 線資料</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { SMA, EMA, BollingerBands } from 'trading-signals'
import * as echarts from 'echarts'

// 新版資料結構（由後端提供）：
// {
//   Date: string[],                   // 交易日期
//   OHLC: number[][],                // [Open, High, Low, Close]
//   Volume: number[],
//   Foreign: number[],               // 外資
//   Dealer: number[],                // 投信
//   Investor: number[],              // 自營商
//   MainForce: number[]              // 主力買賣超
// }
// 注意：ECharts K 線需要 [open, close, low, high]，因此會將 OHLC 重新排序為 [O, C, L, H]
// 上漲(red) / 下跌(green) 以 close > open 判定

const props = defineProps({
    // 需為每日資料物件
    kData: { type: Object, required: true }
})

const innerData = ref(null)
const bottomMode = ref('volume')
const overlayIndicator = ref('none') // none | MA | EMA | BOLL
const chartRef = ref(null)
let chartInstance = null

function numberOrNull(x){
    const n = Number(x)
    return Number.isFinite(n) ? n : null
}

// 解析新版資料格式
function fromNewFormat(d){
    if(!d || typeof d !== 'object') return null
    const dates = Array.isArray(d.Date) ? d.Date : []
    const ohlc = Array.isArray(d.OHLC) ? d.OHLC : [] // [O,H,L,C]
    const vols = Array.isArray(d.Volume) ? d.Volume : []
    const foreignArr = Array.isArray(d.Foreign) ? d.Foreign : [] // 外資
    const trustArr = Array.isArray(d.Dealer) ? d.Dealer : []      // 投信（命名為 Dealer 於後端）
    const dealerArr = Array.isArray(d.Investor) ? d.Investor : [] // 自營商（命名為 Investor 於後端）
    const majorArr = Array.isArray(d.MainForce) ? d.MainForce : []

    const n = Math.min(dates.length, ohlc.length, vols.length)
    const category = []
    const values = []
    const volumes = []
    const chipsForeign = []
    const chipsTrust = []
    const chipsDealer = []
    const chipsMajor = []
    const chipsThree = []

    for(let i=0;i<n;i++){
        const dt = dates[i]
        const r = ohlc[i]
        if(!Array.isArray(r) || r.length < 4) continue
        const o = Number(r[0])
        const h = Number(r[1])
        const l = Number(r[2])
        const c = Number(r[3])
        const v = Number(vols[i])
        if([o,h,l,c,v].some(x => Number.isNaN(x))) continue

        category.push(dt)
        values.push([o,c,l,h]) // 轉為 ECharts 需要的 [open, close, low, high]
        volumes.push(v)

        const f = numberOrNull(foreignArr[i])
        const t = numberOrNull(trustArr[i])    // 投信
        const de = numberOrNull(dealerArr[i])  // 自營商
        const m = numberOrNull(majorArr[i])

        chipsForeign.push(f)
        chipsTrust.push(t)
        chipsDealer.push(de)
        chipsMajor.push(m)

        const sum = [f,t,de].every(x => typeof x === 'number')
            ? f + t + de
            : (typeof f === 'number' || typeof t === 'number' || typeof de === 'number')
                ? (f||0) + (t||0) + (de||0)
                : null
        chipsThree.push(sum)
    }

    return { category, values, volumes, chipsForeign, chipsTrust, chipsDealer, chipsMajor, chipsThree }
}

function validateData(d){
    if(!d || typeof d !== 'object') return false
    const ok = Array.isArray(d.category) && Array.isArray(d.values) && Array.isArray(d.volumes)
    if(!ok) return false
    if(!(d.category.length === d.values.length && d.values.length === d.volumes.length)) return false
    return d.values.every(r => Array.isArray(r) && r.length >= 4 && r.every(n => typeof n === 'number'))
}

watch(() => props.kData, (val) => {
    const mapped = val && typeof val === 'object' ? fromNewFormat(val) : null
    innerData.value = validateData(mapped) ? mapped : null
}, { immediate: true })

const hasValidData = computed(() => validateData(innerData.value))

// 取得收盤價陣列
const closes = computed(() => hasValidData.value ? innerData.value.values.map(v => v[1]) : [])

const bottomLabelMap = {
    volume: '成交量',
    foreign: '外資',
    trust: '投信',
    dealer: '自營商',
    three: '三大法人',
    major: '主力買賣超'
}

const bottomData = computed(() => {
    if(!hasValidData.value) return []
    const d = innerData.value
    switch(bottomMode.value){
        case 'volume': return d.volumes
        case 'foreign': return d.chipsForeign
        case 'trust': return d.chipsTrust
        case 'dealer': return d.chipsDealer
        case 'three': return d.chipsThree
        case 'major': default: return d.chipsMajor
    }
})

// 優化後的技術指標計算 - 直接使用收盤價數組，避免重複實例化
function calcIndicator(type, period, multiplier = 2) {
    const arr = closes.value
    if (!arr.length) return type === 'BOLL' ? { mid: [], upper: [], lower: [] } : []
    
    switch (type) {
        case 'MA': {
            const sma = new SMA(period)
            return arr.map(price => {
                const result = sma.update(price)
                return result ? +result.toFixed(2) : null
            })
        }
        case 'EMA': {
            const ema = new EMA(period)
            return arr.map(price => {
                const result = ema.update(price)
                return result ? +result.toFixed(2) : null
            })
        }
        case 'BOLL': {
            const bb = new BollingerBands(period, multiplier)
            const mid = [], upper = [], lower = []
            for (const price of arr) {
                const result = bb.update(price)
                if (result) {
                    mid.push(+result.middle.toFixed(2))
                    upper.push(+result.upper.toFixed(2))
                    lower.push(+result.lower.toFixed(2))
                } else {
                    mid.push(null)
                    upper.push(null)
                    lower.push(null)
                }
            }
            return { mid, upper, lower }
        }
        default:
            return []
    }
}

// 緩存計算結果，避免重複計算
const indicators = computed(() => {
    if (!hasValidData.value) return {}
    
    const result = {}
    
    // MA 系列 (5, 10, 20, 60, 120, 240)
    const maPeriods = [5, 10, 20, 60, 120, 240]
    result.MA = maPeriods.reduce((acc, period) => {
        acc[period] = calcIndicator('MA', period)
        return acc
    }, {})
    
    // EMA 系列
    result.EMA = maPeriods.reduce((acc, period) => {
        acc[period] = calcIndicator('EMA', period)
        return acc
    }, {})
    
    // 布林通道
    result.BOLL = calcIndicator('BOLL', 22, 2)
    
    return result
})

function buildOption() {
        if(!hasValidData.value){
            return { series: [] }
        }
    const { category, values, volumes } = innerData.value
    const volumeData = volumes.map((v, i) => [i, v, values[i][0], values[i][1]])

    const isVolume = bottomMode.value === 'volume'
    const bottomSeries = isVolume ? {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumeData.map(v => ({ value: v[1], itemStyle: { color: v[3] > v[2] ? '#d60000' : '#00aa55' } })),
        large: true
    } : {
        name: bottomLabelMap[bottomMode.value] || '籌碼',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: bottomData.value.map(v => v == null ? null : ({ value: v, itemStyle: { color: v >= 0 ? '#d60000' : '#00aa55' } })),
        large: true
    }

        const overlay = []
        const legendItems = ['K線']
        const maColors = ['#f2c500','#ff7f50','#6bc1ff','#91cc75','#5470c6','#ee6666']
        const indicatorData = indicators.value
        
        if(overlayIndicator.value === 'MA'){
            const periods = [5,10,20,60,120,240]
            periods.forEach((p, idx) => {
                overlay.push({
                    name: `MA${p}`,
                    type: 'line',
                    data: indicatorData.MA?.[p] || [],
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { width: 1, color: maColors[idx % maColors.length] },
                    emphasis: { disabled: true }
                })
                legendItems.push(`MA${p}`)
            })
        } else if(overlayIndicator.value === 'EMA'){
            const periods = [5,10,20,60,120,240]
            periods.forEach((p, idx) => {
                overlay.push({
                    name: `EMA${p}`,
                    type: 'line',
                    data: indicatorData.EMA?.[p] || [],
                    smooth: true,
                    showSymbol: false,
                    lineStyle: { width: 1, color: maColors[idx % maColors.length] },
                    emphasis: { disabled: true }
                })
                legendItems.push(`EMA${p}`)
            })
        } else if(overlayIndicator.value === 'BOLL'){
            const bollData = indicatorData.BOLL || { mid: [], upper: [], lower: [] }
            overlay.push(
                { name: 'BOLL_MID', type: 'line', data: bollData.mid, smooth: true, showSymbol:false, lineStyle:{width:1,color:'#f2c500'}, emphasis:{disabled:true} },
                { name: 'BOLL_UPPER', type: 'line', data: bollData.upper, smooth: true, showSymbol:false, lineStyle:{width:1,color:'#6bc1ff'}, emphasis:{disabled:true} },
                { name: 'BOLL_LOWER', type: 'line', data: bollData.lower, smooth: true, showSymbol:false, lineStyle:{width:1,color:'#ee6666'}, emphasis:{disabled:true} }
            )
            legendItems.push('BOLL_MID','BOLL_UPPER','BOLL_LOWER')
        }

    legendItems.push(bottomLabelMap[bottomMode.value] || '成交量')

        return {
        animation: false,
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            valueFormatter: v => (typeof v === 'number' ? v.toFixed(2) : v)
        },
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
            pageTextStyle: { color: '#ccc' }
        },
        grid: [
            { left: 50, right: 20, top: 70, height: '56%' },
            { left: 50, right: 20, top: '72%', height: '20%' }
        ],
        axisPointer: { link: [{ xAxisIndex: [0, 1] }] },
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
        dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
            { type: 'slider', xAxisIndex: [0, 1], top: '95%', start: 60, end: 100 }
        ],
        series: [
                {
                    name: 'K線',
                    type: 'candlestick',
                    data: values,
                    itemStyle: {
                        color: '#d60000',
                        color0: '#00aa55',
                        borderColor: '#d60000',
                        borderColor0: '#00aa55'
                    }
                },
                ...overlay,
                bottomSeries
        ]
    }
}

function initChart() {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(buildOption())
    window.addEventListener('resize', resizeChart)
}

function resizeChart() {
    chartInstance && chartInstance.resize()
}

function updateChart() {
    if (!chartInstance) return
    try {
        chartInstance.setOption(buildOption(), true)
    } catch (e) {
        // 若有資料異常，輸出到 console 方便除錯
        console.error('[KChart] setOption error', e, innerData.value)
    }
}

watch(() => bottomMode.value, () => updateChart())
watch(() => overlayIndicator.value, () => updateChart())
watch(() => innerData.value, () => updateChart(), { deep: true })

onMounted(() => { if(hasValidData.value) initChart() })

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    chartInstance && chartInstance.dispose()
})
</script>

<style scoped>
.kchart-wrapper {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 5px;
}

.toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 14px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.toolbar label {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: #333;
}

.toolbar input {
    margin-right: 2px;
}

.kchart-container {
    flex: 1;
    min-height: 480px;
    width: 100%;
    background-color: #0f0c28;
    border-radius: 15px;
}

.toolbar select {
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
}

.toolbar select:hover {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.toolbar select:focus {
    outline: none;
}

.toolbar select optgroup {
    font-weight: 600;
    color: #6b7280;
    background-color: #f9fafb;
    font-style: normal;
}

.toolbar select option {
    padding: 8px 12px;
    color: #374151;
    background-color: #ffffff;
}

.toolbar select option:hover {
    background-color: #f3f4f6;
}

.placeholder {
    padding: 40px;
    text-align: center;
    color: #888;
    background: #fafafa;
    border: 1px dashed #ccc;
    border-radius: 6px;
}
</style>