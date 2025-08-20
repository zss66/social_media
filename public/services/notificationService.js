import { ElNotification } from 'element-plus'

/**
 * 通知类型枚举
 */
export const NotificationTypes = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
}

/**
 * 通知服务类
 */
class NotificationService {
  constructor() {
    this.isSupported = this.checkSupport()
    this.permission = this.getPermission()
    this.settings = {
      enabled: true,
      sound: true,
      showPreview: true,
      maxNotifications: 5,
      defaultDuration: 5000,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    }
    this.activeNotifications = new Map()
    this.notificationQueue = []
    this.soundEnabled = true
    this.sounds = {
      info: '/sounds/info.mp3',
      success: '/sounds/success.mp3',
      warning: '/sounds/warning.mp3',
      error: '/sounds/error.mp3',
      message: '/sounds/message.mp3'
    }
    
    this.loadSettings()
    this.setupEventListeners()
  }
  
  /**
   * 检测浏览器是否支持通知
   */
  checkSupport() {
    return 'Notification' in window
  }
  
  /**
   * 获取通知权限状态
   */
  getPermission() {
    if (!this.isSupported) return 'denied'
    return Notification.permission
  }
  
  /**
   * 请求通知权限
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Browser does not support notifications')
    }
    
    if (this.permission === 'granted') {
      return 'granted'
    }
    
    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return 'denied'
    }
  }
  
  /**
   * 显示系统通知
   */
  async showSystemNotification(title, options = {}) {
    if (!this.settings.enabled || this.isQuietTime()) {
      return null
    }
    
    // 确保有权限
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        return null
      }
    }
    
    const notificationOptions = {
      body: options.body || '',
      icon: options.icon || '/icons/app-icon.png',
      badge: options.badge || '/icons/badge.png',
      image: options.image,
      tag: options.tag || Date.now().toString(),
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || !this.soundEnabled,
      ...options
    }
    
    try {
      const notification = new Notification(title, notificationOptions)
      
      // 设置事件监听器
      notification.onclick = (event) => {
        this.handleNotificationClick(event, options.onClick)
      }
      
      notification.onshow = () => {
        this.activeNotifications.set(notification.tag, notification)
        this.playNotificationSound(options.soundType || 'info')
      }
      
      notification.onclose = () => {
        this.activeNotifications.delete(notification.tag)
      }
      
      notification.onerror = (error) => {
        console.error('Notification error:', error)
        this.activeNotifications.delete(notification.tag)
      }
      
      // 自动关闭通知
      if (options.duration !== 0) {
        setTimeout(() => {
          notification.close()
        }, options.duration || this.settings.defaultDuration)
      }
      
      return notification
    } catch (error) {
      console.error('Failed to show system notification:', error)
      return null
    }
  }
  
  /**
   * 显示应用内通知
   */
  showAppNotification(title, message, type = NotificationTypes.INFO, options = {}) {
    if (!this.settings.enabled || this.isQuietTime()) {
      return
    }
    
    const notificationOptions = {
      title,
      message,
      type,
      duration: options.duration || this.settings.defaultDuration,
      showClose: options.showClose !== false,
      position: options.position || 'top-right',
      offset: options.offset || 0,
      ...options
    }
    
    // 播放声音
    if (this.soundEnabled && options.playSound !== false) {
      this.playNotificationSound(type)
    }
    
    return ElNotification(notificationOptions)
  }
  
  /**
   * 显示消息通知
   */
  async showMessageNotification(platform, sender, message, options = {}) {
    const title = `${platform} - 新消息`
    const body = this.settings.showPreview 
      ? `${sender}: ${this.truncateMessage(message, 100)}`
      : `来自 ${sender} 的新消息`
    
    // 系统通知
    const systemNotification = await this.showSystemNotification(title, {
      body,
      icon: options.icon || `/icons/${platform.toLowerCase()}.png`,
      tag: `message-${platform}-${Date.now()}`,
      soundType: 'message',
      onClick: () => {
        if (options.onMessageClick) {
          options.onMessageClick(platform, sender, message)
        }
        this.focusWindow()
      },
      ...options
    })
    
    // 应用内通知
    this.showAppNotification(title, body, NotificationTypes.INFO, {
      duration: 8000,
      onClick: () => {
        if (options.onMessageClick) {
          options.onMessageClick(platform, sender, message)
        }
      }
    })
    
    return systemNotification
  }
  
  /**
   * 显示成功通知
   */
  showSuccess(message, options = {}) {
    return this.showAppNotification('成功', message, NotificationTypes.SUCCESS, options)
  }
  
  /**
   * 显示错误通知
   */
  showError(message, options = {}) {
    return this.showAppNotification('错误', message, NotificationTypes.ERROR, {
      duration: 0, // 错误通知不自动关闭
      ...options
    })
  }
  
  /**
   * 显示警告通知
   */
  showWarning(message, options = {}) {
    return this.showAppNotification('警告', message, NotificationTypes.WARNING, options)
  }
  
  /**
   * 显示信息通知
   */
  showInfo(message, options = {}) {
    return this.showAppNotification('信息', message, NotificationTypes.INFO, options)
  }
  
  /**
   * 播放通知声音
   */
  playNotificationSound(type = 'info') {
    if (!this.soundEnabled || this.isQuietTime()) {
      return
    }
    
    try {
      const soundUrl = this.sounds[type] || this.sounds.info
      const audio = new Audio(soundUrl)
      audio.volume = 0.5
      audio.play().catch(error => {
        console.warn('Failed to play notification sound:', error)
      })
    } catch (error) {
      console.warn('Failed to create audio for notification:', error)
    }
  }
  
  /**
   * 处理通知点击事件
   */
  handleNotificationClick(event, onClick) {
    event.preventDefault()
    
    // 聚焦窗口
    this.focusWindow()
    
    // 执行自定义点击处理器
    if (onClick && typeof onClick === 'function') {
      onClick(event)
    }
    
    // 关闭通知
    if (event.target) {
      event.target.close()
    }
  }
  
  /**
   * 聚焦应用窗口
   */
  focusWindow() {
    if (window.electronAPI && window.electronAPI.focusWindow) {
      window.electronAPI.focusWindow()
    } else {
      window.focus()
    }
  }
  
  /**
   * 检查是否在免打扰时间
   */
  isQuietTime() {
    if (!this.settings.quietHours.enabled) {
      return false
    }
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number)
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number)
    
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    if (startTime <= endTime) {
      // 同一天内的时间范围
      return currentTime >= startTime && currentTime <= endTime
    } else {
      // 跨天的时间范围
      return currentTime >= startTime || currentTime <= endTime
    }
  }
  
  /**
   * 截断消息内容
   */
  truncateMessage(message, maxLength = 100) {
    if (message.length <= maxLength) {
      return message
    }
    return message.substring(0, maxLength) + '...'
  }
  
  /**
   * 清除所有活跃的通知
   */
  clearAllNotifications() {
    this.activeNotifications.forEach(notification => {
      notification.close()
    })
    this.activeNotifications.clear()
  }
  
  /**
   * 清除指定标签的通知
   */
  clearNotificationByTag(tag) {
    const notification = this.activeNotifications.get(tag)
    if (notification) {
      notification.close()
      this.activeNotifications.delete(tag)
    }
  }
  
  /**
   * 更新设置
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()
    
    // 更新声音状态
    this.soundEnabled = this.settings.sound
  }
  
  /**
   * 获取当前设置
   */
  getSettings() {
    return { ...this.settings }
  }
  
  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save notification settings:', error)
    }
  }
  
  /**
   * 从本地存储加载设置
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('notification-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.settings = { ...this.settings, ...settings }
        this.soundEnabled = this.settings.sound
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面不可见时，可能需要调整通知策略
      } else {
        // 页面可见时，清除一些通知
        this.clearOldNotifications()
      }
    })
    
    // 监听窗口焦点变化
    window.addEventListener('focus', () => {
      this.clearOldNotifications()
    })
    
    // 监听通知权限变化
    if (this.isSupported) {
      // 某些浏览器支持权限变化监听
      try {
        navigator.permissions.query({ name: 'notifications' }).then(permission => {
          permission.onchange = () => {
            this.permission = Notification.permission
          }
        })
      } catch (error) {
        // 忽略不支持的浏览器
      }
    }
  }
  
  /**
   * 清除旧的通知
   */
  clearOldNotifications() {
    const now = Date.now()
    const maxAge = 30000 // 30秒
    
    this.activeNotifications.forEach((notification, tag) => {
      const createdTime = parseInt(tag) || 0
      if (now - createdTime > maxAge) {
        notification.close()
      }
    })
  }
  
  /**
   * 获取通知统计信息
   */
  getStats() {
    return {
      isSupported: this.isSupported,
      permission: this.permission,
      activeCount: this.activeNotifications.size,
      queueLength: this.notificationQueue.length,
      settings: this.settings
    }
  }
  
  /**
   * 测试通知功能
   */
  async testNotification() {
    try {
      await this.showSystemNotification('测试通知', {
        body: '这是一个测试通知，用于验证通知功能是否正常工作。',
        icon: '/icons/app-icon.png',
        tag: 'test-notification'
      })
      
      this.showSuccess('通知测试成功')
      return true
    } catch (error) {
      console.error('Notification test failed:', error)
      this.showError('通知测试失败')
      return false
    }
  }
  
  /**
   * 批量发送通知
   */
  async sendBatch(notifications) {
    const results = []
    
    for (const notification of notifications) {
      try {
        const result = await this.showSystemNotification(
          notification.title,
          notification.options
        )
        results.push({ success: true, notification: result })
      } catch (error) {
        results.push({ success: false, error })
      }
      
      // 添加延迟避免过于频繁
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return results
  }
  
  /**
   * 销毁服务
   */
  destroy() {
    this.clearAllNotifications()
    this.notificationQueue = []
    
    // 移除事件监听器
    document.removeEventListener('visibilitychange', this.setupEventListeners)
    window.removeEventListener('focus', this.setupEventListeners)
  }
}

// 创建全局通知服务实例
const notificationService = new NotificationService()

// Vue 插件安装函数
export function install(app) {
  app.config.globalProperties.$notify = notificationService
  app.provide('notificationService', notificationService)
}

// 导出便捷方法
export const showNotification = (title, options) => 
  notificationService.showSystemNotification(title, options)

export const showSuccess = (message, options) => 
  notificationService.showSuccess(message, options)

export const showError = (message, options) => 
  notificationService.showError(message, options)

export const showWarning = (message, options) => 
  notificationService.showWarning(message, options)

export const showInfo = (message, options) => 
  notificationService.showInfo(message, options)

export const showMessage = (platform, sender, message, options) => 
  notificationService.showMessageNotification(platform, sender, message, options)

export default notificationService