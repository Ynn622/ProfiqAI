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
      <i v-else class="fa-solid fa-user-circle default-avatar" :class="{ 'logged-in': isLoggedIn }"></i>
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
            <i v-else class="fa-solid fa-user-circle default-avatar-large logged-in"></i>
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

  <!-- 個人設定彈窗 (移到容器外) -->
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="showSettingsModal" class="modal-overlay" @click="closeSettingsModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>個人資料</h2>
            <button class="close-btn" @click="closeSettingsModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- 頭像區域 -->
            <div class="avatar-section">
              <div class="avatar-display">
                <img 
                  v-if="userAvatar" 
                  :src="userAvatar" 
                  alt="用戶頭像" 
                  class="avatar-image-xl"
                />
                <i v-else class="fa-solid fa-user-circle default-avatar-xl logged-in"></i>
              </div>
            </div>

            <!-- 名稱編輯區 -->
            <div class="form-group">
              <label>名稱 <i class="fa-solid fa-pen edit-icon"></i></label>
              <input 
                v-model="editableName"
                type="text" 
                class="form-input"
                placeholder="請輸入您的名稱"
                maxlength="50"
              />
            </div>

            <!-- 登入方式顯示 -->
            <div class="form-group">
              <label>登入方式</label>
              <div class="login-method">
                <i :class="loginMethodIcon"></i>
                {{ loginMethodText }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="modal-btn cancel" @click="closeSettingsModal">
              取消
            </button>
            <button class="modal-btn confirm" @click="saveSettings" :disabled="isSaving">
              <i v-if="isSaving" class="fa-solid fa-spinner fa-spin"></i>
              {{ isSaving ? '儲存中...' : '設定' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/utils/authStore'
import { message } from 'ant-design-vue'
import router from '@/router'

// 使用 Auth Store
const authStore = useAuthStore()
const { isLoggedIn, userName, userAvatar, user, handleGoogleLogin: googleLogin, handleFacebookLogin: facebookLogin, handleLogout: logout, handleUpdateProfile } = authStore

// 顯示面板狀態
const showPanel = ref(false)

// 個人設定彈窗狀態
const showSettingsModal = ref(false)
const editableName = ref('')
const isSaving = ref(false)

// 登入方式相關計算屬性
const loginMethodIcon = computed(() => {
  const provider = user.value?.app_metadata?.provider
  if (provider === 'google') return 'fa-brands fa-google'
  if (provider === 'facebook') return 'fa-brands fa-facebook'
  return 'fa-solid fa-envelope'
})

const loginMethodText = computed(() => {
  const provider = user.value?.app_metadata?.provider
  if (provider === 'google') return 'Google'
  if (provider === 'facebook') return 'FaceBook'
  return 'Email'
})

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
  router.push({ name: 'watchlist' })
}

// 處理導航到個人設定
function handleSettings() {
  closePanel()
  // 初始化編輯名稱為當前名稱
  editableName.value = userName.value
  showSettingsModal.value = true
}

// 關閉個人設定彈窗
function closeSettingsModal() {
  showSettingsModal.value = false
  editableName.value = ''
}

// 儲存個人設定
async function saveSettings() {
  // 驗證名稱
  if (!editableName.value.trim()) {
    message.warning('名稱不能為空')
    return
  }

  isSaving.value = true

  try {
    // 更新用戶資料到 Supabase
    const { success, error } = await handleUpdateProfile({
      nickname: editableName.value.trim()
    })

    if (success) {
      message.success('個人資料更新成功!')
      closeSettingsModal()
    } else {
      message.error(`更新失敗: ${error?.message || '未知錯誤'}`)
    }
  } catch (err) {
    console.error('儲存設定失敗:', err)
    message.error('儲存失敗,請稍後再試')
  } finally {
    isSaving.value = false
  }
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

.default-avatar.logged-in {
  color: #0b70f5;
}

.avatar-button:hover .default-avatar {
  color: #333;
}

.avatar-button:hover .default-avatar.logged-in {
  color: #0960d9;
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

.default-avatar-large.logged-in {
  color: #0b70f5;
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

/* 個人設定彈窗樣式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-display {
  position: relative;
}

.avatar-image-xl {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e0e0e0;
}

.default-avatar-xl {
  font-size: 120px;
  color: #666;
}

.default-avatar-xl.logged-in {
  color: #0b70f5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.edit-icon {
  font-size: 12px;
  color: #999;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #0b70f5;
  box-shadow: 0 0 0 3px rgba(11, 112, 245, 0.1);
}

.login-method {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 15px;
  color: #333;
}

.login-method i {
  font-size: 18px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.modal-btn {
  flex: 1;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-btn.cancel {
  background: white;
  color: #333;
  border: 1px solid #e0e0e0;
}

.modal-btn.cancel:hover:not(:disabled) {
  background: #f5f5f5;
}

.modal-btn.confirm {
  background: #0b70f5;
  color: white;
}

.modal-btn.confirm:hover:not(:disabled) {
  background: #0960d9;
}

/* 彈窗動畫 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: all 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* 響應式設計 - 彈窗 */
@media (max-width: 768px) {
  .modal-container {
    max-width: 90%;
  }

  .avatar-image-xl {
    width: 100px;
    height: 100px;
  }

  .default-avatar-xl {
    font-size: 100px;
  }
}
</style>
