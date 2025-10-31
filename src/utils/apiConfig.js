// API 配置文件

// 切換 API 環境   [ true 為正式環境，false 為地端測試環境 ]
const PROD = true;

// 獲取 API 基礎 URL
export const getApiBaseUrl = () => {
    if (PROD) {
        return `https://ynn22-profiqai-backend.hf.space`;
    }
    return `http://localhost:7860`;
};

export const API_BASE_URL = getApiBaseUrl();


/**
 * 通用 API 呼叫函數
 * 
 * @param {Object} options - API 呼叫選項
 * @param {string} options.url - API 端點路徑 (必填)
 * @param {string} [options.method='GET'] - HTTP 方法 (GET, POST, PUT, DELETE 等)
 * @param {Object} [options.params=null] - URL 查詢參數物件
 * @param {Object} [options.body=null] - 請求主體 (會自動轉換為 JSON)
 * @param {Object} [options.headers={'Content-Type': 'application/json'}] - 自訂 HTTP 標頭
 * @param {string|Function} [options.funcName='callAPI'] - 用於 logger 的函數名稱
 * 
 * @returns {Promise<any>} - 返回 API 響應的資料
 * 
 * @example
 * // GET 請求 - 使用 params
 * const data = await callAPI({
 *   url: '/View/Predict/futureUpProb',
 *   params: { stockID: '2330' },
 *   funcName: 'fetchStockPredict'
 * });
 * 
 * @example
 * // POST 請求
 * const data = await callAPI({
 *   url: '/chat/chatBot',
 *   method: 'POST',
 *   body: { question: prompt, model: model },
 *   funcName: 'callChatBotAPI'
 * });
 */
export async function callAPI(options) {
    const {
        url,
        method = 'GET',
        params = null,
        body = null,
        headers = { 'Content-Type': 'application/json'},
        funcName = 'callAPI'
    } = options;

    try {
        // 記錄 API 開始
        logger.func.start(funcName, [params]);

        // 構建完整 URL (有含 http 的話 -> 不加 base url)
        let fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    searchParams.append(key, value);
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
            }
        }

        // 準備請求選項
        const fetchOptions = {
            method,
            headers: {
                ...headers
            }
        };

        // 如果有 body，加入請求
        if (body) {
            fetchOptions.body = JSON.stringify(body);
        }

        // 發送請求
        const response = await fetch(fullUrl, fetchOptions);

        // 檢查響應狀態
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        // 解析 JSON
        const data = await response.json();

        // 記錄成功
        logger.func.success(funcName, [params]);

        return data;

    } catch (error) {
        // 記錄錯誤
        logger.func.error(funcName, [params]);
        logger.error(`${funcName} API 錯誤:`, error);

        // 拋出錯誤，讓調用方可以選擇如何處理
        throw error;
    }
}
