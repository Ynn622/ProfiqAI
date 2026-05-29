<template>
    <div class="screen">
        <Nav :show-menu="false" />
        <div class="chat-layout" :class="{ 'guest-mode': !isLoggedIn }">
            <!-- 聊天選單 -->
            <aside class="conversation-list" :class="{ open: sideOpen }" v-if="isLoggedIn">
                <div class="list-header">
                    <h3>投資智聊 AI</h3>
                    <button class="close-btn" @click="toggleSide" aria-label="close" v-if="isMobile">×</button>
                </div>
                <ul>
                    <li class="new-chat-row" @click="newConversation">
                        <i class="fa-solid fa-plus"></i>
                        <div class="conversation-meta">
                            <span class="title">新會話</span>
                        </div>
                    </li>
                    <li v-for="c in visibleConversations" :key="c.id" :class="{ active: c.id === activeId }"
                        @click="selectConversation(c.id)">
                        <i class="fa-regular fa-comments"></i>
                        <div class="conversation-meta">
                            <span class="title">{{ truncateTitle(c.title) }}</span>
                            <span class="created-at" v-if="c.persisted">{{ c.createdAt }}</span>
                        </div>
                    </li>
                </ul>
            </aside>
            <!-- 聊天室 -->
            <div class="chat-wrapper">
                <header class="chat-header">
                    <button class="hamburger" @click="toggleSide" v-if="isMobile && isLoggedIn">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="chat-title">
                        智聊機器人
                        <select v-model="modelSelected" class="model-selector">
                            <option v-for="model in modelOptions" :key="model" :value="model">
                                {{ model }}
                            </option>
                        </select>
                    </div>
                    <a-tooltip placement="bottom">
                        <template #title>刪除目前聊天室</template>
                        <button class="delete-chat-btn" type="button" @click="deleteCurrentConversation"
                            :disabled="!activeConversation || activeLoading || isDeletingConversation"
                            aria-label="delete current conversation">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </a-tooltip>
                </header>
                <div class="messages" ref="msgContainer">
                    <div class="history-loading" v-if="isChatHistoryLoading">
                        <span class="dot" v-for="n in 3" :key="n"></span>
                    </div>
                    <div v-for="(m, i) in activeMessages" :key="i" :class="['msg-row', m.role]">
                        <div class="avatar" v-if="m.role === 'bot'">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="avatar user" v-if="m.role === 'user'">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="bubble-wrapper">
                            <div class="bubble" v-if="m.streaming" v-html="processMarkdown(m.text)"></div>
                            <div class="bubble" v-else v-html="m.html"></div>
                            <div class="duration" v-if="m.role === 'bot' && (m.duration || m.model)">
                                <span v-if="m.createdAt" class="meta-item">
                                    <i class="fa-regular fa-calendar"></i> {{ m.createdAt }}
                                </span>
                                <span v-if="m.model" class="meta-item">
                                    <i class="fa-solid fa-microchip"></i> {{ m.model.replace('gpt', 'GPT') }}
                                </span>
                                <span v-if="m.duration" class="meta-item">
                                    <i class="fa-regular fa-clock"></i> {{ m.duration }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="msg-row bot loading" v-if="activeLoading && !activeConversation?.streamingStarted">
                        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                        <div class="bubble-wrapper">
                            <div class="bubble"><span class="dot" v-for="n in 3" :key="n"></span></div>
                            <div class="loading-hint" v-if="activeConversation?.statusText">
                                {{ activeConversation.statusText }}
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 免責聲明 -->
                <p class="disclaimer">投資有風險，敬請謹慎評估，並查核重要資訊。</p>
                <form class="input-bar" @submit.prevent="send">
                    <textarea ref="textareaRef" v-model="userInput"
                        :placeholder="chatInputPlaceholder" rows="1"
                        @keydown.enter.exact.prevent="handleEnterKey" @input="autoResize"
                        @compositionstart="handleCompositionStart" @compositionend="handleCompositionEnd"
                        :disabled="isInputDisabled"></textarea>
                    <button type="submit" :disabled="!userInput.trim() || isInputDisabled" class="send-btn"><i
                            class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import Nav from '@/components/Common/Nav.vue';
import { Tooltip as ATooltip } from 'ant-design-vue';

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { callAPI, API_BASE_URL } from '@/utils/apiConfig.js';
import { processMarkdown } from '@/utils/markdownParser.js';
import { useAuthStore } from '@/utils/authStore.js';
import { supabase } from '@/utils/supabase.js';

const GREETING = '嗨～我是**智聊機器人**，您的 AI 投資夥伴。今天有想討論的股市問題嗎？';

const authStore = useAuthStore();
const isLoggedIn = authStore.isLoggedIn;
const isMobile = ref(false);
const sideOpen = ref(false);
const conversations = ref([createConversation()]);
const activeId = ref(conversations.value[0]?.id || '');
const userInput = ref('');
const msgContainer = ref(null);
const textareaRef = ref(null);
const isComposing = ref(false);
const isLoadingConversations = ref(false);
const isDeletingConversation = ref(false);
const activeConversation = computed(() => conversations.value.find(c => c.id === activeId.value));
const visibleConversations = computed(() => conversations.value.filter(c => c.persisted));
const activeMessages = computed(() => activeConversation.value?.messages || []);
const activeLoading = computed(() => activeConversation.value?.loading || false);
const isChatHistoryLoading = computed(() => {
    const convo = activeConversation.value;
    return isLoadingConversations.value || (isLoggedIn.value && !!convo && !convo.messagesLoaded);
});
const isInputDisabled = computed(() => activeLoading.value || isChatHistoryLoading.value);
const chatInputPlaceholder = computed(() => {
    if (isChatHistoryLoading.value) return '聊天記錄載入中...';
    if (activeLoading.value) return '等待機器人回應中...';
    return '請輸入文字...';
});

const modelOptions = ['GPT-4.1-mini', 'GPT-4o-mini', 'GPT-5-mini', 'GPT-5.4-mini', 'GPT-5.4-nano'];
const modelSelected = ref('GPT-5.4-nano');

function createConversation(overrides = {}) {
    // 建立一個前端聊天室狀態，登入後可用 overrides 套入後端資料。
    return {
        id: overrides.id || generateChatId(),
        title: overrides.title || '智聊 AI',
        createdAt: overrides.createdAt || formatTime(new Date()),
        persisted: overrides.persisted ?? false,
        loading: false,
        streamingStarted: false,
        statusText: '',
        messagesLoaded: overrides.messagesLoaded ?? true,
        messages: overrides.messages || [createMessage('bot', GREETING)]
    };
}

function createMessage(role, text, overrides = {}) {
    // 統一建立訊息物件，並預先快取完成狀態要顯示的 markdown HTML。
    return {
        role,
        text,
        html: processMarkdown(text),
        streaming: false,
        model: '',
        createdAt: formatMessageTime(new Date()),
        ...overrides
    };
}

function finalizeMessage(message) {
    // 串流結束後固定訊息內容，避免完成後每次 render 都重新解析 markdown。
    message.streaming = false;
    message.html = processMarkdown(message.text || '');
}

function scrollBottom() {
    // 等 DOM 更新後把訊息區滾到最底部。
    nextTick(() => { if (msgContainer.value) { msgContainer.value.scrollTop = msgContainer.value.scrollHeight; } });
}

watch(() => authStore.user.value?.id || '', async () => {
    await initializeConversations();
});

function handleCompositionStart() {
    // 中文輸入法選字期間避免 Enter 直接送出。
    isComposing.value = true;
}

function handleCompositionEnd() {
    // 中文輸入法選字完成後恢復 Enter 送出。
    isComposing.value = false;
}

function handleEnterKey() {
    // Enter 送出訊息；輸入法組字中或等待回覆時不送出。
    if (!isInputDisabled.value && !isComposing.value) {
        send();
    }
}

async function send() {
    // 將使用者訊息放入目前聊天室，登入版第一次發問才顯示為正式對話。
    let convo = activeConversation.value;
    if (!convo && isLoggedIn.value) {
        newConversation();
        convo = activeConversation.value;
    }
    if (!convo || convo.loading || isChatHistoryLoading.value) return;

    const text = userInput.value.trim();
    if (!text) return;

    if (convo.title === '智聊 AI') {
        convo.title = buildConversationTitle(text);
    }

    if (isLoggedIn.value && !convo.persisted) {
        convo.persisted = true;
        convo.createdAt = formatTime(new Date());
    }

    convo.messages.push(createMessage('user', text));
    userInput.value = '';
    resetTextareaHeight();

    const startTime = Date.now();

    callChatBotAPI(text, modelSelected.value, convo, startTime);
    scrollBottom();
}

async function callChatBotAPI(prompt, model, convo, startTime) {
    // 呼叫後端 SSE 串流，將 delta 排入逐字佇列並在完成後補上模型與耗時。
    convo.loading = true;
    convo.streamingStarted = false;
    convo.statusText = '';
    let botMessage = null;
    let doneEvent = null;
    let queue = '';
    let rafId = 0;
    let drainResolve = null;

    const ensureBotMessage = () => {
        if (!botMessage) {
            const message = createMessage('bot', '', { html: '', streaming: true, duration: '', model });
            convo.messages.push(message);
            botMessage = convo.messages[convo.messages.length - 1];
        }
        return botMessage;
    };

    const appendText = (text) => {
        if (!text) return;
        const message = ensureBotMessage();
        message.text += text;
        convo.streamingStarted = true;
        scrollBottom();
    };

    const pumpTypewriter = () => {
        if (!queue.length) {
            rafId = 0;
            if (drainResolve) {
                drainResolve();
                drainResolve = null;
            }
            return;
        }

        const take = 1;
        appendText(queue.slice(0, take));
        queue = queue.slice(take);
        rafId = requestAnimationFrame(pumpTypewriter);
    };

    const appendDelta = (text) => {
        if (!text) return;
        queue += text;
        ensureBotMessage();
        convo.streamingStarted = true;
        if (!rafId) {
            rafId = requestAnimationFrame(pumpTypewriter);
        }
    };

    const waitForQueue = () => {
        if (!queue.length && !rafId) return Promise.resolve();
        return new Promise(resolve => {
            drainResolve = resolve;
        });
    };

    const yieldToBrowser = () => new Promise(resolve => requestAnimationFrame(resolve));

    try {
        const response = await fetchChatStream({ question: prompt, model, uuid: convo.id });

        if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split('\n\n');
            buffer = blocks.pop() || '';
            let hasDelta = false;

            for (const block of blocks) {
                const event = parseSseBlock(block);
                if (!event) continue;

                if (event.type === 'delta') {
                    const delta = event.data.delta || '';
                    appendDelta(delta);
                    hasDelta = true;
                }

                if (event.type === 'status') {
                    convo.statusText = event.data.message || '';
                }

                if (event.type === 'done') {
                    doneEvent = event.data;
                    if (isLoggedIn.value && event.data.title) {
                        convo.title = event.data.title;
                    }
                }

                if (event.type === 'error') {
                    throw new Error(event.data.message || 'stream error');
                }
            }

            if (hasDelta) {
                await yieldToBrowser();
            }
        }

        await waitForQueue();

        if (!botMessage) {
            const message = createMessage(
                'bot',
                doneEvent?.response || '抱歉，我現在無法回答您的問題。',
                {
                duration: '',
                streaming: false,
                model
                }
            );
            convo.messages.push(message);
            botMessage = convo.messages[convo.messages.length - 1];
        }
        finalizeMessage(botMessage);
        botMessage.model = model;
        botMessage.createdAt = formatMessageTime(new Date());
        botMessage.duration = formatDuration(doneEvent?.duration_ms ?? Date.now() - startTime);
    } catch (error) {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
        const duration = formatDuration(Date.now() - startTime);
        if (botMessage) {
            botMessage.model = model;
            botMessage.duration = duration;
            if (!botMessage.text) botMessage.text = '抱歉，系統暫時無法連接，請稍後再試。';
            finalizeMessage(botMessage);
        } else {
            convo.messages.push(createMessage('bot', '抱歉，系統暫時無法連接，請稍後再試。', {
                duration,
                model
            }));
        }
    } finally {
        convo.loading = false;
        convo.streamingStarted = false;
        convo.statusText = '';
        scrollBottom();
    }
}

