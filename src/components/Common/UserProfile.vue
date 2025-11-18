<template>
  <div class="user-profile-container">
    <!-- 頭像按鈕 -->
    <div class="avatar-button" @click="togglePanel">
      <img 
        v-if="isLoggedIn && userAvatar" 
        :src="userAvatar" 
        alt="用戶頭像" 
        class="avatar-image"
      />
      <i v-else class="fa-solid fa-circle-user default-avatar"></i>
    </div>

    <!-- 下拉面板 -->
    <transition name="panel-fade">
      <div v-if="showPanel" class="dropdown-panel" :class="{ 'logged-in': isLoggedIn }">
        <!-- 未登入狀態 -->
        <div v-if="!isLoggedIn" class="panel-content login-panel">
          <div class="panel-header">
            <i class="fa-solid fa-circle-user default-avatar-large"></i>
            <div class="header-text">
              <h3>未登入</h3>
              <p>登入以啟用完整功能</p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="auth-buttons">
            <button class="auth-btn facebook" @click="handleFacebookLogin">
              <i class="fa-brands fa-facebook"></i>
              以 FaceBook 帳號登入
            </button>
            <button class="auth-btn google" @click="handleGoogleLogin">
              <i class="fa-brands fa-google"></i>
              以 Google 帳號登入
            </button>
          </div>
        </div>

        <!-- 已登入狀態 -->
        <div v-else class="panel-content profile-panel">
          <div class="panel-header">
            <img 
              v-if="userAvatar" 
              :src="userAvatar" 
              alt="用戶頭像" 
              class="avatar-image-large"
            />
            <i v-else class="fa-solid fa-circle-user default-avatar-large"></i>
            <div class="header-text">
              <h3>{{ userName }}</h3>
              <p class="user-badge">
                <i class="fa-solid fa-crown"></i>
                智聊用戶
              </p>
            </div>
          </div>

          <div class="divider"></div>

          <div class="menu-list">
            <div class="menu-item" @click="handleWatchlist">
              自選清單
            </div>
            <div class="menu-item" @click="handleSettings">
              個人設定
            </div>
            <div class="menu-item" @click="handleReferral">
              推薦朋友
            </div>
            <div class="divider"></div>
            <div class="menu-item logout" @click="handleLogout">
              登出
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 點擊外部關閉 -->
    <div 
      v-if="showPanel" 
      class="backdrop" 
      @click="closePanel"
    ></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/utils/authStore'
import { message } from 'ant-design-vue'
import router from '@/router'

// 使用 Auth Store
const authStore = useAuthStore()
const { isLoggedIn, userName, userAvatar, handleGoogleLogin: googleLogin, handleFacebookLogin: facebookLogin, handleLogout: logout } = authStore

// 顯示面板狀態
const showPanel = ref(false)

// 切換面板
function togglePanel() {
  showPanel.value = !showPanel.value
}

// 關閉面板
function closePanel() {
  showPanel.value = false
}

// 處理 Facebook 登入
async function handleFacebookLogin() {
  closePanel()
  
  const { success, error } = await facebookLogin()
  
  if (success) {
    message.success('正在跳轉到 Facebook 登入...')
  } else {
    message.error(`Facebook 登入失敗: ${error.message}`)
  }
}

// 處理 Google 登入
async function handleGoogleLogin() {
  closePanel()
  
  const { success, error } = await googleLogin()
  
  if (success) {
    message.success('正在跳轉到 Google 登入...')
  } else {
    message.error(`Google 登入失敗: ${error.message}`)
  }
}

// 處理登出
async function handleLogout() {
  closePanel()
  
  const { success, error } = await logout()
  
  if (success) {
    message.success('已成功登出')
    router.push({ name: 'home' })
  } else {
    message.error(`登出失敗: ${error.message}`)
  }
}

// 處理導航到自選清單
function handleWatchlist() {
  closePanel()
  message.info('自選清單功能開發中...')
  // TODO: 實作導航邏輯
  // router.push({ name: 'watchlist' })
}

// 處理導航到個人設定
function handleSettings() {
  closePanel()
  message.info('個人設定功能開發中...')
  // TODO: 實作導航邏輯
  // router.push({ name: 'settings' })
}

// 處理推薦朋友功能
async function handleReferral() {
  closePanel()
  
  const shareUrl = 'https://investchat.net/'
  const shareTitle = '投資智聊AI - 屬於您的股市顧問！'
  const shareText = '投資智聊AI - 屬於您的股市顧問！'

  // 檢查是否支援 Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      })
      message.success('分享成功!')
    } catch (error) {
      // 用戶取消分享或發生錯誤
      if (error.name !== 'AbortError') {
        console.error('分享失敗:', error)
        // 如果分享失敗,嘗試複製連結
        copyToClipboard(shareUrl)
      }
    }
  } else {
    // 不支援 Web Share API,使用複製連結
    copyToClipboard(shareUrl)
  }
}

// 複製連結到剪貼簿
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('連結已複製到剪貼簿!')
      })
      .catch(err => {
        console.error('複製失敗:', err)
        fallbackCopyToClipboard(text)
      })
  } else {
    fallbackCopyToClipboard(text)
  }
}

// 備用複製方法(相容舊版瀏覽器)
function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  
  try {
    const successful = document.execCommand('copy')
    if (successful) {
      message.success('連結已複製到剪貼簿!')
    } else {
      message.error('複製失敗,請手動複製: ' + text)
    }
  } catch (err) {
    console.error('複製失敗:', err)
    message.error('複製失敗,請手動複製: ' + text)
  }
  
  document.body.removeChild(textArea)
}
</script>

<style scoped>
.user-profile-container {
  position: relative;
  z-index: 1000;
}

/* 頭像按鈕 */
.avatar-button {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.avatar-button:hover {
  transform: scale(1.05);
}

.default-avatar {
  font-size: 50px;
  color: #666;
  transition: color 0.2s ease;
}

.avatar-button:hover .default-avatar {
  color: #333;
}

.avatar-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
  transition: border-color 0.2s ease;
}

.avatar-button:hover .avatar-image {
  border-color: #999;
}

/* 背景遮罩 */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: transparent;
}

/* 下拉面板 */
.dropdown-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow: hidden;
}

/* 面板內容 */
.panel-content {
  padding: 20px;
}

/* 面板頭部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.default-avatar-large {
  font-size: 60px;
  color: #666;
}

.avatar-image-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.header-text h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: left;
}

.header-text p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #666;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #0b70f5 !important;
}

.user-badge i {
  font-size: 14px;
}

/* 分隔線 */
.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 15px 0;
}

/* 登入按鈕 */
.auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-btn i {
  font-size: 18px;
}

.auth-btn.facebook {
  background: #1877f2;
  color: white;
}

.auth-btn.facebook:hover {
  background: #166fe5;
}

.auth-btn.google {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.auth-btn.google:hover {
  background: #f5f5f5;
}

/* 選單列表 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  padding: 12px 15px;
  font-size: 15px;
  color: #333;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.logout {
  color: #ef4444;
  font-weight: 500;
}

.menu-item.logout:hover {
  background: #fee;
}

/* 過渡動畫 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.2s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .dropdown-panel {
    width: 280px;
    right: -10px;
  }

  .default-avatar {
    font-size: 40px;
  }

  .avatar-image {
    width: 40px;
    height: 40px;
  }
}
</style>
