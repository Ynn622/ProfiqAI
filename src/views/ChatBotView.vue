<template>
    <div class="screen">
        <Nav :show-menu="false" />
        <div class="chat-layout">
            <!-- 聊天選單 -->
            <aside class="conversation-list" :class="{ open: sideOpen }">
                <div class="list-header">
                    <h3>投資智聊 AI</h3>
                    <button class="close-btn" @click="toggleSide" aria-label="close" v-if="isMobile">×</button>
                </div>
                <ul>
                    <li v-for="c in conversations" :key="c.id" :class="{ active: c.id === activeId }"
                        @click="selectConversation(c.id)">
                        <i class="fa-regular fa-comments"></i>
                        <div class="conversation-meta">
                            <span class="title">{{ c.title }}</span>
                            <span class="created-at">{{ c.createdAt }}</span>
                        </div>
                    </li>
                </ul>
                <div class="new-chat-block">
                    <button class="new-chat" @click="newConversation">+ 新會話</button>
                </div>
            </aside>
            <!-- 聊天室 -->
            <div class="chat-wrapper">
                <header class="chat-header">
                    <button class="hamburger" @click="toggleSide" v-if="isMobile">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="chat-title">
                        智聊機器人
                        <select v-model="modelSelected" class="model-selector">
                            <option v-for="model in modelOptions" :key="model" :value="model">
                                {{ model }}
                            </option>
                        </select>
                        <a-tooltip placement="bottom">
                            <template #title>
                                <div class="model-tooltip">
                                    <div><strong>GPT-4</strong> 快速概覽分析 (平均耗時:30s)</div>
                                    <div><strong>GPT-5</strong> 詳細價位分析 (平均耗時:1min)</div>
                                </div>
                            </template>
                            <i class="fa-solid fa-circle-info model-info-icon"></i>
                        </a-tooltip>
                    </div>
                </header>
                <div class="messages" ref="msgContainer">
                    <div v-for="(m, i) in activeMessages" :key="i" :class="['msg-row', m.role]">
                        <div class="avatar" v-if="m.role === 'bot'">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="avatar user" v-if="m.role === 'user'">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="bubble-wrapper">
                            <div class="bubble" v-html="processMarkdown(m.text)"></div>
                            <div class="duration" v-if="m.role === 'bot' && m.duration">
                                <i class="fa-regular fa-clock"></i> {{ m.duration }}
                            </div>
                        </div>
                    </div>
                    <div class="msg-row bot loading" v-if="activeLoading">
                        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                        <div class="bubble-wrapper">
                            <div class="bubble"><span class="dot" v-for="n in 3" :key="n"></span></div>
                            <div class="duration loading-time" v-if="activeConversation?.loadingElapsed">
                                <i class="fa-regular fa-clock"></i> {{ formatDuration(activeConversation.loadingElapsed) }}
                            </div>
                            <div class="loading-hint" v-if="activeConversation?.loadingElapsed > 30000">
                                (個股分析中，請稍候...)
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 免責聲明 -->
                <p class="disclaimer">投資有風險，敬請謹慎評估，並查核重要資訊。</p>
                <form class="input-bar" @submit.prevent="send">
                    <textarea ref="textareaRef" v-model="userInput"
                        :placeholder="activeLoading ? '等待機器人回應中...' : '請輸入文字...'" rows="1"
                        @keydown.enter.exact.prevent="handleEnterKey" @input="autoResize"
                        @compositionstart="handleCompositionStart" @compositionend="handleCompositionEnd"
                        :disabled="activeLoading"></textarea>
                    <button type="submit" :disabled="!userInput.trim() || activeLoading" class="send-btn"><i
                            class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import Nav from '@/components/Common/Nav.vue';
import { Tooltip as ATooltip } from 'ant-design-vue';

// 工具 & 套件
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { callAPI } from '@/utils/apiConfig.js';
import { processMarkdown } from '@/utils/markdownParser.js';


