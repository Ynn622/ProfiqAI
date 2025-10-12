<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>消息面分析</h3>
                <ProbCircle :isUp="true" :directionLabel="'偏多'" />
            </div>
            <div class="analysis-right">
                <h3>個股新聞</h3>
                <div class="news-list">
                    <NewsRow v-for="(news, idx) in newsDataList" 
                        :key="idx" 
                        :title="news.title" 
                        :content="news.content"
                        :timestamp="news.timestamp" 
                        :url="news.url" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import NewsRow from '../newsRow.vue';
import ProbCircle from '../Common/probCircle.vue';

// 工具 & 套件
import { ref, onMounted } from 'vue';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});


const newsDataList = ref([]);

async function callAnueNewsAPI(page = 1) {
    logger.debug(props.stockName);
    try {
        logger.func.start(callAnueNewsAPI, [page]);
        const response = await fetch(`https://ess.api.cnyes.com/ess/api/v1/news/keyword?q=${props.stockName}&limit=20&page=${page}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newsData = await response.json();
        newsData.value = newsData.data.items || [];
        newsDataList.value = newsData.value.map(item => ({
            title: item.title,
            content: item.summary,
            timestamp: item.publishAt,
            url: 'https://news.cnyes.com/news/id/' + item.newsId
        }));
        logger.func.success(callAnueNewsAPI, [page]);
    } catch (error) {
        logger.func.error(callAnueNewsAPI, [page]);
    }
}

onMounted(() => {
    callAnueNewsAPI();
});
</script>

<style scoped>
.analysis {
    flex: 1;
}

.analysis-container {
    display: flex;
    gap: 20px;
}

.analysis-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.news-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
}

@media (max-width: 1100px) {
    .analysis-container {
        flex-direction: column;
    }
}
</style>