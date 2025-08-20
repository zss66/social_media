/**
 * 平台检测和环境工具
 */

/**
 * 检测是否在 Electron 环境中运行
 */
export function isElectron() {
  return !!(window && window.process && window.process.type)
}

/**
 * 检测是否在开发环境
 */
export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * 检测是否在生产环境
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * 获取操作系统类型
 */
export function getOSType() {
  if (window.platformAPI) {
    return {
      platform: window.platformAPI.platform,
      arch: window.platformAPI.arch,
      isWindows: window.platformAPI.isWindows,
      isMac: window.platformAPI.isMac,
      isLinux: window.platformAPI.isLinux
    }
  }
  
  const userAgent = navigator.userAgent.toLowerCase()
  const platform = navigator.platform.toLowerCase()
  
  if (userAgent.includes('win') || platform.includes('win')) {
    return { platform: 'win32', isWindows: true, isMac: false, isLinux: false }
  } else if (userAgent.includes('mac') || platform.includes('mac')) {
    return { platform: 'darwin', isWindows: false, isMac: true, isLinux: false }
  } else if (userAgent.includes('linux') || platform.includes('linux')) {
    return { platform: 'linux', isWindows: false, isMac: false, isLinux: true }
  }
  
  return { platform: 'unknown', isWindows: false, isMac: false, isLinux: false }
}

/**
 * 检测浏览器类型和版本
 */
export function getBrowserInfo() {
  const userAgent = navigator.userAgent
  let browser = 'unknown'
  let version = 'unknown'
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge') && !userAgent.includes('OPR')) {
    browser = 'chrome'
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Firefox')) {
    browser = 'firefox'
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'safari'
    const match = userAgent.match(/Version\/(\d+\.\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('Edge')) {
    browser = 'edge'
    const match = userAgent.match(/Edge\/(\d+\.\d+)/)
    if (match) version = match[1]
  } else if (userAgent.includes('OPR')) {
    browser = 'opera'
    const match = userAgent.match(/OPR\/(\d+\.\d+)/)
    if (match) version = match[1]
  }
  
  return { browser, version, userAgent }
}

/**
 * 检测设备类型
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent
  let deviceType = 'desktop'
  let isMobile = false
  let isTablet = false
  
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    isMobile = true
    deviceType = 'mobile'
  }
  
  if (/iPad|Android(?=.*Tablet)|Tablet/i.test(userAgent)) {
    isTablet = true
    deviceType = 'tablet'
  }
  
  return {
    deviceType,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    touchScreen: 'ontouchstart' in window,
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
  }
}

/**
 * 检测网络类型
 */
export function getNetworkInfo() {
  const connection = navigator.connection || 
                   navigator.mozConnection || 
                   navigator.webkitConnection
  
  if (connection) {
    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    }
  }
  
  return {
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  }
}

/**
 * 检测支持的功能
 */
export function getSupportedFeatures() {
  return {
    // Web APIs
    serviceWorker: 'serviceWorker' in navigator,
    webGL: !!window.WebGLRenderingContext,
    webGL2: !!window.WebGL2RenderingContext,
    webRTC: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
    geolocation: 'geolocation' in navigator,
    deviceMotion: 'DeviceMotionEvent' in window,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    
    // Storage
    localStorage: (() => {
      try {
        return 'localStorage' in window && window.localStorage !== null
      } catch {
        return false
      }
    })(),
    sessionStorage: (() => {
      try {
        return 'sessionStorage' in window && window.sessionStorage !== null
      } catch {
        return false
      }
    })(),
    indexedDB: 'indexedDB' in window,
    webSQL: 'openDatabase' in window,
    
    // Media
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    mediaRecorder: 'MediaRecorder' in window,
    audioContext: !!(window.AudioContext || window.webkitAudioContext),
    
    // Network
    fetch: 'fetch' in window,
    websocket: 'WebSocket' in window,
    
    // Notification
    notification: 'Notification' in window,
    pushManager: 'serviceWorker' in navigator && 'PushManager' in window,
    
    // Clipboard
    clipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
    
    // File APIs
    fileReader: 'FileReader' in window,
    formData: 'FormData' in window,
    dragDrop: 'draggable' in document.createElement('div'),
    
    // Graphics
    canvas: !!document.createElement('canvas').getContext,
    svg: !!(document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect),
    
    // CSS Features
    cssVariables: CSS.supports('color', 'var(--test)'),
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    
    // Performance
    performanceObserver: 'PerformanceObserver' in window,
    requestIdleCallback: 'requestIdleCallback' in window,
    intersectionObserver: 'IntersectionObserver' in window,
    
    // Security
    crypto: !!(window.crypto && window.crypto.subtle),
    
    // Electron specific
    electronAPI: !!window.electronAPI,
    nodeIntegration: !!window.process
  }
}