async function initializeConversations() {
    // 進入頁面或登入狀態變化時，依登入狀態載入後端對話或重置訪客對話。
    if (!isLoggedIn.value) {
        resetGuestConversation();
        return;
    }

    isLoadingConversations.value = true;
    try {
        const response = await callChatAPI({
            url: '/chat/conversations',
            method: 'GET',
            funcName: 'loadChatConversations'
        });
        const rows = response.conversations || [];
        if (!rows.length) {
            resetGuestConversation();
            return;
        }

        conversations.value = rows.map(row => createConversation({
            id: row.id,
            title: row.title,
            createdAt: formatDisplayTime(row.createdAt),
            persisted: true,
            messagesLoaded: false,
            messages: []
        }));
        activeId.value = conversations.value[0].id;
        await loadMessages(activeId.value);
    } catch (error) {
        resetGuestConversation();
    } finally {
        isLoadingConversations.value = false;
    }
}

function resetGuestConversation() {
    // 訪客模式只保留單一暫存聊天室，重新整理後會消失。
    const guest = createConversation();
    conversations.value = [guest];
    activeId.value = guest.id;
}

async function selectConversation(id) {
    // 切換聊天室；登入版第一次點開時才向後端載入歷史訊息。
    activeId.value = id;
    if (isLoggedIn.value) {
        await loadMessages(id);
    }
    if (isMobile.value) {
        sideOpen.value = false;
    }
}

