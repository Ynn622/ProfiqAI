import { ref, computed } from 'vue'
import { 
  signInWithGoogle, 
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  resetPassword,
  updatePassword,
  updateUserProfile
} from './authService'

/**
 * Auth Store - 全域身份驗證狀態管理
 * 使用 Vue 3 Composition API 實作簡易 Store
 */

// 用戶狀態
const user = ref(null)
const isLoading = ref(true)
const error = ref(null)
let initPromise = null
let authStateSubscribed = false

// 計算屬性
const isLoggedIn = computed(() => user.value !== null)
const userName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.nickname ||
         user.value.user_metadata?.full_name || 
         user.value.user_metadata?.name || 
         user.value.email?.split('@')[0] || 
         '用戶'
})
const userAvatar = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.avatar_url || 
         user.value.user_metadata?.picture || 
         ''
})
const userEmail = computed(() => user.value?.email || '')

/**
 * 初始化 Auth Store
 * 檢查當前用戶狀態並設置監聽器
 */
export async function initAuthStore() {
  // 避免重複初始化
  if (initPromise) return initPromise

  initPromise = (async () => {
    isLoading.value = true

    try {
      // 先嘗試從本地恢復 Session（避免重整後短暫變成未登入）
      const { session } = await getSession()
      user.value = session?.user || null

      // 如果還沒有 user，再呼叫 getCurrentUser 做一次確認
      if (!user.value) {
        const { user: currentUser } = await getCurrentUser()
        user.value = currentUser
      }
    } catch (err) {
      console.error('初始化 Auth Store 失敗:', err)
      error.value = err
    } finally {
      isLoading.value = false
    }

    // 僅註冊一次狀態監聽
    if (!authStateSubscribed) {
      onAuthStateChange((event, session) => {
        console.log('Auth 狀態變化:', event)
        user.value = session?.user || null
      })
      authStateSubscribed = true
    }
  })()

  return initPromise
}

/**
 * Google 登入
 */
export async function handleGoogleLogin() {
  error.value = null
  const { error: loginError } = await signInWithGoogle()
  
  if (loginError) {
    error.value = loginError
    return { success: false, error: loginError }
  }
  
  return { success: true, error: null }
}

/**
 * Facebook 登入
 */
export async function handleFacebookLogin() {
  error.value = null
  const { error: loginError } = await signInWithFacebook()
  
  if (loginError) {
    error.value = loginError
    return { success: false, error: loginError }
  }
  
  return { success: true, error: null }
}

/**
 * Email 登入
 */
export async function handleEmailLogin(email, password) {
  error.value = null
  isLoading.value = true
  
  const { user: loggedInUser, error: loginError } = await signInWithEmail(email, password)
  
  isLoading.value = false
  
  if (loginError) {
    error.value = loginError
    return { success: false, error: loginError }
  }
  
  user.value = loggedInUser
  return { success: true, error: null }
}

/**
 * Email 註冊
 */
export async function handleEmailSignUp(email, password, metadata = {}) {
  error.value = null
  isLoading.value = true
  
  const { user: newUser, error: signUpError } = await signUpWithEmail(email, password, metadata)
  
  isLoading.value = false
  
  if (signUpError) {
    error.value = signUpError
    return { success: false, error: signUpError }
  }
  
  user.value = newUser
  return { success: true, error: null }
}

/**
 * 登出
 */
export async function handleLogout() {
  error.value = null
  isLoading.value = true
  
  const { error: logoutError } = await signOut()
  
  isLoading.value = false
  
  if (logoutError) {
    error.value = logoutError
    return { success: false, error: logoutError }
  }
  
  user.value = null
  return { success: true, error: null }
}

/**
 * 重設密碼
 */
export async function handleResetPassword(email) {
  error.value = null
  const { error: resetError } = await resetPassword(email)
  
  if (resetError) {
    error.value = resetError
    return { success: false, error: resetError }
  }
  
  return { success: true, error: null }
}

/**
 * 更新密碼
 */
export async function handleUpdatePassword(newPassword) {
  error.value = null
  const { error: updateError } = await updatePassword(newPassword)
  
  if (updateError) {
    error.value = updateError
    return { success: false, error: updateError }
  }
  
  return { success: true, error: null }
}

/**
 * 更新用戶資料
 */
export async function handleUpdateProfile(updates) {
  error.value = null
  const { user: updatedUser, error: updateError } = await updateUserProfile(updates)
  
  if (updateError) {
    error.value = updateError
    return { success: false, error: updateError }
  }
  
  user.value = updatedUser
  return { success: true, error: null }
}

// 導出狀態和方法
export function useAuthStore() {
  return {
    // 狀態
    user,
    isLoading,
    error,
    
    // 計算屬性
    isLoggedIn,
    userName,
    userAvatar,
    userEmail,
    
    // 方法
    initAuthStore,
    handleGoogleLogin,
    handleFacebookLogin,
    handleEmailLogin,
    handleEmailSignUp,
    handleLogout,
    handleResetPassword,
    handleUpdatePassword,
    handleUpdateProfile
  }
}
