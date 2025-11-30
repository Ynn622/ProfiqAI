<template>
    <div class="nav-bar" :class="{ phone: isMobile }">
        <div class="nav-left">
            <i 
              v-if="isMobile &&showMenu" 
              class="fa-solid fa-bars" 
              @click="toggleMenu"
            ></i>
            <img class="logo-img" src="/logo.png" alt="AI 投資智聊 logo" @click="tapLogo" />
            <SearchBar 
              v-if="!isMobile || isMobile" 
              :is-mobile-expanded="showMobileSearch"
              @close-search="toggleMobileSearch"
            />
        </div>
        <!-- 手機版選單 -->
        <div v-if="isMobile && showMenu" class="nav-bar-menu" :class="{ open: expandMenu }">
            <div v-for="(value, key) in PageDict" :key="key" @click="asidePage(key)">
                <div class="menu-item">{{ key }}</div>
            </div>
        </div>

        <div class="nav-right">
            <ChatBotButton v-if="!isMobile && showMobileSearch"/>
            <UserProfile />
        </div>
    </div>

    
</template>

<script setup>
// 組件
import SearchBar from '@/components/Common/SearchBar.vue';
import ChatBotButton from '@/components/Button/ChatBotButton.vue';
import UserProfile from '@/components/Common/UserProfile.vue';

// 工具 & 套件
import router from '@/router';
import { isMobileView } from '@/utils/userInterface.js';
import { ref, toRefs } from 'vue';
const props = defineProps({
    showMenu: {
        type: Boolean,
        default: true
    }
});
const { showMenu } = toRefs(props);
const { isMobile } = isMobileView();
const expandMenu = ref(false);
const showMobileSearch = ref(false);

const PageDict = {
    '股票速覽': 'stock-summary',
    '分析儀表': 'stock-analysis',
    '新聞股雲': 'stock-linked',
    '智聊AI' :'chat-bot',
};

function tapLogo() {
    router.push({ name: 'home' });
}

function toggleMenu() {
    expandMenu.value = !expandMenu.value;
}

function toggleMobileSearch() {
    showMobileSearch.value = !showMobileSearch.value;
}

function asidePage(page) {
    if (PageDict[page]) {
        router.push({ name: PageDict[page] });
        expandMenu.value = false;
    }
}
</script>

<style scoped>
.nav-bar {
    display: flex;
    padding: 0 16px;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    height: 70px;
    position: relative;
    z-index: 1001;
}

.nav-left {
    display: flex;
    gap: 20px;
    align-items: center;
    flex: 2;
}

.nav-bar.phone .nav-left {
    gap: 10px;
}

.nav-right {
    display: flex;
    gap: 20px;
    align-items: center;
}

.logo-img {
    max-width: 70px;
    border-radius: 10%;
    aspect-ratio: 1/1;
    transition: transform 0.3s ease;
    height: fit-content;
    cursor: pointer;
    position: relative;
    z-index: 101; /* Ensure logo stays above search bar */
}

.user {
    font-size: 50px;
}

/* 搜尋圖示 */
.search-icon {
    font-size: 24px;
    cursor: pointer;
    color: #333;
}

/* 返回圖示 */
.back-icon {
    font-size: 24px;
    cursor: pointer;
    color: #333;
}

/* 手機版樣式 */
.nav-bar.phone {
    padding: 20px 10px;
    margin-bottom: 3px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background-color: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    color: #2c3e50;
    position: relative;
}

.nav-bar.phone .logo-img {
    max-width: 55px;
}

.nav-bar.phone .search.mobile-expanded {
    position: absolute;
    left: 119px; /* Start from the right edge of the logo */
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    max-width: none;
}

/* 當搜尋欄展開時，調整智聊AI按鈕的間距 */
.nav-bar.phone .nav-right .compact {
    padding: 6px 10px;
    height: auto;
}

.nav-bar.phone i {
    font-size: 30px;
}

.nav-bar-menu {
    position: fixed;
    top: 69px;
    left: 0;
    height: calc(100% - 70px);
    width: 240px;
    background-color: white;
    border-right: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    border-radius: 0 20px 20px 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    padding: 14px 0;
}

.nav-bar-menu.open {
    transform: translateX(0);
    padding-top: 0px;
    padding-bottom: 774px;
}

.menu-item {
    padding: 12px 18px;
    border-left: 4px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 10px;
}

.menu-item:hover {
    background-color: #f3f3f6;
}
</style>
