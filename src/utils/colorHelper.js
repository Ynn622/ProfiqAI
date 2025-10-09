export function getColorByValue(val) {
    if (val === null || val === undefined) return 'bg-gray' // 沒資料
    if (val === 0) return 'bg-yellow'
    return val > 0 ? 'bg-red' : 'bg-green'
}