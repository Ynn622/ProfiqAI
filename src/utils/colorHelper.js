// 顏色規則：
// bg-dark-red     → 超好
// bg-red          → 好
// bg-green        → 差
// bg-dark-green   → 很差
// bg-gray         → 無資料 / 中性
// bg-yellow       → 中性或不分類（如股利）

export function getColorByValue(field, val) {
    if (val === null || val === undefined || isNaN(val)) return 'bg-gray';

    const name = field.trim().toLowerCase();

    // === 本益比 (PE) ===
    if (name.includes('pe')) {
        if (val > 30 || val < 10) return 'bg-dark-green'; // 很差
        if (val >= 20) return 'bg-green';                 // 差
        if (val >= 15) return 'bg-red';                   // 好
        if (val >= 10) return 'bg-dark-red';              // 超好
        return 'bg-gray';
    }

    // === 月增率 (MoM) ===
    if (name.includes('mom')) {
        if (val < 0) return 'bg-dark-green';              // 很差
        if (val < 5) return 'bg-green';                   // 差
        if (val < 15) return 'bg-red';                    // 好
        return 'bg-dark-red';                             // 超好
    }

    // === 年增率 (YoY) ===
    if (name.includes('yoy')) {
        if (val < 0) return 'bg-dark-green';
        if (val < 10) return 'bg-green';
        if (val < 25) return 'bg-red';
        return 'bg-dark-red';
    }

    // === EPS ===
    if (name.includes('eps')) {
        if (val < 1) return 'bg-dark-green';
        if (val < 3) return 'bg-green';
        if (val < 6) return 'bg-red';
        return 'bg-dark-red';
    }

    // === ROE ===
    if (name.includes('roe')) {
        if (val < 5) return 'bg-dark-green';
        if (val < 10) return 'bg-green';
        if (val < 20) return 'bg-red';
        return 'bg-dark-red';
    }

    // === ROA ===
    if (name.includes('roa')) {
        if (val < 2) return 'bg-dark-green';
        if (val < 5) return 'bg-green';
        if (val < 10) return 'bg-red';
        return 'bg-dark-red';
    }

    // === 股利（現金股利、股票股利） ===
    if (name.includes('dividend')) {
        return 'bg-yellow'; // 不分優劣，用中性色
    }

    // === 融資券 ===
    if (name.includes('margin') || name.includes('short')) {
        if (val > 0) return 'bg-red';       // 融資增加 or 融券減少 → 偏多
        if (val < 0) return 'bg-green';     // 融資減少 or 融券增加 → 偏空
        return 'bg-gray';
    }

    // === 券資比 ===
    if (name.includes('ratio')) {
        if (val >= 50) return 'bg-dark-green'; // 很差（空方壓力大）
        if (val < 5) return 'bg-green';        // 差（過熱）
        if (val < 20) return 'bg-dark-red';    // 超好（偏多）
        if (val < 50) return 'bg-red';         // 好（健康）
        return 'bg-gray';
    }

    // 預設情況
    return 'bg-gray';
}
