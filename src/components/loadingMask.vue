<template>
    <div class="loading-mask">
        <a-spin size="large"/>
        <div class="loading-message">
            載入中...
        </div>
    </div>
</template>

<script setup>
</script>

<style scoped>
.loading-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-message {
    font-size: 1rem;
    color: #1677ff;
    margin-top: 10px;
}
</style>