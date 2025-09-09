// API 配置文件

// 切換 API 環境
const PROD = true;

// 獲取 API 基礎 URL
export const getApiBaseUrl = () => {
    if (PROD) {
        return `https://ynn22-profiqaiapi.hf.space`;
    }
    return `http://localhost:7680`;
};

export const API_BASE_URL = getApiBaseUrl();