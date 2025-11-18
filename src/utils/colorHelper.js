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
    // PE_THRESHOLDS = [(30, -1), (20, 2), (10, 1), (-999, -1)]
    if (name.includes('pe')) {
        if (val > 30) return 'bg-green';                  // 差 (-1)
        if (val >= 20) return 'bg-dark-red';              // 超好 (2)
        if (val >= 10) return 'bg-red';                   // 好 (1)
        return 'bg-green';                                // 差 (-1)
    }

    // === 月增率 (MoM) ===
    // MOM_THRESHOLDS = [(15, 2), (3, 1), (-15, -1), (-999, -2)]
    if (name.includes('mom')) {
        if (val >= 15) return 'bg-dark-red';              // 超好 (2)
        if (val >= 3) return 'bg-red';                    // 好 (1)
        if (val >= -15) return 'bg-green';                // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === 年增率 (YoY) ===
    // YOY_THRESHOLDS = [(25, 2), (10, 1), (-5, -1), (-999, -2)]
    if (name.includes('yoy')) {
        if (val >= 25) return 'bg-dark-red';              // 超好 (2)
        if (val >= 10) return 'bg-red';                   // 好 (1)
        if (val >= -5) return 'bg-green';                 // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === EPS ===
    // EPS_THRESHOLDS = [(5, 2), (2, 1), (-1, -1), (-999, -2)]
    if (name.includes('eps')) {
        if (val >= 5) return 'bg-dark-red';               // 超好 (2)
        if (val >= 2) return 'bg-red';                    // 好 (1)
        if (val >= -1) return 'bg-green';                 // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === ROE ===
    // ROE_THRESHOLDS = [(13, 2), (8, 1), (0, -1), (-999, -2)]
    if (name.includes('roe')) {
        if (val >= 13) return 'bg-dark-red';              // 超好 (2)
        if (val >= 8) return 'bg-red';                    // 好 (1)
        if (val >= 0) return 'bg-green';                  // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === ROA ===
    // ROA_THRESHOLDS = [(6, 2), (2, 1), (0, -1), (-999, -2)]
    if (name.includes('roa')) {
        if (val >= 6) return 'bg-dark-red';               // 超好 (2)
        if (val >= 2) return 'bg-red';                    // 好 (1)
        if (val >= 0) return 'bg-green';                  // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === GPM (毛利率) ===
    // GPM_THRESHOLDS = [(40, 2), (20, 1), (0, -1), (-999, -2)]
    if (name.includes('gpm') || name.includes('gross profit margin')) {
        if (val >= 40) return 'bg-dark-red';              // 超好 (2)
        if (val >= 20) return 'bg-red';                   // 好 (1)
        if (val >= 0) return 'bg-green';                  // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === OPM (營業利益率) ===
    // OPM_THRESHOLDS = [(20, 2), (10, 1), (0, -1), (-999, -2)]
    if (name.includes('opm') || name.includes('operating profit margin')) {
        if (val >= 20) return 'bg-dark-red';              // 超好 (2)
        if (val >= 10) return 'bg-red';                   // 好 (1)
        if (val >= 0) return 'bg-green';                  // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
    }

    // === PTPM (稅前淨利率) ===
    // PTPM_THRESHOLDS = [(20, 2), (10, 1), (0, -1), (-999, -2)]
    if (name.includes('ptpm') || name.includes('pretax profit margin')) {
        if (val >= 20) return 'bg-dark-red';              // 超好 (2)
        if (val >= 10) return 'bg-red';                   // 好 (1)
        if (val >= 0) return 'bg-green';                  // 差 (-1)
        return 'bg-dark-green';                           // 很差 (-2)
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
