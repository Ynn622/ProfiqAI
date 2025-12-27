import { supabase } from './supabase'

/**
 * Supabase Auth 服務
 * 提供完整的身份驗證功能
 */

/**
 * 使用 Google OAuth 登入
 * @returns {Promise<{error: Error | null}>}
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Google 登入失敗:', error)
    return { error }
  }
}

/**
 * 使用 Facebook OAuth 登入
 * @returns {Promise<{error: Error | null}>}
 */
export async function signInWithFacebook() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Facebook 登入失敗:', error)
    return { error }
  }
}

/**
 * 使用 Email 和密碼登入
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 * @returns {Promise<{user: Object | null, error: Error | null}>}
 */
export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Email 登入失敗:', error)
    return { user: null, error }
  }
}

/**
 * 使用 Email 註冊新帳號
 * @param {string} email - 電子郵件
 * @param {string} password - 密碼
 * @param {Object} metadata - 額外的用戶資料（如：userName）
 * @returns {Promise<{user: Object | null, error: Error | null}>}
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('註冊失敗:', error)
    return { user: null, error }
  }
}

/**
 * 登出
 * @returns {Promise<{error: Error | null}>}
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('登出失敗:', error)
    return { error }
  }
}

/**
 * 獲取當前用戶
 * @returns {Promise<{user: Object | null, error: Error | null}>}
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      // AuthSessionMissingError 表示未登入,這是正常狀態,不需要記錄錯誤
      if (error.name === 'AuthSessionMissingError') {
        return { user: null, error: null }
      }
      throw error
    }
    return { user, error: null }
  } catch (error) {
    // 只記錄非預期的錯誤
    if (error.name !== 'AuthSessionMissingError') {
      console.error('獲取用戶資料失敗:', error)
    }
    return { user: null, error: null }
  }
}

/**
 * 獲取當前 Session
 * @returns {Promise<{session: Object | null, error: Error | null}>}
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      // AuthSessionMissingError 表示未登入,這是正常狀態
      if (error.name === 'AuthSessionMissingError') {
        return { session: null, error: null }
      }
      throw error
    }
    return { session, error: null }
  } catch (error) {
    // 只記錄非預期的錯誤
    if (error.name !== 'AuthSessionMissingError') {
      console.error('獲取 Session 失敗:', error)
    }
    return { session: null, error: null }
  }
}

/**
 * 監聽認證狀態變化
 * @param {Function} callback - 狀態變化時的回調函數
 * @returns {Object} - 訂閱對象（可用於取消訂閱）
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

/**
 * 重設密碼（發送重設郵件）
 * @param {string} email - 電子郵件
 * @returns {Promise<{error: Error | null}>}
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('發送重設密碼郵件失敗:', error)
    return { error }
  }
}

/**
 * 更新密碼
 * @param {string} newPassword - 新密碼
 * @returns {Promise<{error: Error | null}>}
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('更新密碼失敗:', error)
    return { error }
  }
}

/**
 * 更新用戶資料
 * @param {Object} updates - 要更新的資料
 * @returns {Promise<{user: Object | null, error: Error | null}>}
 */
export async function updateUserProfile(updates) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    })
    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('更新用戶資料失敗:', error)
    return { user: null, error }
  }
}
