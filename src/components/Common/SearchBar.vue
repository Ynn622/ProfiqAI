<template>
  <div class="search" :class="[design, { 'mobile-expanded': isMobileExpanded }]">
    <input
      type="text"
      id="input-stock-id"
      placeholder="輸入股票代碼…"
      v-model="stockId"
      @keyup.enter="searchStock"
    />
    <button 
      v-if="isMobileExpanded" 
      class="back-icon" 
      aria-label="返回" 
      @click="closeSearch"
    >
      <i class="fa-solid fa-arrow-left"></i>
    </button>
    <button class="icon" aria-label="搜尋" @click="searchStock">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
  </div>
  
</template>

<script setup>
// 工具 & 套件
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  design: { type: String, default: '' },
  isMobileExpanded: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close-search'])

const router = useRouter();
const stockId = ref('');

function searchStock() {
  if (!stockId.value) {
    alert('請輸入股票代碼!')
    return
  }
  logger.msg(`搜尋股票: ${stockId.value}`);
  router.push({ name: 'stock-summary', params: { stock: stockId.value } });
}

function closeSearch() {
  emit('close-search');
}
</script>

<style scoped>
/* 搜尋區塊 */
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-radius: 20px;
  padding: 10px 14px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  max-width: 560px;
  width: 100%;
  box-sizing: border-box;
}

.search.mobile-expanded {
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 16px;
  min-height: 40px;
  width: calc(100% - 75px - 10px);
}

.search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  background: transparent;
  margin-left: 10px;
  width: 100%;
}

.search.mobile-expanded input {
  font-size: 16px;
  margin-left: 8px;
}

.search .icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e9eef3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.search.mobile-expanded .icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

/* 返回按鈕 */
.back-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e9eef3;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.search.mobile-expanded .back-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
}

.home {
    width: 80vw;
}

/* 平板樣式 */
@media (max-width: 1024px) and (min-width: 769px) {
    .search {
        max-width: 400px;
        padding: 8px 12px;
        min-height: 40px;
    }
    
    .search input {
        font-size: 16px;
        margin-left: 8px;
    }
    
    .search .icon {
        width: 32px;
        height: 32px;
    }
    
    .back-icon {
        width: 32px;
        height: 32px;
    }
}

/* 桌面版樣式 */
@media (min-width: 1025px) {
    .search {
        max-width: 560px;
        padding: 10px 14px;
        min-height: 44px;
    }
    
    .search input {
        font-size: 18px;
        margin-left: 10px;
    }
    
    .search .icon {
        width: 36px;
        height: 36px;
    }
    
    .back-icon {
        width: 36px;
        height: 36px;
    }
}
</style>