/**
 * 检测性能信息
 */
export function getPerformanceInfo() {
  const memory = performance.memory
  const timing = performance.timing
  const navigation = performance.navigation
  
  return {
    // 内存信息（Chrome）
    memory: memory ? {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    } : null,
    
    // 导航时间
    timing: timing ? {
      navigationStart: timing.navigationStart,
      domContentLoadedEventStart: timing.domContentLoadedEventStart,
      domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
      loadEventStart: timing.loadEventStart,
      loadEventEnd: timing.loadEventEnd,
      domComplete: timing.domComplete
    } : null,
    
    // 导航类型
    navigation: navigation ? {
      type: navigation.type,
      redirectCount: navigation.redirectCount
    } : null,
    
    // 当前时间
    now: performance.now(),
    
    // 时间原点
    timeOrigin: performance.timeOrigin || performance.timing?.navigationStart
  }
}

/**
 * 检测安全上下文
 */
export function getSecurityInfo() {
  return {
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    isHTTPS: window.location.protocol === 'https:',
    origin: window.location.origin,
    crossOriginIsolated: window.crossOriginIsolated || false
  }
}

/**
 * 获取用户代理信息
 */
export function getUserAgentInfo() {
  const parser = new UAParser()
  const result = parser.getResult()
  
  return {
    browser: result.browser,
    device: result.device,
    engine: result.engine,
    os: result.os,
    cpu: result.cpu,
    ua: result.ua
  }
}

/**
 * 简单的 User Agent 解析器（如果没有外部库）
 */
class UAParser {
  constructor(uastring) {
    this.ua = uastring || navigator.userAgent
  }
  
  getResult() {
    return {
      ua: this.ua,
      browser: this.getBrowser(),
      device: this.getDevice(),
      engine: this.getEngine(),
      os: this.getOS(),
      cpu: this.getCPU()
    }
  }
  
  getBrowser() {
    const ua = this.ua
    if (ua.includes('Chrome')) return { name: 'Chrome', version: this.extractVersion(ua, /Chrome\/(\d+\.\d+)/) }
    if (ua.includes('Firefox')) return { name: 'Firefox', version: this.extractVersion(ua, /Firefox\/(\d+\.\d+)/) }
    if (ua.includes('Safari')) return { name: 'Safari', version: this.extractVersion(ua, /Version\/(\d+\.\d+)/) }
    if (ua.includes('Edge')) return { name: 'Edge', version: this.extractVersion(ua, /Edge\/(\d+\.\d+)/) }
    return { name: 'Unknown', version: '' }
  }
  
  getOS() {
    const ua = this.ua
    if (ua.includes('Windows')) return { name: 'Windows', version: this.extractVersion(ua, /Windows NT (\d+\.\d+)/) }
    if (ua.includes('Mac OS')) return { name: 'macOS', version: this.extractVersion(ua, /Mac OS X (\d+[._]\d+)/) }
    if (ua.includes('Linux')) return { name: 'Linux', version: '' }
    if (ua.includes('Android')) return { name: 'Android', version: this.extractVersion(ua, /Android (\d+\.\d+)/) }
    if (ua.includes('iOS')) return { name: 'iOS', version: this.extractVersion(ua, /OS (\d+_\d+)/) }
    return { name: 'Unknown', version: '' }
  }
  
  getDevice() {
    const ua = this.ua
    if (ua.includes('Mobile')) return { type: 'mobile', vendor: '', model: '' }
    if (ua.includes('Tablet')) return { type: 'tablet', vendor: '', model: '' }
    return { type: 'desktop', vendor: '', model: '' }
  }
  
