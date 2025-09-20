import { marked } from 'marked';

// 配置 marked
const renderer = new marked.Renderer();
renderer.table = function ({ header, align, rows }) {
    const parseCells = (cells, tag) =>
        `<tr>${cells.map((c, i) =>
            `<${tag}${align[i] ? ` style="text-align:${align[i]}"` : ""}>${this.parser.parseInline(c?.tokens || [])
            }</${tag}>`).join("")}</tr>`;

    const thead = parseCells(header, "th");
    const tbody = rows.map(r => parseCells(r, "td")).join("");

    return `<div class="table-container"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
};


// 配置 marked 選項
marked.setOptions({
    renderer: renderer,
    gfm: true, // 啟用 GitHub Flavored Markdown
    breaks: true, // 將換行符轉換為 <br>
    pedantic: false,
    sanitize: false, // 我們會手動處理 XSS 防護
    smartLists: true,
    smartypants: false
});

/**
 * 將 Markdown 文本轉換為 HTML
 * @param {string} markdown - Markdown 格式的文本
 * @returns {string} - 轉換後的 HTML 字符串
 */
export function parseMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
        return '';
    }
    
    try {
        // 使用 marked 解析 Markdown
        return marked.parse(markdown);
    } catch (error) {
        console.error('Markdown 解析錯誤:', error);
        // 如果解析失敗，返回原始文本（轉義 HTML）
        return markdown
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
    }
}

/**
 * 簡單的 XSS 防護 - 移除危險的標籤和屬性
 * @param {string} html - HTML 字符串
 * @returns {string} - 清理後的 HTML 字符串
 */
export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }
    
    // 移除 script 標籤
    html = html.replace(/<script[^>]*>.*?<\/script>/gis, '');
    
    // 移除 on* 事件處理器
    html = html.replace(/\s*on\w+\s*=\s*["|'][^"|']*["|']/gi, '');
    
    // 移除 javascript: 協議
    html = html.replace(/javascript:/gi, '');
    
    // 移除 style 標籤
    html = html.replace(/<style[^>]*>.*?<\/style>/gis, '');

    // 移除 iframe 標籤
    html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gis, '');

    // 移除不必要的 pre 標籤以防止樣式問題
    html = html.replace(/<\/?pre[^>]*>/gi, '');
    
    return html;
}

/**
 * 完整的 Markdown 處理函數 - 解析並清理
 * @param {string} markdown - Markdown 格式的文本
 * @returns {string} - 安全的 HTML 字符串
 */
export function processMarkdown(markdown) {
    const html = parseMarkdown(markdown);
    return sanitizeHtml(html);
}

export default {
    parseMarkdown,
    sanitizeHtml,
    processMarkdown
};