<template>
    <div class="main-top">
        <!-- 股票代號 + 名稱 -->
        <span class="stock-info">{{ stockId }} {{ stockName }}</span>

        <!-- 價格與漲跌 -->
        <span class="stock-price">
            目前價格：{{ stockPrice.price }}
            <span class="stock-change" :class="{ up: stockPrice.trend, down: !stockPrice.trend }">
                {{ stockPrice.trend ? '+' : '-' }}{{ stockPrice.change }}
                ({{ stockPrice.trend ? '▲' : '▼' }}{{ stockPrice.pct }}%)
            </span>
        </span>
        <span></span>

        <!-- 自選按鈕 -->
        <button class="watchlist-btn" @click="addToWatchlist"><i class="fa-solid fa-plus" />自選</button>
    </div>
</template>

<script setup>
const props = defineProps({
    stockId: { type: String, required: true },
    stockName: { type: String, default: '' },
    stockPrice: {
        type: Object,
        default: () => ({ price: 0, change: 0 ,pct: 0, trend: true })
    }
});

function addToWatchlist() {
    alert('已加入自選');
}
</script>

<style scoped>
.main-top {
    display: flex;
    width: 100%;
    padding: 10px 20px;
    margin-top: 5px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    height: 50px;
    align-items: center;
    justify-content: space-between;
    font-size: 24px;
}

.stock-info {
    font-weight: 900;
}

.stock-price {
    font-weight: 600;
    font-size: 20px;
}

.stock-change {
    color: var(--darkBull);
    font-weight: bold;
    font-size: 18px;
}

.stock-change.up {
    color: var(--darkBull);
}

.stock-change.down {
    color: var(--darkBear);
}

.watchlist-btn {
    padding: 5px 10px;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.5px;
    border-radius: 10px;
    cursor: pointer;
    background-color: lemonchiffon;
    border: 0.5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background 0.3s ease;
}
.watchlist-btn:hover {
    background-color: gold;
}

@media (max-width: 768px) {
    .main-top {
        flex-direction: column;
        align-items: flex-start;
        height: auto;
    }
}
</style>