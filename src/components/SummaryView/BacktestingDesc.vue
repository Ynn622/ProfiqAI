<template>
    <div>
        <div class="pill">回測依據</div>
        <div class="backtesting-desc">
            <p>回測依據是用來評估策略在歷史數據上的表現，幫助投資者了解策略的有效性。</p>
            <p>在這裡，您可以選擇不同的技術指標和顯示方式，以便更好地分析 K 線圖。</p>
        </div>
    </div>
</template>

<script setup>
</script>

<style scoped>
@import '/src/assets/main.css';

.backtesting-desc {
    padding: 14px 18px;
    margin-top: -5px;
    margin-left: 20px;
    border-radius: 20px;
    background: var(--card);
    box-shadow: var(--shadow);
}
</style>