async function newConversation() {
    // 建立本地草稿聊天室；登入版等使用者真的送出問題後才會出現在清單。
    const convo = createConversation();

    if (!isLoggedIn.value) {
        conversations.value = [convo];
    } else {
        conversations.value = [
            convo,
            ...conversations.value.filter(c => c.persisted)
        ];
    }

    activeId.value = conversations.value[0].id;
}

async function deleteCurrentConversation() {
    // 刪除目前聊天室；登入且已儲存時同步刪除後端資料。
    const convo = activeConversation.value;
    if (!convo || convo.loading || isDeletingConversation.value) return;

    const confirmed = window.confirm('確定要刪除目前聊天室嗎？');
    if (!confirmed) return;

    isDeletingConversation.value = true;
    try {
        if (isLoggedIn.value && convo.persisted) {
            await callChatAPI({
                url: `/chat/conversations/${encodeURIComponent(convo.id)}`,
                method: 'DELETE',
                funcName: 'deleteChatConversation'
            });
        }

        await removeConversationFromState(convo.id);
    } catch (error) {
        window.alert('聊天室刪除失敗，請稍後再試。');
    } finally {
        isDeletingConversation.value = false;
    }
}

async function removeConversationFromState(conversationId) {
    // 從前端狀態移除聊天室，並切換到下一個可用聊天室或新草稿。
    const remaining = conversations.value.filter(c => c.id !== conversationId);

    if (!isLoggedIn.value) {
        resetGuestConversation();
        return;
    }

    conversations.value = remaining.filter(c => c.persisted);

    if (!conversations.value.length) {
        const draft = createConversation();
        conversations.value = [draft];
        activeId.value = draft.id;
        return;
    }

    activeId.value = conversations.value[0].id;
    await loadMessages(activeId.value);
}

