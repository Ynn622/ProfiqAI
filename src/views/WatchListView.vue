<template>
  <div class="screen">
    <!-- 載入中 spinner -->
    <LoadingMask v-if="loading" />
    <Nav :show-menu="false" />
    <div class="main-content">
      <div class="layout-container">
        <!-- 左側：自選股清單區 -->
        <div class="watchlist-section">
          <div class="section-content">
            <!-- 群組選擇器（左側） -->
            <div class="group-selector">
              <div v-for="group in watchlistData" :key="group.groupId" class="group-tab"
                :class="{ active: selectedGroupId === group.groupId }" @click="selectGroup(group.groupId)">
                {{ group.groupName }}
              </div>
            </div>

            <!-- 股票列表（表格） -->
            <div class="stocks-panel">
              <table class="stocks-table">
                <thead>
                  <tr>
                    <th class="stock-col">個股</th>
                    <th>股價</th>
                    <th>基本面</th>
                    <th>技術面</th>
                    <th>籌碼面</th>
                    <th>消息面</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stock in currentStocks" :key="stock.code" class="stock-row" @click="goToStock(stock.code)">
                    <td class="stock-cell">
                      <div class="stock-info">
                        <span class="stock-code">{{ stock.code }}</span>
                        <span class="stock-name">{{ stock.name }}</span>
                      </div>
                    </td>
                    <td class="price-cell">{{ stock.price }}</td>
                    <td class="tag-cell">
                      <span class="tag" :class="getTagClass(stock.tags[0])">
                        {{ stock.tags[0] }}
                      </span>
                    </td>
                    <td class="tag-cell">
                      <span class="tag" :class="getTagClass(stock.tags[1])">
                        {{ stock.tags[1] }}
                      </span>
                    </td>
                    <td class="tag-cell">
                      <span class="tag" :class="getTagClass(stock.tags[2])">
                        {{ stock.tags[2] }}
                      </span>
                    </td>
                    <td class="tag-cell">
                      <span class="tag" :class="getTagClass(stock.tags[3])">
                        {{ stock.tags[3] }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 右側：股票健檢區 -->
        <div class="health-check-section">
          <h3 class="section-title"><i class="fa-solid fa-briefcase-medical"></i> 股票健檢</h3>
          <div class="health-markdown" v-html="healthCheckHtml"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 組件
import LoadingMask from '@/components/Common/loadingMask.vue';
import Nav from '@/components/Common/Nav.vue';

// 工具 & 套件
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import watchlistDataJson from '@/data/watchlistData.json';
import { processMarkdown } from '@/utils/markdownParser';

const router = useRouter();
const loading = ref(false);
const selectedGroupId = ref(1);

// 從 JSON 載入資料
const watchlistData = ref(watchlistDataJson);

// 當前選中的群組
const currentGroup = computed(() => {
  return watchlistData.value.find(g => g.groupId === selectedGroupId.value) || watchlistData.value[0];
});

// 當前群組的股票列表
const currentStocks = computed(() => {
  return currentGroup.value.stocks;
});

const healthCheckHtml = computed(() => processMarkdown(currentGroup.value.healthCheck || ''));

// 選擇群組
function selectGroup(groupId) {
  selectedGroupId.value = groupId;
}

// 導航到股票頁面
function goToStock(stockCode) {
  router.push({ name: 'stock-summary', params: { stock: stockCode } });
}

// 獲取標籤樣式
function getTagClass(tag) {
  if (tag === '偏多') return 'tag-bullish';
  if (tag === '偏空') return 'tag-bearish';
  return 'tag-neutral';
}

onMounted(() => {
  // 未來這裡會呼叫 API 獲取真實資料
  loading.value = false;
});
</script>

<style scoped>
@import '/src/assets/main.css';

/* 主佈局容器 */
.layout-container {
  padding: 0.9rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  width: 100%;
  min-height: 100dvh;
}

/* 左側：自選股清單區 */
.watchlist-section {
  background: #e8ecef;
  border-radius: 12px;
  overflow: hidden;
}

.section-content {
  display: flex;
  height: 100%;
}

/* 群組選擇器 */
.group-selector {
  width: 130px;
  background: #d4d9dd;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
}

.group-tab {
  padding: 1rem 0.8rem;
  background: #e8ecef;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
}

.group-tab:hover {
  background: #f0f3f5;
}

.group-tab.active {
  background: white;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 股票面板 - 表格樣式 */
.stocks-panel {
  flex: 1;
  background: white;
  overflow: auto;
}

.stocks-table {
  width: 100%;
  border-collapse: collapse;
}

.stocks-table thead {
  background: #f5f7f9;
  position: sticky;
  top: 0;
  z-index: 10;
}

.stocks-table th {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 1.05rem;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.stocks-table tbody tr {
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.stocks-table tbody tr:hover {
  background: #f8f9fa;
}

.stocks-table td {
  padding: 1rem;
  vertical-align: middle;
  text-align: center;
}

.stock-cell {
  min-width: 120px;
  text-align: left;
}

.stock-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.stock-code {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.stock-name {
  color: #666;
  font-size: 0.95rem;
}

.price-cell {
  font-weight: 600;
  color: #333;
  font-size: 1.05rem;
  text-align: center;
}

.tag-cell {
  text-align: center;
}

.stock-col {
  text-align: left;
}

/* 標籤 */
.tag {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.tag-bullish {
  background: #ffcdd2;
  color: #c62828;
}

.tag-bearish {
  background: #c8e6c9;
  color: #2e7d32;
}

.tag-neutral {
  background: #e0e0e0;
  color: #666;
}

/* 右側：股票健檢區 */
.health-check-section {
  background: #e8f4f8;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 100dvh;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #b3d9e6;
}

.health-markdown {
  color: #555;
  line-height: 1.7;
}

.health-markdown h1,
.health-markdown h2,
.health-markdown h3,
.health-markdown h4 {
  color: #333;
  margin: 0.5rem 0;
}

.health-markdown ul {
  margin: 0.6rem 0 0.6rem 1.2rem;
}

.health-markdown li {
  margin-bottom: 0.4rem;
}

/* 響應式設計 - 當寬度不足時改為上下排版 */
@media (max-width: 1200px) {
  .layout-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .watchlist-section {
    min-height: 400px;
  }

  .health-check-section {
    max-height: none;
  }
}

/* 更小螢幕 - 調整表格顯示 */
@media (max-width: 900px) {
  .stocks-table th,
  .stocks-table td {
    padding: 0.8rem 0.5rem;
    font-size: 0.85rem;
  }

  .tag {
    padding: 0.3rem 0.7rem;
    font-size: 0.8rem;
  }

  .stock-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
}

/* 手機版 - 群組選擇器改為橫向 */
@media (max-width: 768px) {
  .layout-container {
      padding: 0;
    }

  .section-content {
    flex-direction: column;
  }

  .group-selector {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    padding: 0.5rem;
  }

  .group-tab {
    min-width: 80px;
  }

  /* 簡化表格在手機上的顯示 */
  .stocks-table {
    font-size: 0.85rem;
  }

  .stocks-table th,
  .stocks-table td {
    padding: 0.6rem 0.4rem;
  }

  .stock-code {
    font-size: 0.9rem;
  }

  .stock-name {
    font-size: 0.8rem;
  }
}
</style>
