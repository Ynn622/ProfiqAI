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