const isMobile = ref(false);
const sideOpen = ref(false);
const conversations = ref([{
    id: generateChatId(),
    title: '智聊 AI',
    createdAt: formatTime(new Date()),
    loading: false,
    loadingStartTime: null,
    loadingElapsed: 0,
    messages: [{ role: 'bot', text: '嗨～我是**智聊機器人**，您的 AI 投資夥伴。今天有想討論的股市問題嗎？' }]
}]);
const activeId = ref(conversations.value[0]?.id || '');
const userInput = ref('');
const msgContainer = ref(null);
const textareaRef = ref(null);
const isComposing = ref(false); // 追蹤中文輸入法狀態
const activeConversation = computed(() => conversations.value.find(c => c.id === activeId.value));
const activeMessages = computed(() => activeConversation.value?.messages || []);
const activeLoading = computed(() => activeConversation.value?.loading || false);

// 模型選擇
const modelOptions = ['GPT-4.1-mini', 'GPT-4o-mini', 'GPT-5-mini', 'GPT-5.4-mini']
const modelSelected = ref('GPT-4.1-mini')

function scrollBottom() {
    nextTick(() => { if (msgContainer.value) { msgContainer.value.scrollTop = msgContainer.value.scrollHeight; } });
}
watch(activeMessages, scrollBottom, { deep: true });

function handleCompositionStart() {
    isComposing.value = true;
}

function handleCompositionEnd() {
    isComposing.value = false;
}

function handleEnterKey() {
    // 如果正在使用中文輸入法選字，則不發送訊息
    if (!activeLoading.value && !isComposing.value) {
        send();
    }
}

function send() {
    const convo = activeConversation.value;
    if (!convo || convo.loading) return; // 防止在載入期間發送訊息
    const text = userInput.value.trim();
    if (!text) return;
    convo.messages.push({ role: 'user', text });
    userInput.value = '';
    
    // 重設輸入框高度
    resetTextareaHeight();
    
    // 記錄開始時間並啟動計時器
    const startTime = Date.now();
    convo.loadingStartTime = startTime;
    convo.loadingElapsed = 0;
    startLoadingTimer(convo);
    
    callChatBotAPI(text, modelSelected.value, convo, startTime);
    scrollBottom();
}

/** 
 * API: 聊天機器人回應
 */
async function callChatBotAPI(prompt, model, convo, startTime) {
    convo.loading = true;
    try {
        const response = await callAPI({
            url: '/chat/chatBot',
            method: 'POST',
            body: { question: prompt, model: model, uuid: convo.id },
            funcName: 'callChatBotAPI'
        });

        const botReply = response.response || '抱歉，我現在無法回答您的問題。';
        const duration = formatDuration(Date.now() - startTime);
        convo.messages.push({ role: 'bot', text: botReply, duration });
    } catch (error) {
        const duration = formatDuration(Date.now() - startTime);
        convo.messages.push({ 
            role: 'bot', 
            text: '抱歉，系統暫時無法連接，請稍後再試。',
            duration
        });
    } finally {
        convo.loading = false;
        convo.loadingStartTime = null;
        convo.loadingElapsed = 0;
        stopLoadingTimer(convo);
        scrollBottom();
    }
}
function selectConversation(id) { activeId.value = id; if (isMobile.value) { sideOpen.value = false; } }
function newConversation() {
    const id = generateChatId();
    conversations.value.unshift({
        id,
        title: '智聊 AI',
        createdAt: formatTime(new Date()),
        loading: false,
        loadingStartTime: null,
        loadingElapsed: 0,
        messages: [{
            role: 'bot', text: '嗨～我是**智聊機器人**，您的 AI 投資夥伴。今天有想討論的股市問題嗎？' }]
    });
    activeId.value = id;
}
function toggleSide() {
    sideOpen.value = !sideOpen.value;
}
function handleResize() {
    isMobile.value = window.innerWidth < 768;
    if (!isMobile.value) {
        sideOpen.value = true;
    }
}
function autoResize(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function resetTextareaHeight() {
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto';
            textareaRef.value.style.height = ''; // 重設為初始高度
        }
    });
}

// 產生唯一會話 ID
function generateChatId() {
    const now = new Date();

    // 取得 yyyy/mm/dd
    const dateStr = now.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).replace(/\//g, "");

    // 取得 HH:mm:ss
    const timeStr = now.toLocaleTimeString("zh-TW", {
        hour12: false
    }).replace(/:/g, "");

    const datePart = `${dateStr}T${timeStr}`; // yyyyMMddTHHmmss
    const uuid = crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    return `${datePart}_${uuid}`;
}