  getEngine() {
    const ua = this.ua
    if (ua.includes('Gecko')) return { name: 'Gecko', version: this.extractVersion(ua, /rv:(\d+\.\d+)/) }
    if (ua.includes('WebKit')) return { name: 'WebKit', version: this.extractVersion(ua, /WebKit\/(\d+\.\d+)/) }
    if (ua.includes('Trident')) return { name: 'Trident', version: this.extractVersion(ua, /Trident\/(\d+\.\d+)/) }
    return { name: 'Unknown', version: '' }
  }
  
  getCPU() {
    const ua = this.ua
    if (ua.includes('x86_64') || ua.includes('x64')) return { architecture: 'amd64' }
    if (ua.includes('x86') || ua.includes('i386')) return { architecture: 'ia32' }
    if (ua.includes('ARM')) return { architecture: 'arm' }
    return { architecture: 'unknown' }
  }
  
  extractVersion(ua, regex) {
    const match = ua.match(regex)
    return match ? match[1] : ''
  }
}

/**
 * 获取完整的系统信息
 */
export function getSystemInfo() {
  return {
    os: getOSType(),
    browser: getBrowserInfo(),
    device: getDeviceInfo(),
    network: getNetworkInfo(),
    features: getSupportedFeatures(),
    performance: getPerformanceInfo(),
    security: getSecurityInfo(),
    userAgent: getUserAgentInfo(),
    timestamp: new Date().toISOString(),
    isElectron: isElectron(),
    isDevelopment: isDevelopment()
  }
}

/**
 * 检测是否支持某个功能
 * @param {string} feature - 功能名称
 * @returns {boolean} 是否支持
 */
export function isFeatureSupported(feature) {
  const features = getSupportedFeatures()
  return features[feature] || false
}

/**
 * 设置平台检测
 */
export function setupPlatformDetection() {
  // 设置 CSS 类名以便样式适配
  const { isWindows, isMac, isLinux } = getOSType()
  const { deviceType } = getDeviceInfo()
  const { browser } = getBrowserInfo()
  
  const htmlElement = document.documentElement
  
  // 操作系统类名
  if (isWindows) htmlElement.classList.add('os-windows')
  if (isMac) htmlElement.classList.add('os-mac')
  if (isLinux) htmlElement.classList.add('os-linux')
  
  // 设备类型类名
  htmlElement.classList.add(`device-${deviceType}`)
  
  // 浏览器类名
  htmlElement.classList.add(`browser-${browser}`)
  
  // Electron 环境类名
  if (isElectron()) {
    htmlElement.classList.add('electron')
  } else {
    htmlElement.classList.add('web')
  }
  
  // 触摸设备类名
  if ('ontouchstart' in window) {
    htmlElement.classList.add('touch')
  } else {
    htmlElement.classList.add('no-touch')
  }
  
  // 在控制台输出系统信息（开发环境）
  if (isDevelopment()) {
    console.group('🖥️ System Information')
    console.table(getSystemInfo())
    console.groupEnd()
  }
}

/**
 * 监听窗口大小变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听的函数
 */
export function watchWindowResize(callback) {
  const handleResize = () => {
    callback({
      width: window.innerWidth,
      height: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight
    })
  }
  
  window.addEventListener('resize', handleResize)
  
  // 立即执行一次
  handleResize()
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}

/**
 * 监听网络状态变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听的函数
 */
export function watchNetworkChange(callback) {
  const handleOnline = () => callback({ online: true, timestamp: Date.now() })
  const handleOffline = () => callback({ online: false, timestamp: Date.now() })
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 立即检查一次
  callback({ online: navigator.onLine, timestamp: Date.now() })
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * 监听可见性变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听的函数
 */
export function watchVisibilityChange(callback) {
  const handleVisibilityChange = () => {
    callback({
      hidden: document.hidden,
      visibilityState: document.visibilityState,
      timestamp: Date.now()
    })
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  // 立即执行一次
  handleVisibilityChange()
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

export default {
  isElectron,
  isDevelopment,
  isProduction,
  getOSType,
  getBrowserInfo,
  getDeviceInfo,
  getNetworkInfo,
  getSupportedFeatures,
  getPerformanceInfo,
  getSecurityInfo,
  getUserAgentInfo,
  getSystemInfo,
  isFeatureSupported,
  setupPlatformDetection,
  watchWindowResize,
  watchNetworkChange,
  watchVisibilityChange
}