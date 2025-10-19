

/**
 * 獲取當前整點時間字串 (格式: 2025-10-10 10:00)
 * @returns {string} 目前整點時間字串（格式：YYYY-MM-DD HH:00）
 * 
 * 範例：
 *   getCurrentHourString(); => "2025-10-17 14:00"
 */
function getCurrentHourString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');

    return `${year}-${month}-${day} ${hour}:00`;
}

/**
 * 儲存最後更新「資料、時間」到 localStorage
 * 
 * @param {string} storageKey - 存儲 Key
 * @param {Object} data - 資料
 */
function saveToLocalStorage(storageKey, data) {
    try {
        // 存儲資料到 localStorage
        localStorage.setItem(storageKey, JSON.stringify(data));

        // 存儲更新時間到 localStorage
        localStorage.setItem(`lastUpdate_${storageKey}`, getCurrentHourString());
        
        logger.debug(`已儲存更新時間: ${getCurrentHourString()}`);
    } catch (err) {
        logger.error('儲存更新時間錯誤:', err);
    }
}

/**
 * 檢查是否需要重新打 API
 * 
 * @param {string} storageKey - 存儲 Key
 * @param {string} stockId - 股票代號
 */
function shouldCallAPI(storageKey) {
    try {
        const storedTime = localStorage.getItem(`lastUpdate_${storageKey}`);
        const currentHour = getCurrentHourString();

        if (storedTime === currentHour) {
            logger.debug(`當前小時 ${currentHour} 已有資料，跳過 API 調用`);
            return false;
        }

        logger.debug(`需要更新資料，上次更新: ${storedTime || '無'}, 當前: ${currentHour}`);
        return true;
    } catch (err) {
        logger.error('檢查更新時間錯誤:', err);
        return true; // 出錯時重新打 API
    }
}
export { getCurrentHourString, saveToLocalStorage, shouldCallAPI };