// 格式化時間為 yyyy-MM-dd HH:mm:ss
function formatTime(date = new Date()) {
    const dateStr = date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).replace(/\//g, "-");
    const timeStr = date.toLocaleTimeString("zh-TW", { hour12: false });

    return `${dateStr} ${timeStr}`;
}

// 格式化耗時顯示
function formatDuration(ms) {
    return `${(ms / 1000).toFixed(1)}s`;
}

// 計時器管理
let loadingTimers = {};

function startLoadingTimer(convo) {
    // 清除可能存在的舊計時器
    if (loadingTimers[convo.id]) {
        clearInterval(loadingTimers[convo.id]);
    }
    
    // 每 100ms 更新一次經過時間
    loadingTimers[convo.id] = setInterval(() => {
        if (convo.loadingStartTime && convo.loading) {
            convo.loadingElapsed = Date.now() - convo.loadingStartTime;
        }
    }, 100);
}

function stopLoadingTimer(convo) {
    if (loadingTimers[convo.id]) {
        clearInterval(loadingTimers[convo.id]);
        delete loadingTimers[convo.id];
    }
}

// 進入頁面時執行
onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    sideOpen.value = true;
});

</script>

<style scoped>
@import '/src/assets/main.css';

.screen {
    height: 100dvh;
}

.chat-layout {
    display: flex;
    flex: 1;
    max-height: calc(100dvh - 100px);
    margin: 10px;
}

.conversation-list {
    width: 260px;
    background: var(--card, #fff);
    border-radius: 12px;
    padding: 14px 0 8px;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow);
    transition: transform .3s ease, opacity .3s ease;
    z-index: 1;
}

.conversation-list .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px 6px;
}

.conversation-list h3 {
    font-size: 16px;
    letter-spacing: 0.8px;
}

.conversation-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
}

.conversation-list li {
    padding: 12px 18px;
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    line-height: 1.4;
    border-left: 4px solid transparent;
    transition: background .25s;
}

.conversation-list li.active {
    background: #eef4ff;
    border-left-color: #6d7dff;
    font-weight: 600;
}

.conversation-list li:hover {
    background: #f3f3f6;
}

.conversation-list .title {
    flex: 1;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.conversation-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}

.conversation-meta .created-at {
    font-size: 12px;
    color: #8a8a96;
}

.new-chat-block {
    margin-top: auto;
    padding: 8px 14px 0;
}

.new-chat {
    width: 100%;
    border: 1px dashed #a2a2aa;
    background: transparent;
    border-radius: 12px;
    padding: 10px 4px;
    cursor: pointer;
    font-size: 14px;
}

.new-chat:hover {
    background: #f5f5f7;
}

.close-btn {
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
}

.chat-wrapper {
    flex: 1;
    background: rgba(255, 255, 255, .55);
    backdrop-filter: blur(8px);
    border-radius: 10px;
    padding-left: 10px;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow);
    min-height: 0;
    margin-left: -14px;
}

.chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px 10px;
    border-bottom: 1px solid #cfcfcf;;
}

.chat-title {
    display: flex;
    gap: 5px;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: .5px;
    align-items: flex-end;  /* 垂直置底 */
}

.model-selector {
    background: transparent;
    border: none;
    padding: 0;
    font-weight: normal;
    color: gray;
    cursor: pointer;
    outline: none;
    padding: 3px 1px;
}

.model-selector:hover {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

.model-info-icon {
    font-size: 11px;
    color: #6d7dff;
    cursor: help;
    margin-left: 2px;
    margin-bottom: 4px;
    transition: color 0.3s;
}

.model-info-icon:hover {
    color: #5d6ddd;
}

.model-tooltip {
    font-size: 13px;
    line-height: 1.3;
}

.model-tooltip div {
    margin: 4px 0;
}

.hamburger {
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px 8px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
}

.msg-row {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    animation: fadeIn .35s ease;
}

.msg-row.user {
    flex-direction: row-reverse;
}

.avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7a8bff, #5d34d9);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .15);
}

