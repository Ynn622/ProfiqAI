<template>
  <button :class="['btn-chat-ai', `${design}`]" @click="goChatBot">
    <i class="fa-solid fa-robot"></i>智聊AI
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
    design: {
        type: String,
        default: ''
    }
})

function goChatBot() {
    router.push({ name: 'chat-bot' });
}
</script>

<style scoped>

/* 智聊AI按鈕 */
.btn-chat-ai {
  padding: 16px 26px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #828fff, #8b5cf6);
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  background-size: 200% 100%;
  transition: background-position 0.5s ease, transform 0.3s ease;
}

.btn-chat-ai:hover {
  background-position: 100% 0;
  transform: scale(1.05);
}

.btn-chat-ai i {
  margin-right: 10px;
  font-size: 38px;
}

/* 小尺寸 */
.small {
  padding: 12px 20px;
  font-size: 20px;
}
.small i {
    font-size: 30px;
}

/* 緊湊尺寸 - 當搜尋欄展開時使用 */
.small.compact {
  padding: 6px 10px;
  font-size: 16px;
  height: auto;
  min-height: 30px;
}
.small.compact i {
    font-size: 24px;
    margin-right: 6px;
}

/* 平板樣式 */
@media (max-width: 1024px) and (min-width: 769px) {
    .btn-chat-ai {
        padding: 14px 22px;
        font-size: 22px;
    }
    
    .btn-chat-ai i {
        font-size: 34px;
        margin-right: 8px;
    }
    
    .small {
        padding: 10px 18px;
        font-size: 18px;
    }
    
    .small i {
        font-size: 26px;
    }
}

/* 桌面版樣式 */
@media (min-width: 1025px) {
    .btn-chat-ai {
        padding: 16px 26px;
        font-size: 24px;
    }
    
    .btn-chat-ai i {
        font-size: 38px;
        margin-right: 10px;
    }
    
    .small {
        padding: 12px 20px;
        font-size: 20px;
    }
    
    .small i {
        font-size: 30px;
    }
}
</style>