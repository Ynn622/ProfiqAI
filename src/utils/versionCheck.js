/**
 * 版本檢測工具
 * 定期檢查伺服器是否有新版本,提示使用者重新載入
 */

const VERSION_CHECK_INTERVAL = 10 * 60 * 1000 // 10 分鐘檢查一次
const VERSION_ENDPOINT = '/version.json'
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
let checkInterval = null
let notifiedVersion = null

/**
 * 讀取遠端版本資訊
 */
async function getRemoteVersionInfo() {
  try {
    const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })

    if (!response.ok) return null

    const data = await response.json()
    if (!data?.version) return null

    return data
  } catch (error) {
    console.warn('版本檢查失敗:', error)
    return null
  }
}

/**
 * 檢查是否有新版本
 */
async function checkForNewVersion() {
  // 開發模式不提示更新，避免本地開發時干擾
  if (import.meta.env.DEV) return false

  const remoteInfo = await getRemoteVersionInfo()
  if (!remoteInfo) return false

  if (remoteInfo.version !== APP_VERSION) {
    if (notifiedVersion === remoteInfo.version) return false

    notifiedVersion = remoteInfo.version
    console.warn(`檢測到新版本: ${APP_VERSION} -> ${remoteInfo.version}`)
    return true
  }

  return false
}

/**
 * 啟動版本檢查
 */
export function startVersionCheck(onNewVersion) {
  if (import.meta.env.DEV) return

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
  window.location.reload()
}
