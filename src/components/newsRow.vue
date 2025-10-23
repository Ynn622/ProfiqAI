<template>
    <div class="news-row" @click="openLink(url)">
        <div class="news-info">
            <span class="news-title">{{ cleanTitle }}</span>
            <span v-if="!isMobile" class="news-meta">
                &nbsp; 
                <i class="fa-solid fa-square-arrow-up-right" /> {{ source }} &nbsp;
                <i class="fa-solid fa-clock" /> {{ time }}
            </span>
        </div>
        <span class="news-summary">{{ summary }}</span>
        <div class="news-meta" v-if="isMobile">
            <i class="fa-solid fa-square-arrow-up-right" /> {{ source }} &nbsp;
            <i class="fa-solid fa-clock" /> {{ time }}
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { isMobileView } from '@/utils/userInterface.js';
import { computed } from 'vue';

// Props
const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Number,
        default: 0
    },
    summary: {
        type: String,
        default: ''
    },
    url: {
        type: String,
        default: ''
    },
    source: {
        type: String,
        default: ''
    }
});

const { width, isMobile } = isMobileView();

const cleanTitle = computed(() => props.title.replace(/<[^>]+>/g, ''));

// 轉換時間戳為 YYYY-MM-DD HH:MM 格式
const time = formatTime(props.timestamp*1000);
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function openLink(url) {
    window.open(url, '_blank');
}

</script>

<style scoped>
.news-row {
    padding: 12px 16px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    background: #ececec;
    box-shadow: var(--shadow-small);
    cursor: pointer;
    border-radius: 10px;
    transition: background-color 0.3s ease;
}
.news-row:hover {
    background: #dcdcdc;
}
.news-row h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}
.news-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.news-title {
    font-size: 18px;
    font-weight: 700;
    flex: 1;
}

.news-meta {
    text-align: end;
    align-self: start;
    white-space: nowrap;
}

@media (max-width: 768px) {
    .news-meta {
        font-size: 13px;
        margin-top: 5px;
        width: auto;
    }
}
</style>