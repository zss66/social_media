/*
 * @Description: Electron preload 脚本，兼容 contextIsolation: false，暴露 API 到 window
 */

const { ipcRenderer } = require("electron");
console.log("[preload] started");
const url = new URL(window.location.href);
const platform = url.searchParams.get("platform");
const containerId = url.searchParams.get("containerId");

console.log("[Preload] URL:", window.location.href);
console.log("[Preload] platform =", platform);
console.log("[Preload] containerId =", containerId);

// 🔥 扩展您现有的electronAPI，添加通知功能
window.electronAPI = {
  // === 您现有的API ===
  getinfo: () => ({ platform, containerId }),
  minimize: () =>
    ipcRenderer.invoke("minimize-window").catch((error) => {
      console.error("Minimize window failed", error);
    }),
  toggleFullscreen: () =>
    ipcRenderer.invoke("window-toggle-fullscreen").catch((error) => {
      console.error("toggle-fullscreen failed", error);
    }),
  close: () =>
    ipcRenderer.invoke("close-window").catch((error) => {
      console.error("Close window failed", error);
    }),
  toggleDevTools: () =>
    ipcRenderer.invoke("toggle-devtools").catch((error) => {
      console.error("Toggle dev tools failed", error);
    }),
  initObserver: () =>
    ipcRenderer.invoke("init-observer").catch((error) => {
      console.error("Init observer failed", error);
    }),
  getLineExtensionUrl: () => ipcRenderer.invoke("get-line-extension-url"),
  createContainerSession: (containerId, config) =>
    ipcRenderer
      .invoke("create-container-session", containerId, config)
      .catch((error) => {
        console.log("Create container session error:", error);
        console.error("Create container session failed", error);
      }),
  testProxy: (proxyConfig) =>
    ipcRenderer.invoke("test-proxy", proxyConfig).catch((error) => {
      console.error("Test proxy failed", error);
    }),
  translateText: (text, targetLang) =>
    ipcRenderer
      .invoke("translate-text", text, targetLang)
      .catch((error) => {
        console.error("Translate text failed", error);
      }),
  getPreloadPath: () =>
    ipcRenderer.invoke("get-preload-path").catch((error) => {
      console.error("get-preload-path failed", error);
    }),
  sleepContainer: async (containerId) => {
    console.log("Sleeping container", containerId);
    return await ipcRenderer.invoke("sleep-container-session", containerId);
  },
  wakeContainer: async (containerId, config) => {
    console.log("Waking container", containerId);
    return await ipcRenderer.invoke("wake-container-session", containerId, config);
  },
  destroyContainerWebview: (containerId) =>
    ipcRenderer.invoke("destroy-container-webview", containerId),
  rebuildContainerWebview: (containerId, config) =>
    ipcRenderer.invoke("rebuild-container-webview", containerId, config),
  getContainerRestoreData: (containerId) =>
    ipcRenderer.invoke("get-container-restore-data", containerId),
  cleanupContainerData: (containerId) =>
    ipcRenderer.invoke("cleanup-container-data", containerId),
  takeScreenshot: (containerId) =>
    ipcRenderer.invoke("take-screenshot", containerId),
  saveFile: (data, filename) =>
    ipcRenderer.invoke("save-file", data, filename),
  loadFile: () => ipcRenderer.invoke("load-file"),
  showNotification: (options) =>
    ipcRenderer.invoke("show-notification", options),
  onContainerMessage: (callback) => {
    ipcRenderer.on("container-message", callback);
  },
  removeContainerMessageListener: (callback) => {
    ipcRenderer.removeListener("container-message", callback);
  },
  loadPlugin: (config) => ipcRenderer.invoke("load-plugin", config),
  triggerAppLock: () => ipcRenderer.send('app-lock'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  verifyPassword: (password) => ipcRenderer.invoke('verify-password', password),
   loadSettings: () => ipcRenderer.invoke('load-settings'),
  
  // 🔥 新增：通知系统API
  setupNotificationIntercept: (config) => ipcRenderer.invoke('setup-notification-intercept', config),
  sendInterceptedNotification: (data) => ipcRenderer.invoke('send-intercepted-notification', data),
  showNativeNotification: (data) => ipcRenderer.invoke('show-native-notification', data),
  closeNativeNotification: (id) => ipcRenderer.invoke('close-native-notification', id),
  updateNotificationSettings: (settings) => ipcRenderer.invoke('update-notification-settings', settings),
  updateNotificationIntercept: (config) => ipcRenderer.invoke('update-notification-intercept', config),
  closeAllNotifications: () => ipcRenderer.invoke('close-all-notifications'),
  getNotificationStats: () => ipcRenderer.invoke('get-notification-stats'),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  registerContainerWebview: (containerId, webContentsId) => 
    ipcRenderer.invoke('register-container-webview', containerId, webContentsId),
  unregisterContainerWebview: (containerId) => 
    ipcRenderer.invoke('unregister-container-webview', containerId),
  
  // 🔥 新增：事件监听器
  onNotificationIntercepted: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('notification-intercepted', listener)
    return () => ipcRenderer.removeListener('notification-intercepted', listener)
  },
  onNotificationClick: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('notification-clicked', listener)
    return () => ipcRenderer.removeListener('notification-clicked', listener)
  },
  onNotificationClosed: (callback) => {
    const listener = (event, data) => callback(data)
    ipcRenderer.on('notification-closed', listener)
    return () => ipcRenderer.removeListener('notification-closed', listener)
  }
};

