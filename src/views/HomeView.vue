<template>
  <div class="screen">
    <!-- 背景圖 -->
    <div class="bg-chart" style="background-image: url('KChart.png')" />

    <!-- 頂端按鈕 -->
    <header class="topbar">
      <UserProfile />
    </header>

    <!-- 主內容 -->
    <section class="main-section">
      <img class="logo-img" src="/logo.png" alt="AI 投資智聊 logo" />

      <h1>個股全面向健檢，快速搜出好股！</h1>
      <SearchBar design="home" />

      <!-- 功能介紹區 -->
      <div class="function">
        <div
          v-for="item in functions"
          :key="item.title"
          class="function-item"
        >
          <i :class="item.icon"></i>
          <span>{{ item.title }}</span>
          <div class="tooltip">{{ item.desc }}</div>
        </div>
      </div>

      <chat-bot-btn />
    </section>
  </div>
</template>

<script setup>
import SearchBar from '@/components/Common/SearchBar.vue'
import chatBotBtn from '@/components/Button/ChatBotButton.vue'
import UserProfile from '@/components/Common/UserProfile.vue'

// Tooltip + icon data
const functions = [
  {
    title: '股票速覽',
    icon: 'fa-solid fa-chart-column',
    desc: '提供即時股價、K 線圖、股價預測功能。'
  },
  {
    title: '分析儀表',
    icon: 'fa-solid fa-gauge',
    desc: '以股市 4 面向健檢，快速了解個股狀況。'
  },
    {
    title: '新聞股雲',
    icon: 'fa-solid fa-link',
    desc: '整合最新財經新聞，並以文字雲呈現關鍵資訊。'
  }
]
</script>

<style scoped>
@import '/src/assets/main.css';

/* 🩵 全域背景 */
.screen {
  position: relative;
  text-align: center;
  min-height: 100vh;
}
.bg-chart {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  pointer-events: none;
  z-index: 0;
}

/* 🧭 頂端登入註冊 */
.topbar {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
}

/* 📈 主內容 */
.main-section {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 100vh;
}
.logo-img {
  width: 160px;
  border-radius: 10%;
  transition: transform 0.3s ease;
}
.logo-img:hover {
  transform: scale(1.05);
}
h1 {
  font-size: 34px;
  font-weight: 800;
  color: #0f172a;
}

/* ⚙️ 功能區塊 */
.function {
  display: flex;
  gap: 70px;
  margin: 20px 0;
}
.function-item {
  position: relative;
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  color: #0f172a;
  cursor: pointer;
}
.function-item i {
  font-size: 38px;
}

/* 💬 Tooltip */
.tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.9rem;
  width: 240px;
  max-width: 85vw;
  line-height: 1.5;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s ease;
  pointer-events: none;
  z-index: 10;
  white-space: normal;
  word-wrap: break-word;
}
.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}
.function-item:hover .tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-6px);
}

@media (max-width: 480px) {
  h1 {
    font-size: 24px;
  }

  .logo-img {
    max-width: 140px;
  }

  .function {
    gap: 50px;
    padding: 0 10px;
  }

  .function-item {
    font-size: 16px;
  }

  .function-item i {
    font-size: 32px;
  }

  .tooltip {
    font-size: 0.85rem;
    padding: 8px 12px;
    width: auto;
    min-width: 180px;
    max-width: 90vw;
  }
}
</style>