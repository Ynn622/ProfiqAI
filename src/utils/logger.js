// console.log 自訂格式

let LOG_ENABLED = true;

// 格式化時間 (HH:mm:ss.SSS)
function formatTime(date = new Date()) {
    const ms = Math.floor(date.getMilliseconds() / 100); // 取 0~9
    return date.toLocaleTimeString("zh-TW", { hour12: false }) + "." + ms;
}

// 定義 log 類型
const LOG_TYPES = {
    start: { icon: "🔵", tag: "Start" },
    success: { icon: "🟢", tag: "Success" },
    error: { icon: "🔴", tag: "Error" },
    log: { icon: "⚪", tag: "Log" },
    warn: { icon: "🟡", tag: "Warn" },
    fatal: { icon: "🔴", tag: "Error" },
    debug: { icon: "🟣", tag: "Debug" },
};

// 核心函數
function _log(type, fn, params = []) {
    if (!LOG_ENABLED) return;
    const { icon, tag } = LOG_TYPES[type] || LOG_TYPES.log;

    const fnName = typeof fn === "function" ? fn.name : fn;
    const paramStr = params.map(p => JSON.stringify(p)).join(", ");

    console.log(`${formatTime()} ${icon} [${tag}] ${fnName}(${paramStr})`);
}

// 建立 logger
export const logger = {
    func: {},

    msg: (...args) => {
        if (!LOG_ENABLED) return;
        const { icon, tag } = LOG_TYPES.log;
        console.log(`${formatTime()} ${icon} [${tag}]`, ...args);
    },

    warn: (...args) => {
        if (!LOG_ENABLED) return;
        const { icon, tag } = LOG_TYPES.warn;
        console.warn(`${formatTime()} ${icon} [${tag}]`, ...args);
    },

    error: (...args) => {
        if (!LOG_ENABLED) return;
        const { icon, tag } = LOG_TYPES.fatal;
        console.error(`${formatTime()} ${icon} [${tag}]`, ...args);
    },

    debug: (...args) => {
        if (!LOG_ENABLED) return;
        const { icon, tag } = LOG_TYPES.debug;
        console.log(`${formatTime()} ${icon} [${tag}]`, ...args);
    },
};

// 動態產生 logger.func 的方法
Object.keys(LOG_TYPES).forEach(type => {
    logger.func[type] = (fn, params = []) => _log(type, fn, params);
});

// 掛到全域
window.logger = logger;