// 针对不同平台注入不同逻辑
switch (platform) {
  case "telegram":
    injectTelegramHooks();
    break;
  case "line":
    injectLineHooks();
    break;
  case "whatsapp":
    injectWhatsAppHooks();
    break;
  case "wetalk":
    injectWeTalkHooks();
    break;
  case "discord":
    injectDiscordHooks();
    break;
  case "slack":
    injectSlackHooks();
    break;
  case "teams":
    injectTeamsHooks();
    break;
  case "skype":
    injectSkypeHooks();
    break;
  case "facebook":
    injectFacebookHooks();
    break;
  case "instagram":
    injectInstagramHooks();
    break;
  default:
    console.log("No specific hooks injected for platform:", platform);
    // 对于未知平台，仍然注入通用通知拦截
    injectGenericNotificationIntercept(platform || 'unknown');
    break;
}

function injectTelegramHooks() {
  console.log("Injecting Telegram hooks...");
  // 🔥 为Telegram注入通知拦截
  injectNotificationIntercept('telegram');
}

function injectLineHooks() {
  console.log("Injecting LINE hooks...");
  
  // 您现有的LINE Chrome API模拟
  (function initChromeAPI() {
    console.log('fillChromeAPI.js');
    
    // 🔥 保存原始的chrome.notifications.create方法（如果存在）
    const originalCreate = window.chrome?.notifications?.create;
    
    window.chrome = window.chrome || {};
    window.chrome.notifications = {
        onClicked: {
            addListener: function () {
            }
        },
        onClosed: {
            addListener: function () {
            }
        },
        // 🔥 拦截LINE的Chrome通知API
        create: function (notificationId, options, callback) {
            console.log('[NotificationIntercept] ✅ Intercepted LINE Chrome notification:', { notificationId, options });
            
            // 获取容器ID
            const urlParams = new URLSearchParams(window.location.search);
            const containerId = urlParams.get('containerId') || `container_line_${Date.now()}`;
            
            // 转换为标准通知数据格式
            const notificationData = {
              containerId: containerId,
              platformId: 'line',
              title: options.title || 'LINE消息',
              body: options.message || '',
              icon: options.iconUrl || '/icons/line.png',
              tag: notificationId || `line_${Date.now()}`,
              webNotificationId: `line_chrome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: Date.now(),
              originalNotificationData: {
                title: options.title,
                options: options
              }
            };
            
            // 发送到主进程
            try {
              ipcRenderer.invoke('send-intercepted-notification', notificationData)
                .then(result => {
                  console.log('[NotificationIntercept] ✅ LINE notification sent to main process:', result);
                })
                .catch(error => {
                  console.error('[NotificationIntercept] ❌ Failed to send LINE notification:', error);
                });
            } catch (error) {
              console.error('[NotificationIntercept] ❌ LINE IPC communication error:', error);
            }
            
            // 执行原始回调
            if (callback) {
              setTimeout(() => callback(notificationId), 0);
            }
            
            return notificationId;
        },
        clear: function () {
        },
        getAll: function () {
        },
        update: function () {
        }
    };
    window.chrome.tabs = {
        getZoom: function () {
            return {
                then: function (_0x5a223b) {
                    if (_0x5a223b) {
                        _0x5a223b();
                    }
                }
            };
        }
    };
    window.chrome.action = {
        setBadgeText: function () {
        }
    };
    window.chrome.downloads = {
        download: async function (_0x205148) {
            window.saveAsFile(_0x205148.url, _0x205148.filename);
        },
        onChanged: {
            addListener: function (_0x2b0c7e) {
            }
        }
    };
    window.chrome.cookies = {
        remove: function () {
        },
        getAll: function () {
        },
        getAllCookieStores: function () {
        },
        onChanged: {
            addListener: function () {
            }
        }
    };
  })();
  
  // 🔥 同时注入标准Web Notification拦截
  injectNotificationIntercept('line');
}

// 🔥 新增：其他平台的hooks函数
function injectWhatsAppHooks() {
  console.log("Injecting WhatsApp hooks...");
  injectNotificationIntercept('whatsapp');
}

function injectWeTalkHooks() {
  console.log("Injecting WeTalk hooks...");
  injectNotificationIntercept('wetalk');
}

function injectDiscordHooks() {
  console.log("Injecting Discord hooks...");
  injectNotificationIntercept('discord');
}

function injectSlackHooks() {
  console.log("Injecting Slack hooks...");
  injectNotificationIntercept('slack');
}

function injectTeamsHooks() {
  console.log("Injecting Teams hooks...");
  injectNotificationIntercept('teams');
}

function injectSkypeHooks() {
  console.log("Injecting Skype hooks...");
  injectNotificationIntercept('skype');
}

function injectFacebookHooks() {
  console.log("Injecting Facebook Messenger hooks...");
  injectNotificationIntercept('facebook');
}

function injectInstagramHooks() {
  console.log("Injecting Instagram hooks...");
  injectNotificationIntercept('instagram');
}

function injectGenericNotificationIntercept(platformId) {
  console.log(`Injecting generic notification intercept for: ${platformId}`);
  injectNotificationIntercept(platformId);
}

// 🔥 新增：通用通知拦截函数
function injectNotificationIntercept(platformId) {
  console.log(`[NotificationIntercept] Preparing intercept for platform: ${platformId}`);
  
  // 等待页面加载完成后注入
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => performNotificationIntercept(platformId), 1000);
    });
  } else {
    setTimeout(() => performNotificationIntercept(platformId), 1000);
  }
}

// 🔥 执行通知拦截的核心函数
// 在 preload.js 的开头部分，修改平台获取逻辑




/// 🔥 平台特定的聊天上下文提取器
const chatContextExtractors = {
  whatsapp: () => {
    // WhatsApp Web 聊天上下文提取
    try {
      const currentChatHeader = document.querySelector('[data-testid="conversation-header"]');
      const contactName = currentChatHeader?.querySelector('[data-testid="contact-name"]')?.textContent;
      const contactPhone = currentChatHeader?.querySelector('[title*="+"]')?.getAttribute('title');
      
      // 尝试从URL获取聊天ID
      const urlMatch = window.location.href.match(/\/chat\/([^\/]+)/);
      const chatId = urlMatch ? urlMatch[1] : null;
      
      return {
        contactName,
        contactPhone,
        chatId,
        platform: 'whatsapp'
      };
    } catch (error) {
      console.warn('[WhatsApp] Failed to extract chat context:', error);
      return null;
    }
  },
  
  telegram: () => {
    // Telegram Web 聊天上下文提取
    try {
      const chatTitle = document.querySelector('.chat-title')?.textContent;
      const chatSubtitle = document.querySelector('.chat-subtitle')?.textContent;
      
      // 从URL获取聊天信息
      const urlMatch = window.location.href.match(/#\/im\?p=([^&]+)/);
      const chatId = urlMatch ? urlMatch[1] : null;
      
      return {
        contactName: chatTitle,
        contactInfo: chatSubtitle,
        chatId,
        platform: 'telegram'
      };
    } catch (error) {
      console.warn('[Telegram] Failed to extract chat context:', error);
      return null;
    }
  },
  
  line: () => {
    // LINE 聊天上下文提取
    try {
      // LINE扩展的聊天上下文可能需要通过Chrome扩展API获取
      const chatTitle = document.querySelector('.chat-room-name, .chatroom-name')?.textContent;
      const chatId = document.querySelector('[data-chat-id]')?.getAttribute('data-chat-id');
      
      return {
        contactName: chatTitle,
        chatId,
        platform: 'line'
      };
    } catch (error) {
      console.warn('[LINE] Failed to extract chat context:', error);
      return null;
    }
  },
  
  discord: () => {
    // Discord 聊天上下文提取
    try {
      const channelName = document.querySelector('[data-dnd-name*="channel"]')?.textContent;
      const serverName = document.querySelector('[data-dnd-name*="guild"]')?.textContent;
      const channelId = window.location.pathname.split('/').pop();
      
      return {
        contactName: channelName,
        serverName,
        chatId: channelId,
        platform: 'discord'
      };
    } catch (error) {
      console.warn('[Discord] Failed to extract chat context:', error);
      return null;
    }
  },
  
  wetalk: () => {
    // WeTalk 聊天上下文提取
    try {
      const contactName = document.querySelector('.chat-header .contact-name')?.textContent;
      const chatId = document.querySelector('[data-chat-id]')?.getAttribute('data-chat-id');
      
      return {
        contactName,
        chatId,
        platform: 'wetalk'
      };
    } catch (error) {
      console.warn('[WeTalk] Failed to extract chat context:', error);
      return null;
    }
  }
};

// 🔥 修改通知拦截函数，添加聊天上下文提取
function performNotificationIntercept(platformId) {
  try {
    if (window.__notificationInterceptInjected) {
      console.log('[NotificationIntercept] Already injected, skipping...');
      return;
    }
    window.__notificationInterceptInjected = true;
    
    console.log(`[NotificationIntercept] 🚀 Performing intercept for: ${platformId}`);
    
    const OriginalNotification = window.Notification;
    
    window.Notification = function(title, options = {}) {
      console.log('[NotificationIntercept] ✅ Intercepted notification:', { title, options });
      
      // 获取基本信息
      const webNotificationId = 'web_notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const urlParams = new URLSearchParams(window.location.search);
      const containerIdFromUrl = urlParams.get('containerId');
      const platformIdFromUrl = urlParams.get('platform');
      
      let finalPlatformId = platformIdFromUrl || platformId;
      let finalContainerId = containerIdFromUrl || `container_${finalPlatformId}_${Date.now()}`;
      
      // 🔥 提取聊天上下文信息
      let chatContext = null;
      if (chatContextExtractors[finalPlatformId]) {
        chatContext = chatContextExtractors[finalPlatformId]();
        console.log(`[NotificationIntercept] 聊天上下文:`, chatContext);
      }
      
      // 🔥 尝试从通知内容中提取发送者信息
      let senderInfo = null;
      try {
        // 不同平台的发送者信息提取
        if (finalPlatformId === 'whatsapp') {
          // WhatsApp: 通知标题通常是联系人名字
          senderInfo = { name: title, platform: 'whatsapp' };
        } else if (finalPlatformId === 'telegram') {
          // Telegram: 标题可能包含频道或联系人信息
          const match = title.match(/^(.+?)(\s\(\d+\))?$/);
          senderInfo = { name: match ? match[1] : title, platform: 'telegram' };
        } else if (finalPlatformId === 'line') {
          // LINE: 需要从通知数据中解析
          senderInfo = { name: title, platform: 'line' };
        } else {
          // 通用处理
          senderInfo = { name: title, platform: finalPlatformId };
        }
      } catch (error) {
        console.warn('[NotificationIntercept] Failed to extract sender info:', error);
      }
      
      // 构建增强的通知数据
      const notificationData = {
        containerId: finalContainerId,
        platformId: finalPlatformId,
        title: title || '新消息',
        body: options.body || '',
        icon: options.icon || '',
        tag: options.tag || '',
        webNotificationId: webNotificationId,
        timestamp: Date.now(),
        
        // 🔥 新增：聊天上下文和发送者信息
        chatContext: chatContext,
        senderInfo: senderInfo,
        
        originalNotificationData: {
          title,
          options: JSON.parse(JSON.stringify(options))
        }
      };
      
      // 发送到主进程
      try {
        ipcRenderer.invoke('send-intercepted-notification', notificationData)
          .then(result => {
            console.log('[NotificationIntercept] ✅ Sent to main process:', result);
          })
          .catch(error => {
            console.error('[NotificationIntercept] ❌ Failed to send to main process:', error);
          });
      } catch (error) {
        console.error('[NotificationIntercept] ❌ IPC communication error:', error);
      }
      
      // 返回假的通知对象（保持原有逻辑）
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
          if (type === 'click') this.onclick = listener;
          else if (type === 'show') this.onshow = listener;
          else if (type === 'close') this.onclose = listener;
          else if (type === 'error') this.onerror = listener;
        },
        
        removeEventListener(type, listener) {
          if (type === 'click') this.onclick = null;
          else if (type === 'show') this.onshow = null;
          else if (type === 'close') this.onclose = null;
          else if (type === 'error') this.onerror = null;
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
    
    console.log(`[NotificationIntercept] ✅ Enhanced notification API intercepted for: ${platformId}`);
    
  } catch (error) {
    console.error('[NotificationIntercept] ❌ Failed to inject notification intercept:', error);
  }
}
// 您现有的翻译消息监听器
window.addEventListener("message", async (event) => {
  if (event.data?.type === "translate") {
    const { text, targetLang, requestId } = event.data;
    console.log("[preload] 收到翻译请求:", { text, targetLang, requestId });

    try {
      const result = await window.electronAPI.translateText(text, targetLang);
      window.postMessage(
        {
          type: "translation-result",
          originalText: text,
          success: result?.success || false,
          translatedText: result?.translatedText,
          error: result?.error,
          requestId: requestId
        },
        "*"
      );
      console.log("electron返回的翻译结果：", result);
    } catch (error) {
      console.error("[preload] 翻译请求失败:", error);
      window.postMessage(
        {
          type: "translation-result",
          originalText: text,
          success: false,
          error: error.message,
          requestId: requestId
        },
        "*"
      );
    }
  }
});

// 您现有的系统信息暴露
window.nodeAPI = {
  versions: process.versions
};

window.platformAPI = {
  platform: process.platform,
  arch: process.arch,
  isWindows: process.platform === "win32",
  isMac: process.platform === "darwin",
  isLinux: process.platform === "linux"
};