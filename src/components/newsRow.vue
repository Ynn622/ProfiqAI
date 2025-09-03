<template>
    <div class="news-row">
        <div class="news-info">
            <h2>{{ title }}</h2>
        </div>

        <span>{{ content }}</span>

        <div class="news-time">
            <i class="fa-solid fa-square-arrow-up-right"/> 鉅亨網 &nbsp;<i class="fa-solid fa-clock" /> {{ time }}
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Number,
        default: 0
    },
    content: {
        type: String,
        default: ''
    }
});

const time = formatTime(props.timestamp*1000);

function formatTime(timestamp) {
    const date = new Date(timestamp - 60 * 60 * 8 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

</script>

<style scoped>
.news-row {
    padding: 12px 16px;
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
    background: #ececec;
    box-shadow: var(--shadowSmall);
    cursor: pointer;
    border-radius: 10px;
    transition: background 0.3s ease;
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
.news-time {
    text-align: end;
}
</style>