.avatar.user {
    background: linear-gradient(135deg, #4f4f59, #2c2c31);
}

.loading .bubble {
    width: 80px;
}

.bubble-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: min(720px, 80%);
}

.bubble {
    background: #e8f2ff;
    padding: 12px 18px;
    border-radius: 18px;
    line-height: 1.55;
    font-size: 15px;
    position: relative;
    word-break: break-word;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .06);
}

.duration {
    font-size: 12px;
    color: #888;
    padding-left: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0.8;
}

.duration.loading-time {
    color: #6d7dff;
    font-weight: 500;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
}

.loading-hint {
    padding-left: 6px;
    color: #ff8c42;
    font-size: 10px;
}

/* Markdown 樣式 */
:deep(.bubble h1),
:deep(.bubble h2),
:deep(.bubble h3),
:deep(.bubble h4),
:deep(.bubble h5),
:deep(.bubble h6) {
    line-height: 1.3;
    margin: 12px 0 6px 0;
    font-weight: 600;
}

:deep(.bubble h1:first-child),
:deep(.bubble h2:first-child),
:deep(.bubble h3:first-child),
:deep(.bubble h4:first-child),
:deep(.bubble h5:first-child),
:deep(.bubble h6:first-child) {
    margin-top: 0;
}

:deep(.bubble h1) {
    font-size: 1.5em;
}

:deep(.bubble h2) {
    font-size: 1.3em;
}

:deep(.bubble h3) {
    font-size: 1.1em;
}

:deep(.bubble h4),
:deep(.bubble h5),
:deep(.bubble h6) {
    font-size: 1em;
}

:deep(.bubble p) {
    margin: 6px 0;
}

:deep(.bubble p:first-child) {
    margin-top: 0;
}

:deep(.bubble p:last-child) {
    margin-bottom: 0;
}

:deep(.bubble ul),
:deep(.bubble ol) {
    margin: 6px 0;
    padding-left: 20px;
}

:deep(.bubble li) {
    margin: 2px 0;
}
:deep(.bubble .table-container) {
    overflow-x: auto;
    margin: 8px 0;
    border-radius: 4px;
    border: 1px solid #ddd;
    width: 100%;
}

:deep(.bubble table) {
    border-collapse: collapse;
    width: 100%;
    min-width: 300px;  /* 確保表格有最小寬度 */
}

:deep(.bubble th),
:deep(.bubble td) {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
    white-space: nowrap; /* 防止表格內容換行 */
}

:deep(.bubble th) {
    background-color: rgba(0, 0, 0, 0.05);
    font-weight: 600;
    position: sticky;
    top: 0; /* 讓表頭固定 */
}

:deep(.bubble hr) {
    border: none;
    border-top: 1px solid #ccc;
    margin: 12px 0;
}

.msg-row.user .bubble {
    background: #fff;
}

.bubble::after {
    content: "";
    position: absolute;
    top: 14px;
    left: -4px;
    width: 12px;
    height: 12px;
    background: inherit;
    transform: rotate(45deg);
    border-radius: 2px;
}

.msg-row.user .bubble::after {
    left: auto;
    right: -4px;
}

.loading .bubble {
    display: flex;
    gap: 6px;
    padding: 14px 18px;
}

.dot {
    width: 12px;
    height: 12px;
    background: #c1c9d8;
    border-radius: 50%;
    animation: bounce 1s infinite ease-in-out;
}

.dot:nth-child(2) {
    animation-delay: .2s;
}

.dot:nth-child(3) {
    animation-delay: .4s;
}


.quick-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 6px 22px 4px;
}

.quick-actions button {
    flex: 1 1 220px;
    background: #fff;
    border: 1px solid #d9dfea;
    padding: 12px 16px;
    border-radius: 14px;
    cursor: pointer;
    font-size: 14px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .05);
    transition: background .25s, transform .25s;
}

.quick-actions button:hover {
    background: #eef4ff;
    transform: translateY(-2px);
}

.input-bar {
    display: flex;
    gap: 12px;
    padding: 10px 16px;
    border-top: 1px solid #e2e6ee;
}

.input-bar textarea {
    flex: 1;
    resize: none;
    border: 1px solid #c7ced9;
    border-radius: 14px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 16px;
    background: #fff;
    outline: none;
    line-height: 1.4;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .06);
    transition: border .25s, box-shadow .25s;
}

