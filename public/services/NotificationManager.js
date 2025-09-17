// NotificationManager.js - 独立的通知管理器模块

const { Notification, ipcMain,nativeImage } = require('electron')
const path = require('path')

class NotificationManager {
  constructor() {
    this.activeNotifications = new Map() // electronNotificationId -> notificationData
    this.containerWebviews = new Map() // containerId -> webContentsId
    this.interceptSettings = {
      enabled: true,
      platforms: []
    }
    this.mainWindow = null
  }

  // 初始化并设置IPC处理器
  initialize(mainWindow) {
    this.setMainWindow(mainWindow)
    this.setupIPC()
    console.log('[NotificationManager] Initialized successfully')
  }

  // 设置主窗口引用
  setMainWindow(window) {
    this.mainWindow = window
  }

  // 设置所有IPC处理器
  setupIPC() {
    // 设置通知拦截
    ipcMain.handle('setup-notification-intercept', async (event, config) => {
      try {
        this.updateInterceptSettings(config)
        console.log('[NotificationManager] Notification intercept setup completed')
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to setup notification intercept:', error)
        return { success: false, error: error.message }
      }
    })

    // 注册容器webview
    ipcMain.handle('register-container-webview', async (event, containerId, webContentsId) => {
      try {
        this.registerContainerWebview(containerId, webContentsId)
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to register container webview:', error)
        return { success: false, error: error.message }
      }
    })

    // 注销容器webview
    ipcMain.handle('unregister-container-webview', async (event, containerId) => {
      try {
        this.unregisterContainerWebview(containerId)
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to unregister container webview:', error)
        return { success: false, error: error.message }
      }
    })

    // 处理被拦截的通知
   ipcMain.handle('send-intercepted-notification', async (event, notificationData) => {
  try {
    console.log('[NotificationManager] Received intercepted notification:', notificationData)
    
    // 发送到渲染进程处理（保持原有逻辑）
    this.mainWindow.webContents.send('notification-intercepted', notificationData)
    
    // 🔥 直接显示原生通知
    const result = await this.showNativeNotification({
      title: notificationData.platformId+'->'+notificationData.title || '新消息',
      body: notificationData.body || '',
      icon: notificationData.icon || null,
      silent: false,
      metadata: notificationData
    })
    
    console.log('[NotificationManager] Native notification result:', result)
    
    return { success: true, nativeNotificationResult: result }
  } catch (error) {
    console.error('[NotificationManager] Failed to handle intercepted notification:', error)
    return { success: false, error: error.message }
  }
})

    // 显示原生通知
    ipcMain.handle('show-native-notification', async (event, notificationData) => {
      try {
        const result = await this.showNativeNotification(notificationData)
        return result
      } catch (error) {
        console.error('[NotificationManager] Failed to show native notification:', error)
        return { success: false, error: error.message }
      }
    })

    // 关闭原生通知
    ipcMain.handle('close-native-notification', async (event, electronNotificationId) => {
      try {
        const result = this.closeNativeNotification(electronNotificationId)
        return result
      } catch (error) {
        console.error('[NotificationManager] Failed to close native notification:', error)
        return { success: false, error: error.message }
      }
    })

    // 聚焦窗口
    ipcMain.handle('focus-window', async (event) => {
      try {
        this.focusMainWindow()
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to focus window:', error)
        return { success: false, error: error.message }
      }
    })

    // 更新通知设置
    ipcMain.handle('update-notification-settings', async (event, settings) => {
      try {
        this.updateInterceptSettings(settings)
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to update notification settings:', error)
        return { success: false, error: error.message }
      }
    })

    // 更新通知拦截状态
    ipcMain.handle('update-notification-intercept', async (event, config) => {
      try {
        this.updateInterceptSettings(config)
        return { success: true }
      } catch (error) {
        console.error('[NotificationManager] Failed to update notification intercept:', error)
        return { success: false, error: error.message }
      }
    })

    // 关闭所有通知
    ipcMain.handle('close-all-notifications', async (event) => {
      try {
        const result = this.closeAllNotifications()
        return result
      } catch (error) {
        console.error('[NotificationManager] Failed to close all notifications:', error)
        return { success: false, error: error.message }
      }
    })

    // 获取通知统计
    ipcMain.handle('get-notification-stats', async (event) => {
      try {
        return {
          success: true,
          stats: {
            activeCount: this.activeNotifications.size,
            registeredWebviews: this.containerWebviews.size,
            interceptEnabled: this.interceptSettings.enabled
          }
        }
      } catch (error) {
        console.error('[NotificationManager] Failed to get notification stats:', error)
        return { success: false, error: error.message }
      }
    })

    console.log('[NotificationManager] IPC handlers registered')
  }

