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
                        :summary="news.summary"
                        :timestamp="news.timestamp" 
                        :url="news.url"
                        :source="news.source"
                        />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import NewsRow from '../newsRow.vue';
import ProbCircle from '../Common/probCircle.vue';
import { API_BASE_URL } from '@/utils/apiConfig.js';

// 工具 & 套件
import { ref, onMounted } from 'vue';

// Props
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, required: true }
});

const newsProvider = {
    'udn': '聯合新聞網',
    'cnyes': '鉅亨網'
}

const newsDataList = ref([]);

async function callNewsAPI(page = 1) {
    logger.debug(props.stockName);
    try {
        logger.func.start(callNewsAPI, [page]);
        const response = await fetch(`${API_BASE_URL}/View/news/summary?stockID=${props.stockId}&page=${page}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newsData = await response.json();
        newsData.value = newsData.news || [];
        newsDataList.value = newsData.value.map(item => ({
            title: item.Title,
            summary: item.Summary,
            timestamp: item.TimeStamp,
            url: item.Url,
            source: newsProvider[item.Source]
        }));
        logger.func.success(callNewsAPI, [page]);
    } catch (error) {
        logger.func.error(callNewsAPI, [page]);
        logger.error('個股新聞 API 錯誤:', error);
    }
}

onMounted(() => {
    callNewsAPI();
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