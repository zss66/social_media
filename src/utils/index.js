/**
 * 工具函数集合
 */

/**
 * 生成唯一ID
 * @param {string} prefix - 前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300) {
  let timeoutId
  return function (...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式字符串
 * @returns {string} 格式化后的日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取相对时间
 * @param {Date|string|number} date - 日期
 * @returns {string} 相对时间描述
 */
export function getRelativeTime(date) {
  if (!date) return ''
  
  const now = new Date()
  const target = new Date(date)
  const diff = now.getTime() - target.getTime()
  
  const minute = 60 * 1000
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < week) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < month) {
    return `${Math.floor(diff / week)}周前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

/**
 * 验证邮箱地址
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证URL
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证IP地址
 * @param {string} ip - IP地址
 * @returns {boolean} 是否有效
 */
export function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }
  
  return ipv6Regex.test(ip)
}

/**
 * 验证端口号
 * @param {number|string} port - 端口号
 * @returns {boolean} 是否有效
 */
export function isValidPort(port) {
  const portNum = parseInt(port, 10)
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @param {string} charset - 字符集
 * @returns {string} 随机字符串
 */
export function randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

/**
 * 安全地解析JSON
 * @param {string} str - JSON字符串
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析结果
 */
export function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

/**
 * 转义HTML字符
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * 反转义HTML字符
 * @param {string} str - 要反转义的字符串
 * @returns {string} 反转义后的字符串
 */
export function unescapeHtml(str) {
  const div = document.createElement('div')
  div.innerHTML = str
  return div.textContent || div.innerText || ''
}

/**
 * 获取操作系统信息
 * @returns {object} 操作系统信息
 */
export function getOSInfo() {
  const userAgent = navigator.userAgent
  const platform = navigator.platform
  
  let os = 'Unknown'
  let version = ''
  
  if (userAgent.indexOf('Windows NT') !== -1) {
    os = 'Windows'
    const match = userAgent.match(/Windows NT ([\d.]+)/)
    if (match) version = match[1]
  } else if (userAgent.indexOf('Mac OS X') !== -1) {
    os = 'macOS'
    const match = userAgent.match(/Mac OS X ([\d_]+)/)
    if (match) version = match[1].replace(/_/g, '.')
  } else if (userAgent.indexOf('Linux') !== -1) {
    os = 'Linux'
  } else if (userAgent.indexOf('Android') !== -1) {
    os = 'Android'
    const match = userAgent.match(/Android ([\d.]+)/)
    if (match) version = match[1]
  } else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) {
    os = 'iOS'
    const match = userAgent.match(/OS ([\d_]+)/)
    if (match) version = match[1].replace(/_/g, '.')
  }
  
  return { os, version, platform, userAgent }
}

/**
 * 获取浏览器信息
 * @returns {object} 浏览器信息
 */
export function getBrowserInfo() {
  const userAgent = navigator.userAgent
  let browser = 'Unknown'
  let version = ''
  
  if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edge') === -1) {
    browser = 'Chrome'
    const match = userAgent.match(/Chrome\/([\d.]+)/)
    if (match) version = match[1]
  } else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'Firefox'
    const match = userAgent.match(/Firefox\/([\d.]+)/)
    if (match) version = match[1]
  } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari'
    const match = userAgent.match(/Version\/([\d.]+)/)
    if (match) version = match[1]
  } else if (userAgent.indexOf('Edge') !== -1) {
    browser = 'Edge'
    const match = userAgent.match(/Edge\/([\d.]+)/)
    if (match) version = match[1]
  }
  
  return { browser, version, userAgent }
}

/**
 * 检测设备类型
 * @returns {string} 设备类型
 */
export function getDeviceType() {
  const userAgent = navigator.userAgent
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet'
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    return 'mobile'
  } else {
    return 'desktop'
  }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch {
    return false
  }
}

/**
 * 从剪贴板读取文本
 * @returns {Promise<string>} 剪贴板文本
 */
export async function readFromClipboard() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      return await navigator.clipboard.readText()
    } else {
      throw new Error('Clipboard API not available')
    }
  } catch {
    return ''
  }
}

/**
 * 下载文件
 * @param {string|Blob} data - 文件数据
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME类型
 */
export function downloadFile(data, filename, mimeType = 'application/octet-stream') {
  let blob
  
  if (data instanceof Blob) {
    blob = data
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType })
  } else {
    blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  }
  
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * 检测网络连接状态
 * @returns {boolean} 是否在线
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * 监听网络状态变化
 * @param {Function} callback - 回调函数
 * @returns {Function} 取消监听的函数
 */
export function watchNetworkStatus(callback) {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 返回取消监听的函数
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * 获取屏幕信息
 * @returns {object} 屏幕信息
 */
export function getScreenInfo() {
  return {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: screen.orientation?.type || 'unknown'
  }
}

/**
 * 获取窗口信息
 * @returns {object} 窗口信息
 */
export function getWindowInfo() {
  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    scrollX: window.scrollX || window.pageXOffset,
    scrollY: window.scrollY || window.pageYOffset
  }
}