.input-bar textarea:focus {
    border-color: #8d9bff;
    box-shadow: 0 0 0 3px rgba(120, 130, 255, .25);
}

.input-bar textarea:disabled {
    background: #f5f5f7;
    color: #999;
    cursor: not-allowed;
    border-color: #ddd;
}

.send-btn {
    width: 54px;
    border: none;
    background: linear-gradient(135deg, #828fff, #8b5cf6);
    color: #fff;
    font-size: 20px;
    border-radius: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: filter .25s, transform .25s;
}

.send-btn:disabled {
    filter: grayscale(.5) brightness(.85);
    cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
}

/* 📝 免責聲明 */
.disclaimer {
    margin: 5px 12px;
    padding: 8px 16px;
    font-size: 11px;
    color: rgba(15, 23, 42, 0.5);
    text-align: center;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    backdrop-filter: blur(5px);
}

@keyframes bounce {
    0%,
    80%,
    100% {
        transform: scale(.4);
        opacity: .4;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }

    to {
        opacity: 1;
        transform: none;
    }
}

@media (max-width: 768px) {
    .chat-layout {
        position: relative;
        margin: 5px;
        margin-top: 60px;
        max-height: calc(100dvh - 60px)
    }
    
    .conversation-list {
        position: fixed;
        top: 60px;
        left: 0;
        height: calc(100% - 60px);
        z-index: 30;
        transform: translateX(-100%);
        opacity: 0;
        border-radius: 0 20px 20px 0;
        width: 240px;
        background: #fff;
    }

    .conversation-list.open {
        transform: translateX(0);
        opacity: 1;
    }

    .chat-header {
        gap: 6px;
        padding: 12px 8px;
    }
    
    .chat-wrapper {
        background: transparent;
        box-shadow: none;
        padding-top: 0;
    }

    .messages {
        padding: 12px 12px 4px;
    }

    .input-bar {
        padding: 8px 10px;
        border-top: 1px solid #cfcfcf;
    }

    /* 手機版表格優化 */
    :deep(.bubble .table-container) {
        overflow-x: auto;
        max-width: calc(100vw - 130px); /* 確保不會超出視窗寬度 */
        border-radius: 8px;
        -webkit-overflow-scrolling: touch; /* iOS 平滑滾動 */
    }

    :deep(.bubble table) {
        min-width: 200px; /* 減少最小寬度適應手機 */
        font-size: 14px; /* 稍微縮小字體 */
    }

    :deep(.bubble th),
    :deep(.bubble td) {
        font-size: 13px; /* 手機版使用較小字體 */
        white-space: normal; /* 允許文字換行 */
        word-break: break-word; /* 長詞自動換行 */
        min-width: 60px; /* 設定最小欄位寬度 */
    }

    :deep(.bubble th) {
        font-size: 14px;
        font-weight: 600;
    }
}

/* 更小的手機屏幕（如iPhone SE） */
@media (max-width: 480px) {
    :deep(.bubble .table-container) {
        max-width: calc(100vw - 120px);
    }

    :deep(.bubble table) {
        min-width: 260px;
        font-size: 13px;
    }

    :deep(.bubble th),
    :deep(.bubble td) {
        padding: 4px 6px;
        font-size: 12px;
        min-width: 50px;
    }

    :deep(.bubble th) {
        font-size: 13px;
    }

    /* 讓表格標題更緊湊 */
    :deep(.bubble .table-container::before) {
        font-size: 11px;
        padding: 3px 6px;
    }

    /* 為表格添加滾動提示 */
    :deep(.bubble .table-container::before) {
        content: "👈 左右滑動查看更多";
        display: block;
        color: #666;
        font-size: 12px;
        padding: 4px 8px;
    }
    
    .messages {
        gap: 15px;
    }

    .bubble {
        padding: 10px 16px;
        font-size: 14px;
    }
    
    .avatar {
        width: 40px;
        height: 40px;
        font-size: 20px;
    }

    /* 📝 免責聲明 */
    .disclaimer {
        margin: 6px 8px;
        font-size: 10px;
    }
}

</style>
