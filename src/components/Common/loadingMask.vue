<template>
    <div :class="wrapperClass">
        <a-spin size="large" />
        <div class="loading-message">
            {{ props.loadingText }}
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { computed } from 'vue';

const props = defineProps({
    type: {
        type: String,
        default: 'full', // full | small
        validator: (value) => ['full', 'small'].includes(value)
    },
    loadingText: {
        type: String,
        default: '載入中...'
    }
})

const wrapperClass = computed(() => {
    return props.type === 'full'
        ? 'loading-mask loading-full'
        : 'loading-mask loading-small'
})
</script>

<style scoped>
.loading-mask {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.loading-full {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    z-index: 999;
}

.loading-small {
    width: 100%;
    height: 100%;
    background: rgba(233, 233, 233, 0.4);
    backdrop-filter: blur(1px);   /* 加一點點毛玻璃感 */
    border-radius: 10px;
}

.loading-message {
    font-size: 1rem;
    color: #1677ff;
    margin-top: 10px;
}

@media (max-width: 768px) {
    .loading-full {
        top: 60px; /* 考慮到手機頂部導覽列 */
    }
}
</style>