  // 注册容器webview
  registerContainerWebview(containerId, webContentsId) {
    this.containerWebviews.set(containerId, webContentsId)
    console.log(`[NotificationManager] Registered webview for container: ${containerId}`)
    
    // 监听该webview的通知请求
    this.setupWebviewNotificationIntercept(containerId, webContentsId)
  }

  // 注销容器webview
  unregisterContainerWebview(containerId) {
    this.containerWebviews.delete(containerId)
    console.log(`[NotificationManager] Unregistered webview for container: ${containerId}`)
  }

  // 为webview设置通知拦截
  setupWebviewNotificationIntercept(containerId, webContentsId) {
    try {
      const { webContents } = require('electron')
      const webview = webContents.fromId(webContentsId)
      
      if (!webview) {
        console.warn(`[NotificationManager] Webview not found for webContentsId: ${webContentsId}`)
        return
      }

      // 监听webview的通知事件
      webview.on('did-finish-load', () => {
        // 延迟注入，确保页面完全加载
        setTimeout(() => {
          this.injectNotificationInterceptScript(webview, containerId)
        }, 2000)
      })

      // 监听页面导航，重新注入脚本
      webview.on('did-navigate', () => {
        setTimeout(() => {
          this.injectNotificationInterceptScript(webview, containerId)
        }, 2000)
      })

      console.log(`[NotificationManager] Setup notification intercept for webview: ${webContentsId}`)
    } catch (error) {
      console.error(`[NotificationManager] Failed to setup notification intercept:`, error)
    }
  }

