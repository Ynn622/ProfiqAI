import { ref, computed } from 'vue'
import { 
  signInWithGoogle, 
  signInWithFacebook,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentUser,
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

// 計算屬性
const isLoggedIn = computed(() => user.value !== null)
const userName = computed(() => {
  if (!user.value) return ''
  return user.value.user_metadata?.full_name || 
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
  isLoading.value = true
  
  try {
    // 獲取當前用戶
    const { user: currentUser, error: fetchError } = await getCurrentUser()
    
    if (fetchError) {
      console.error('初始化用戶狀態失敗:', fetchError)
      error.value = fetchError
    } else {
      user.value = currentUser
    }
  } catch (err) {
    console.error('初始化 Auth Store 失敗:', err)
    error.value = err
  } finally {
    isLoading.value = false
  }

  // 監聽認證狀態變化
  onAuthStateChange((event, session) => {
    console.log('Auth 狀態變化:', event)
    user.value = session?.user || null
    
    if (event === 'SIGNED_IN') {
      console.log('用戶已登入:', user.value)
    } else if (event === 'SIGNED_OUT') {
      console.log('用戶已登出')
    }
  })
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