async function loadMessages(id) {
    // 從後端載入指定聊天室的歷史訊息並轉成前端訊息格式。
    const convo = conversations.value.find(c => c.id === id);
    if (!convo || convo.messagesLoaded) return;

    try {
        const response = await callChatAPI({
            url: `/chat/conversations/${encodeURIComponent(id)}/messages`,
            method: 'GET',
            funcName: 'loadChatMessages'
        });
        const rows = response.messages || [];
        convo.messages = rows.length
            ? rows.map(message => createMessage(message.role, message.text, {
                duration: message.duration ? formatDuration(message.duration) : '',
                model: message.model || '',
                createdAt: formatMessageTime(message.createdAt)
            }))
            : [createMessage('bot', GREETING)];
        convo.messagesLoaded = true;
        scrollBottom();
    } catch (error) {
        convo.messages = [createMessage('bot', '抱歉，聊天記錄暫時無法載入。')];
        convo.messagesLoaded = true;
    }
}

async function callChatAPI(options) {
    // 聊天相關 API 若遇到 token 過期，先 refresh session 後自動重試一次。
    try {
        return await callAPI({
            ...options,
            headers: await requestHeaders()
        });
    } catch (error) {
        if (!isUnauthorizedError(error) || !isLoggedIn.value) {
            throw error;
        }

        try {
            return await callAPI({
                ...options,
                headers: await requestHeaders(true)
            });
        } catch (retryError) {
            if (isUnauthorizedError(retryError)) {
                await handleAuthExpired();
            }
            throw retryError;
        }
    }
}

async function fetchChatStream(payload, forceRefresh = false) {
    // 建立聊天串流請求；401 時 refresh token 後重新發出一次請求。
    const response = await fetch(`${API_BASE_URL}/chat/chatBot/stream`, {
        method: 'POST',
        headers: await requestHeaders(forceRefresh),
        body: JSON.stringify(payload)
    });

    if (response.status !== 401 || !isLoggedIn.value) {
        return response;
    }

    if (forceRefresh) {
        await handleAuthExpired();
        return response;
    }

    return fetchChatStream(payload, true);
}

async function requestHeaders(forceRefresh = false) {
    // 依登入狀態組出 API headers，登入時附上 Supabase access token。
    const headers = { 'Content-Type': 'application/json' };
    if (!isLoggedIn.value) return headers;

    const token = await getAccessToken(forceRefresh);
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
}