  // 注入通知拦截脚本到webview
  async injectNotificationInterceptScript(webview, containerId) {
    if (!this.interceptSettings.enabled) return

    const interceptScript = `
      (function() {
        // 检查是否已经注入过
        if (window.__notificationInterceptInjected) {
          console.log('[NotificationIntercept] Already injected, skipping...');
          return;
        }
        // ====== 1. 伪造 visibility & focus ======
  try {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden"
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true
    });
    document.hasFocus = () => false;
    console.log("📡 已伪造 visibilityState = hidden, hasFocus = false");
  } catch (e) {
    console.warn("⚠️ visibility 伪造失败:", e);
  }
        window.__notificationInterceptInjected = true;
        
        console.log('[NotificationIntercept] 🚀 Injecting notification intercept...');
        
        // 保存原始Notification
        const OriginalNotification = window.Notification;
        
        // 重写Notification构造函数
        window.Notification = function(title, options = {}) {
          console.log('[NotificationIntercept] ✅ Intercepted notification:', { title, options });
          
          // 生成唯一ID
          const webNotificationId = 'web_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          
          // 自动识别平台
          const hostname = window.location.hostname;
          const href = window.location.href;
          
          const platformId = hostname.includes('whatsapp') ? 'whatsapp' :
                            hostname.includes('telegram') ? 'telegram' :
                            hostname.includes('wetalkapp') ? 'wetalk' :
                            hostname.includes('discord') ? 'discord' :
                            hostname.includes('slack') ? 'slack' :
                            hostname.includes('teams.microsoft') ? 'teams' :
                            hostname.includes('web.skype') ? 'skype' :
                            hostname.includes('messenger') ? 'facebook' :
                            hostname.includes('instagram') ? 'instagram' :
                            (href.includes('chrome-extension') && href.includes('ophjlpahpchlmihnnnihgmmeilfjmjjc')) ? 'line' :
                            'unknown';
          
          // 构建通知数据
          const notificationData = {
            containerId: '${containerId}',
            platformId: platformId,
            title: title || '新消息',
            body: options.body || '',
            icon: options.icon || '',
            tag: options.tag || '',
            webNotificationId: webNotificationId,
            timestamp: Date.now(),
            originalNotificationData: {
              title,
              options: JSON.parse(JSON.stringify(options))
            }
          };
          
          // 发送到主进程
          try {
            if (typeof require !== 'undefined') {
              const { ipcRenderer } = require('electron');
              ipcRenderer.invoke('send-intercepted-notification', notificationData)
                .then(result => {
                  console.log('[NotificationIntercept] ✅ Sent to main process:', result);
                })
                .catch(error => {
                  console.error('[NotificationIntercept] ❌ Failed to send to main process:', error);
                });
            }
          } catch (error) {
            console.error('[NotificationIntercept] ❌ IPC communication error:', error);
          }
          
          // 创建假的Notification对象，保持API兼容性
          const fakeNotification = {
            title: title,
            body: options.body || '',
            icon: options.icon || '',
            tag: options.tag || '',
            data: options.data || null,
            onclick: null,
            onshow: null,
            onclose: null,
            onerror: null,
            
            close() {
              console.log('[NotificationIntercept] Fake notification closed');
              if (this.onclose) {
                setTimeout(() => this.onclose(), 0);
              }
            },
            
            addEventListener(type, listener) {
              this[type === 'click' ? 'onclick' : 
                   type === 'show' ? 'onshow' :
                   type === 'close' ? 'onclose' :
                   type === 'error' ? 'onerror' : null] = listener;
            },
            
            removeEventListener(type, listener) {
              this[type === 'click' ? 'onclick' : 
                   type === 'show' ? 'onshow' :
                   type === 'close' ? 'onclose' :
                   type === 'error' ? 'onerror' : null] = null;
            }
          };
          
          // 模拟show事件
          setTimeout(() => {
            if (fakeNotification.onshow) {
              try {
                fakeNotification.onshow();
              } catch (e) {
                console.warn('[NotificationIntercept] Error in onshow handler:', e);
              }
            }
          }, 0);
          
          return fakeNotification;
        };
        
        // 复制静态属性
        Object.defineProperty(window.Notification, 'permission', {
          get: () => 'granted',
          enumerable: true,
          configurable: true
        });
        
        window.Notification.requestPermission = function() {
          console.log('[NotificationIntercept] Permission requested, returning granted');
          return Promise.resolve('granted');
        };
        
        console.log('[NotificationIntercept] ✅ Notification API successfully intercepted');
      })();
    `

    try {
      await webview.executeJavaScript(interceptScript)
      console.log(`[NotificationManager] ✅ Notification intercept script injected for container: ${containerId}`)
    } catch (error) {
      console.error(`[NotificationManager] ❌ Failed to inject intercept script:`, error)
    }
  }

