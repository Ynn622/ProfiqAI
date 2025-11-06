<template>
    <div class="nav-bar" :class="{ phone: isMobile }">
        <div class="nav-left">
            <img class="logo-img" src="/logo.png" alt="AI 投資智聊 logo" @click="tapLogo" />
            <SearchBar 
              v-if="!isMobile || showMobileSearch" 
              :is-mobile-expanded="showMobileSearch"
              @close-search="toggleMobileSearch"
            />
            <i 
                v-if="isMobile && !showMobileSearch" 
                class="fa-solid fa-magnifying-glass search-icon" 
                @click="toggleMobileSearch"
            ></i>
        </div>

        <div class="nav-right">
            <ChatBotButton 
              v-if="!isMobile || !isChatBotRoute" 
              design="small" 
              :class="{ 'compact': isMobile && showMobileSearch }" 
            />
            <i 
                v-if="(isMobile && showMobileSearch)" 
                class="fa-solid fa-arrow-left back-icon" 
                @click="toggleMobileSearch"
            ></i>
            <i v-else-if="!isMobile" class="user fa-solid fa-circle-user"></i>
            <i 
              v-else-if="!isChatBotRoute" 
              class="fa-solid fa-bars" 
              @click="toggleMenu"
            ></i>
        </div>
    </div>

    <!-- 手機版選單 -->
    <div v-if="expandMenu && isMobile && !isChatBotRoute" class="nav-bar-menu">
        <div v-for="(value, key) in PageDict" :key="key" @click="asidePage(key)">
            <div class="menu-item">{{ key }}</div>
        </div>
    </div>
</template>

<script setup>
// 組件
import SearchBar from '@/components/Common/SearchBar.vue';
import ChatBotButton from '@/components/Button/ChatBotButton.vue';

// 工具 & 套件
import router from '@/router';
import { isMobileView } from '@/utils/userInterface.js';
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { width, isMobile } = isMobileView();
const expandMenu = ref(false);
const showMobileSearch = ref(false);

// Check if current route is the chat bot route
const isChatBotRoute = computed(() => {
    return route.name === 'chat-bot';
});

const PageDict = {
    '股票速覽': 'stock-summary',
    '分析儀表': 'stock-analysis',
    '新聞股雲': 'stock-linked'
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
}

.nav-left {
    display: flex;
    gap: 20px;
    align-items: center;
    flex: 2;
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
    margin-bottom: 10px;
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
    left: 75px; /* Start from the right edge of the logo (55px + 20px gap) */
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
    position: absolute;
    top: 70px;
    right: 10px;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    z-index: 1000;
}

.menu-item {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.menu-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>