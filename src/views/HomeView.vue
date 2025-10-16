<template>
  <div class="screen">

    <div class="bg-chart" style="background-image: url('KChart.png')" />
    <header class="topbar">
      <nav class="auth">
        <button class="auth-btn sign-up" @click="commingSoon">註冊</button>
        <button class="auth-btn login" @click="commingSoon">登入</button>
      </nav>
    </header>

    <section class="main-section">
      <div class="logo-wrap">
        <img class="logo-img" src="/logo.png" alt="AI 投資智聊 logo" />
      </div>

      <h1>個股全面向健檢，快速搜出好股！</h1>

      <SearchBar design="home" />

      <div class="function">
        <div class="function-item">
          <i class="fa-solid fa-chart-column"></i>
          <span>股票速覽</span>
        </div>
        <div class="function-item">
          <i class="fa-solid fa-gauge"></i>
          <span>分析儀表</span>
        </div>
        <div class="function-item">
          <i class="fa-solid fa-cloud"></i>
          <span>新聞股雲</span>
        </div>
      </div>

      <chat-bot-btn />
    </section>

  </div>
</template>

<script setup>

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import chatBotBtn from '@/components/Button/ChatBotButton.vue';
import SearchBar from '@/components/Common/SearchBar.vue'

const stockId = ref('');
const router = useRouter();

function commingSoon() {
  alert("此功能尚未開放，敬請期待！");
}


</script>

<style scoped>
@import '/src/assets/main.css';

/* 全視窗 */
.bg-chart {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  pointer-events: none;
}

/* 頂端列 */
.topbar {
  z-index: 2;
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
/* 登入區塊 */
.auth { 
  display: flex; 
  gap: 20px; 
}

.auth-btn {
  font-size: 18px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.08);
  background: rgba(255,255,255,0.7);
  backdrop-filter: saturate(120%) blur(6px);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.auth-btn.login {
  background: #fff;
}
.auth-btn.sign-up {
  background: rgba(255,255,255,0.35);
}

/* 主要內容區 */
.main-section {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}

/* logo區塊 */
.logo-wrap {
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
}
.logo-img {
  max-width: 160px;
  height: auto;
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

/* 功能區塊 */
.function {
  display: flex;
  margin: 20px 0;
  gap: 70px;
}

.function-item {
  display: flex;
  flex-flow: column;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  color: #0f172a;
}

.function-item i {
  font-size: 38px;
}

@media (max-width: 480px) {
  h1 { 
    font-size: 24px; 
  }
  .logo-img {
    max-width: 140px;
  }
}

</style>