  // 显示原生通知
  async showNativeNotification(notificationData) {
    try {
      const {
        title,
        body,
        icon,
        silent,
        metadata
      } = notificationData

      // 创建通知选项
      const notificationOptions = {
        title,
        body,
        silent: silent || false,
        icon: this.resolveIconPath(icon),
        timeoutType: 'default',
        urgency: 'normal'
      }

      // 创建原生通知
      const notification = new Notification(notificationOptions)
      const electronNotificationId = `electron_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 存储通知数据
      this.activeNotifications.set(electronNotificationId, {
        notification,
        metadata,
        createdAt: Date.now()
      })

      // 设置事件监听器
      notification.on('click', () => {
        console.log(`[NotificationManager] Notification clicked: ${electronNotificationId}`)
        this.handleNotificationClick(electronNotificationId, 0)
      })

      notification.on('close', () => {
        console.log(`[NotificationManager] Notification closed: ${electronNotificationId}`)
        this.handleNotificationClosed(electronNotificationId)
      })

      notification.on('action', (event, index) => {
        console.log(`[NotificationManager] Notification action: ${electronNotificationId}, index: ${index}`)
        this.handleNotificationClick(electronNotificationId, index)
      })

      // 显示通知
      notification.show()

      console.log(`[NotificationManager] ✅ Native notification shown: ${electronNotificationId}`)
      
      return {
        success: true,
        notificationId: electronNotificationId
      }

    } catch (error) {
      console.error('[NotificationManager] ❌ Failed to show native notification:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 处理通知点击
  handleNotificationClick(electronNotificationId, actionIndex) {
    const notificationData = this.activeNotifications.get(electronNotificationId)
    if (!notificationData) return

    // 发送点击事件到渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-clicked', {
        electronNotificationId,
        actionIndex,
        metadata: notificationData.metadata
      })
    }

    // 聚焦主窗口
    this.focusMainWindow()

    // 关闭通知
    this.closeNativeNotification(electronNotificationId)
  }

  // 处理通知关闭
  handleNotificationClosed(electronNotificationId) {
    const notificationData = this.activeNotifications.get(electronNotificationId)
    if (!notificationData) return

    // 发送关闭事件到渲染进程
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-closed', {
        electronNotificationId,
        metadata: notificationData.metadata
      })
    }

    // 清理通知数据
    this.activeNotifications.delete(electronNotificationId)
  }

  // 关闭原生通知
  closeNativeNotification(electronNotificationId) {
    const notificationData = this.activeNotifications.get(electronNotificationId)
    if (notificationData && notificationData.notification) {
      notificationData.notification.close()
      this.activeNotifications.delete(electronNotificationId)
      console.log(`[NotificationManager] Notification closed: ${electronNotificationId}`)
      return { success: true }
    }
    return { success: false, error: 'Notification not found' }
  }

  // 聚焦主窗口
  focusMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      this.mainWindow.focus()
      this.mainWindow.show()
      
      // 在macOS上需要特殊处理
      if (process.platform === 'darwin') {
        const { app } = require('electron')
        app.dock.bounce('informational')
      }
      
      console.log('[NotificationManager] Main window focused')
    }
  }

  // 解析图标路径
  resolveIconPath(iconPath) {
    if (!iconPath) return null
    if (iconPath?.startsWith('data:image')) {
    try {
      return nativeImage.createFromDataURL(iconPath)
    } catch (e) {
      console.warn('Invalid base64 icon', e)
      return null
    }
  }

    // 如果是相对路径，转换为绝对路径
    if (iconPath.startsWith('/')) {
      return path.join(__dirname, '..', 'public', iconPath)
    }
    
    // 如果是网络路径，保持原样
    if (iconPath.startsWith('http')) {
      return iconPath
    }
    
    return iconPath
  }

  // 更新拦截设置
  updateInterceptSettings(settings) {
    this.interceptSettings = { ...this.interceptSettings, ...settings }
    console.log('[NotificationManager] Intercept settings updated:', this.interceptSettings)
  }

  // 关闭所有通知
  closeAllNotifications() {
    let closedCount = 0
    this.activeNotifications.forEach((data, id) => {
      if (data.notification) {
        data.notification.close()
        closedCount++
      }
    })
    this.activeNotifications.clear()
    console.log(`[NotificationManager] Closed ${closedCount} notifications`)
    return { success: true, closedCount }
  }

  // 清理资源
  cleanup() {
    this.closeAllNotifications()
    this.containerWebviews.clear()
    console.log('[NotificationManager] Cleanup completed')
  }
}

// 导出单例实例
const notificationManager = new NotificationManager()

module.exports = {
  NotificationManager,
  notificationManager
}