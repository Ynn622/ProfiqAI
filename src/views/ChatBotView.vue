<template>
    <div class="screen">
    <Nav />
        <div class="chat-layout">
            <aside class="conversation-list" :class="{ open: sideOpen }">
                <div class="list-header">
                    <h3>AI智聊</h3>
                    <button class="close-btn" @click="toggleSide" aria-label="close" v-if="isMobile">×</button>
                </div>
                <ul>
                    <li v-for="c in conversations" :key="c.id" :class="{ active: c.id === activeId }"
                        @click="selectConversation(c.id)">
                        <i class="fa-regular fa-comments"></i>
                        <span class="title">{{ c.title }}</span>
                    </li>
                </ul>
                <div class="new-chat-block">
                    <button class="new-chat" @click="newConversation">+ 新會話</button>
                </div>
            </aside>
            <div class="chat-wrapper">
                <header class="chat-header">
                    <button class="hamburger" @click="toggleSide" v-if="isMobile">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="chat-title">AI智慧機器人</div>
                </header>
                <div class="messages" ref="msgContainer">
                    <div v-for="(m, i) in activeMessages" :key="i" :class="['msg-row', m.role]">
                        <div class="avatar" v-if="m.role === 'bot'">
                            <i class="fa-solid fa-robot"></i>
                        </div>
                        <div class="bubble" v-html="formatHTML(m.text)"></div>
                        <div class="avatar user" v-if="m.role === 'user'">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    </div>
                    <div class="msg-row bot loading" v-if="loading">
                        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                        <div class="bubble"><span class="dot" v-for="n in 3" :key="n"></span></div>
                    </div>
                </div>
                <form class="input-bar" @submit.prevent="send">
                    <textarea v-model="userInput" placeholder="請輸入文字..." rows="1" @keydown.enter.exact.prevent="send"
                        @input="autoResize"></textarea>
                    <button type="submit" :disabled="!userInput.trim() || loading" class="send-btn"><i
                            class="fa-solid fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Nav from '@/components/Nav.vue';

import data from '@/data/sampleChat.json';
const isMobile = ref(false);
const sideOpen = ref(false);
const conversations = ref(structuredClone(data.conversations));
const activeId = ref(conversations.value[0]?.id || '');
const userInput = ref('');
const loading = ref(false);
const msgContainer = ref(null);
const activeMessages = computed(() => conversations.value.find(c => c.id === activeId.value)?.messages || []);


function formatHTML(t) { 
    return t.replace(/\n/g, '<br />'); 
}

function scrollBottom() {
    nextTick(() => { if (msgContainer.value) { msgContainer.value.scrollTop = msgContainer.value.scrollHeight; } });
}
watch(activeMessages, scrollBottom, { deep: true });
function send() {
    const text = userInput.value.trim();
    if (!text) return;
    const convo = conversations.value.find(c => c.id === activeId.value);
    convo.messages.push({ role: 'user', text });
    userInput.value = '';
    triggerBot(convo);
    scrollBottom();
}
function triggerBot(convo) {
    loading.value = true;
    setTimeout(() => {
        const reply = mockBotReply(convo.messages[convo.messages.length - 1].text);
        convo.messages.push({ role: 'bot', text: reply });
        loading.value = false;
        scrollBottom();
    }, 900);
}
function mockBotReply(prompt) {
    if (/(大盤|加權|指數)/.test(prompt)) return '今日大盤維持震盪，電子權值走勢偏穩，金融小幅回檔，請留意量能是否續縮。';
    if (/(族群|產業)/.test(prompt)) return '強勢族群：AI伺服器、航運、車用電子。弱勢：部分傳產塑化。';
    if (/(指標|KD|MACD)/i.test(prompt)) return 'KD 黃金交叉：K由下往上穿越D，多頭轉強訊號；若同時低檔背離更佳。MACD 柱狀體翻正代表動能轉多。';
    return '收到！目前為示範假資料，未連接真實 AI，稍後將提供更完整答案。';
}
function selectConversation(id) { activeId.value = id; if (isMobile.value) { sideOpen.value = false; } }
function newConversation() {
    const id = 'conv-' + Date.now();
    conversations.value.unshift({
        id,
        title: '新的會話',
        messages: [{ role: 'bot', text: '您好！這是新的會話，請輸入您的問題。' }]
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


// 進入頁面時執行
onMounted(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    sideOpen.value = true;
});

</script>

<style scoped>
@import '/src/assets/main.css';

.chat-layout {
    display: flex;
    flex: 1;
    max-height: 100%;
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
    letter-spacing: 1px;
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
    padding: 14px 18px 10px;
    border-bottom: 1px solid #e2e6ee;
}

.chat-title {
    font-weight: 700;
    font-size: 18px;
    letter-spacing: .5px;
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
    padding: 18px 22px 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
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

.bubble {
    max-width: min(720px, 80%);
    background: #e8f2ff;
    padding: 14px 18px;
    border-radius: 18px;
    line-height: 1.55;
    font-size: 15px;
    position: relative;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .06);
}

.msg-row.user .bubble {
    background: #fff;
}

.bubble::after {
    content: "";
    position: absolute;
    top: 14px;
    left: -7px;
    width: 12px;
    height: 12px;
    background: inherit;
    transform: rotate(45deg);
    border-radius: 2px;
}

.msg-row.user .bubble::after {
    left: auto;
    right: -7px;
}

.loading .bubble {
    display: flex;
    gap: 6px;
}

.dot {
    width: 10px;
    height: 10px;
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
    padding: 16px 20px 18px;
    border-top: 1px solid #e2e6ee;
}

.input-bar textarea {
    flex: 1;
    resize: none;
    border: 1px solid #c7ced9;
    border-radius: 14px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 15px;
    background: #fff;
    outline: none;
    line-height: 1.5;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, .06);
    transition: border .25s, box-shadow .25s;
}

.input-bar textarea:focus {
    border-color: #8d9bff;
    box-shadow: 0 0 0 3px rgba(120, 130, 255, .25);
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
    }
    
    .conversation-list {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
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

    .chat-wrapper {
        background: transparent;
        box-shadow: none;
        padding-top: 0;
    }

    .messages {
        padding: 16px 14px 8px;
    }

    .bubble {
        max-width: 100%;
    }

    .input-bar {
        padding: 14px 10px 18px;
    }
}
</style>