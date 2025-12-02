<template>
    <div class="screen">
        <!-- 載入中 spinner -->
        <LoadingMask v-if="loading" />
        <Nav />
        <div class="main-content">
            <div>
                <Aside :selected="3" />
            </div>
            <div class="content">
                <PriceBar :stockId="stockId" @updateStockData="handleStockDataUpdate" />
                <WordCloud :stockId="stockId" @loading-start="onLoadingStart" @loading-end="onLoadingEnd" />
            </div>
        </div>
    </div>
</template>

<script setup>
// 組件
import Aside from '@/components/Common/Aside.vue';
import PriceBar from '@/components/Common/PriceBar.vue';
import LoadingMask from '@/components/Common/loadingMask.vue';
import Nav from '@/components/Common/Nav.vue';
import WordCloud from '@/components/wordCloud.vue';

// 工具 & 套件
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const stockId = computed(() => route.params.stock);
const stockName = ref('');
const loading = ref(false);

// Emits: 處理從 PriceBar 回傳的股票資料
function handleStockDataUpdate(data) {
    stockName.value = data.stockName;
}

// 監聽股票代碼變化
watch(
    () => route.params.stock,
    (newStock) => {
        logger.msg(`股票代碼變更: ${newStock}`);
    }
);

// Emits: 載入中狀態傳遞給子組件
function onLoadingStart() { loading.value = true }
function onLoadingEnd() { loading.value = false }

</script>

<style scoped>
@import '/src/assets/main.css';

.content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
}
</style>