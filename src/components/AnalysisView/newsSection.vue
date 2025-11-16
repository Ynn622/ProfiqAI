<template>
    <div class="analysis">
        <div class="analysis-container">
            <div class="analysis-left">
                <h3>消息面分析</h3>
                <ProbCircle :score="-1" />
            </div>
            <div class="analysis-right">
                <h3>個股新聞</h3>
                <LoadingMask v-if="loading" type="small"/>
                <div v-else-if="!newsDataList.length" class="no-data">截取新聞失敗，請稍後再試！</div>
                <div v-else class="news-list">
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
import LoadingMask from '../Common/loadingMask.vue';

// 工具 & 套件
import { ref, onMounted } from 'vue';
import { callAPI } from '@/utils/apiConfig.js';
import { logger } from '@/utils/logger';

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
const loading = ref(false);

/** 
 * API: 取得新聞摘要資料
 */
async function callNewsAPI(page = 1) {
    logger.debug(props.stockName);
    try {
        const response = await callAPI({
            url: '/news/summary',
            params: { stock_id: props.stockId, page: page },
            funcName: 'callNewsAPI'
        });

        response.value = response.news || [];
        newsDataList.value = response.value.map(item => ({
            title: item.Title,
            summary: item.Summary,
            timestamp: item.TimeStamp,
            url: item.Url,
            source: newsProvider[item.Source]
        }));
    } catch (error) {
        // 錯誤已經在 callAPI 中記錄
    }
}

onMounted(async () => {
    loading.value = true;
    await callNewsAPI();
    loading.value = false;
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

.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
    font-size: 16px;
}

@media (max-width: 1100px) {
    .analysis-container {
        flex-direction: column;
    }
}
</style>