async function getAccessToken(forceRefresh = false) {
    // 取得 Supabase access token；必要時主動 refresh，避免送出過期 token。
    if (forceRefresh) {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return data.session?.access_token || '';
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data.session;
    if (session?.access_token && !isSessionExpiring(session)) {
        return session.access_token;
    }

    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    return refreshed.data.session?.access_token || '';
}

function isSessionExpiring(session) {
    // Supabase expires_at 是秒，提早 60 秒 refresh，避免剛送 API 就過期。
    if (!session?.expires_at) return false;
    return session.expires_at * 1000 <= Date.now() + 60000;
}

function isUnauthorizedError(error) {
    // callAPI 會把 401 包成 Error message，這裡統一判斷是否需要 refresh/relogin。
    return error?.status === 401 || String(error?.message || '').includes('HTTP 401');
}

async function handleAuthExpired() {
    // refresh 後仍失敗時，清掉前端登入狀態並退回訪客聊天室。
    await authStore.handleLogout();
    resetGuestConversation();
}

function parseSseBlock(block) {
    // 將後端 SSE 區塊解析成 { type, data } 方便前端分流處理。
    const lines = block.split('\n');
    const eventLine = lines.find(line => line.startsWith('event:'));
    const dataLines = lines.filter(line => line.startsWith('data:'));
    if (!eventLine || !dataLines.length) return null;

    const type = eventLine.slice(6).trim();
    const dataText = dataLines.map(line => line.slice(5).trim()).join('\n');
    return { type, data: JSON.parse(dataText) };
}

function toggleSide() {
    // 手機版開關左側聊天室清單。
    sideOpen.value = !sideOpen.value;
}

function handleResize() {
    // 依視窗寬度切換手機/桌面側欄行為。
    isMobile.value = window.innerWidth < 768;
    if (!isMobile.value) {
        sideOpen.value = true;
    }
}

function autoResize(e) {
    // 讓輸入框依內容增高，最多到固定高度後改由內部滾動。
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

function resetTextareaHeight() {
    // 送出後把輸入框高度恢復成初始狀態。
    nextTick(() => {
        if (textareaRef.value) {
            textareaRef.value.style.height = 'auto';
            textareaRef.value.style.height = '';
        }
    });
}

// 產生唯一會話 ID
function generateChatId() {
    // 用時間戳加 randomUUID 產生前端聊天室 ID，後端會沿用同一個 ID 儲存。
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
    // 將 Date 格式化成聊天室清單顯示用時間。
    const dateStr = date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).replace(/\//g, "-");
    const timeStr = date.toLocaleTimeString("zh-TW", { hour12: false });

    return `${dateStr} ${timeStr}`;
}

function formatDisplayTime(value) {
    // 將後端時間字串轉成前端顯示格式。
    if (!value) return formatTime(new Date());
    return formatTime(new Date(value));
}

function formatMessageTime(value) {
    // 將訊息時間格式化為 MM/DD hh:mm，顯示在機器人回覆資訊列。
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${minute}`;
}

function buildConversationTitle(text) {
    // 使用第一則提問前 24 個字作為本地暫時標題。
    const compact = text.replace(/\s+/g, ' ').trim();
    return compact ? compact.slice(0, 24) : '智聊 AI';
}

function truncateTitle(title) {
    // 聊天清單只顯示前 15 個字，完整標題仍保留在資料裡。
    const text = String(title || '');
    return text.length > 15 ? `${text.slice(0, 15)}...` : text;
}

function formatDuration(ms) {
    // 將毫秒轉成秒數顯示。
    return `${(ms / 1000).toFixed(1)}s`;
}

// 進入頁面時執行
onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    sideOpen.value = true;
    initializeConversations();
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
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

.conversation-list li.new-chat-row {
    border-left-color: #22c55e;
    color: #166534;
    font-weight: 600;
    border-bottom: 1px solid #edf0f6;
}

.conversation-list li.new-chat-row:hover {
    background: #ecfdf3;
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

.chat-layout.guest-mode .chat-wrapper {
    margin-left: 0;
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

.delete-chat-btn {
    width: 36px;
    height: 36px;
    margin-left: auto;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #8a8a96;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: background .2s, color .2s;
}

.delete-chat-btn:hover:not(:disabled) {
    background: #fff1f2;
    color: #dc2626;
}

.delete-chat-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
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

.history-loading {
    align-self: center;
    margin: auto 0;
    display: inline-flex;
    gap: 6px;
    padding: 12px 16px;
    border-radius: 999px;
    background: rgba(255, 255, 255, .72);
    box-shadow: 0 2px 8px rgba(0, 0, 0, .06);
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

.bubble.plain-text {
    white-space: pre-wrap;
}

.duration {
    font-size: 12px;
    color: #888;
    padding-left: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    opacity: 0.8;
}

.meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
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
