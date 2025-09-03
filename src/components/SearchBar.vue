<template>
  <div class="search" :class="design">
    <input
      type="text"
      id="input-stock-id"
      placeholder="輸入股票代碼…"
      v-model="stockId"
      @keyup.enter="searchStock"
    />
    <button class="icon" aria-label="搜尋" @click="searchStock">
      <i class="fa-solid fa-magnifying-glass"></i>
    </button>
  </div>
  
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const stockId = ref('');

const props = defineProps({
  design: { type: String, default: '' },
})

function searchStock() {
  if (!stockId.value) {
    alert('請輸入股票代碼!')
    return
  }
  console.log('搜尋股票:', stockId.value)
  router.push({ name: 'stock-summary', params: { stock: stockId.value } });
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
}
.search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 600;
  background: transparent;
  margin-left: 10px;
}
.search .icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #e9eef3;
  cursor: pointer;
}

.home {
    width: 80vw;
}
</style>
