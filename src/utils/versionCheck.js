/**
 * 版本檢測工具
 * 定期檢查伺服器是否有新版本,提示使用者重新載入
 */

const VERSION_CHECK_INTERVAL = 10 * 60 * 1000 // 10 分鐘檢查一次
const VERSION_KEY = 'app_version_hash'
let checkInterval = null

/**
 * 取得當前版本 hash (從 index.html 的 meta 標籤或 JS bundle 名稱)
 */
async function getCurrentVersion() {
  try {
    const response = await fetch('/', { 
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' }
    })
    const html = await response.text()
    
    // 從 HTML 中提取 JS bundle 的 hash
    const match = html.match(/index-([a-zA-Z0-9_-]+)\.js/)
    return match ? match[1] : null
  } catch (error) {
    console.warn('版本檢查失敗:', error)
    return null
  }
}

/**
 * 檢查是否有新版本
 */
async function checkForNewVersion() {
  const currentVersion = await getCurrentVersion()
  if (!currentVersion) return false
  
  const savedVersion = localStorage.getItem(VERSION_KEY)
  
  if (savedVersion && savedVersion !== currentVersion) {
    console.warn('🔄 檢測到新版本，建議重新載入')
    return true
  }
  
  // 儲存當前版本
  if (!savedVersion) {
    localStorage.setItem(VERSION_KEY, currentVersion)
  }
  
  return false
}

/**
 * 啟動版本檢查
 */
export function startVersionCheck(onNewVersion) {
  // 立即檢查一次
  checkForNewVersion().then(hasNewVersion => {
    if (hasNewVersion && onNewVersion) {
      onNewVersion()
    }
  })
  
  // 定期檢查
  if (checkInterval) clearInterval(checkInterval)
  
  checkInterval = setInterval(async () => {
    const hasNewVersion = await checkForNewVersion()
    if (hasNewVersion && onNewVersion) {
      onNewVersion()
    }
  }, VERSION_CHECK_INTERVAL)
}

/**
 * 停止版本檢查
 */
export function stopVersionCheck() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

/**
 * 強制重新載入 (清除所有快取)
 */
export function forceReload() {
  localStorage.removeItem(VERSION_KEY)
  sessionStorage.clear()
  window.location.reload()
}
