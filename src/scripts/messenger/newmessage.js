export const newMessengerMessage = `
// Messenger 列表监听器 - 仅监听消息列表
class MessengerMessageListener {
  static CONFIG = {
    CHECK_DEBOUNCE: 500,
    MAX_KNOWN_MESSAGES: 1000,
    MESSAGE_ID_TTL: 3600000,
  };

  static SELECTORS = {
    THREAD_LIST: '[data-pagelet="MWThreadList"]',
    THREAD_ROW: '[data-pagelet="MWThreadListThreadListRow"]',
    USER_NAME: 'div.html-div>span[dir="auto"]>span',
    IMAGE_MESSAGE: "img.xz74otr.xmz0i5r.x193iq5w",
    CHAT_TAB_LINK: 'a[aria-label*="聊天"]',
  };

  constructor() {
    this.listObserver = null;
    this.rootObserver = null;
    this.chatTabObserver = null;
    
    this.knownListMessages = new Map();
    this.callbacks = [];
    this.isInChatTab = false;
    
    this.cleanupInterval = null;
    this.isDestroyed = false;

    this.autoOpenEnabled = false;
    this.autoOpenDelay = 1000;

    this.startCleanupTask();
  }

  // ==================== 公共 API 方法 ====================
  onNewMessage(callback) {
    if (typeof callback === "function") {
      this.callbacks.push(callback);
      console.log(\`✅ 已添加回调函数，当前共 \${this.callbacks.length} 个回调\`);
    }
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
      console.log(\`✅ 已移除回调函数，剩余 \${this.callbacks.length} 个回调\`);
    }
  }

  // ==================== 自动打开聊天方法 ====================
  enableAutoOpen(delay = 1000) {
    this.autoOpenEnabled = true;
    this.autoOpenDelay = delay;
    console.log(\`✅ 已启用自动打开聊天功能 (延迟: \${delay}ms)\`);
  }

  disableAutoOpen() {
    this.autoOpenEnabled = false;
    console.log("⏹️ 已禁用自动打开聊天功能");
  }

  openConversation(conversationId) {
    return this.safeExecute(() => {
      if (!conversationId) {
        console.log("❌ 无法打开对话: conversationId 为空");
        return false;
      }

      const conversationUrl = \`https://www.messenger.com/e2ee/t/\${conversationId}/\`;
      console.log(\`🔗 尝试打开对话: \${conversationUrl}\`);

      if (window.location.href !== conversationUrl) {
        window.location.href = conversationUrl;
        console.log(\`✅ 已跳转到对话页面: \${conversationId}\`);
        return true;
      } else {
        console.log(\`ℹ️ 已经在目标对话页面: \${conversationId}\`);
        return true;
      }
    }, "openConversation") || false;
  }

  openConversationByClick(conversationId) {
    return this.safeExecute(() => {
      if (!conversationId) {
        console.log("❌ 无法点击打开对话: conversationId 为空");
        return false;
      }

      const conversationLink = document.querySelector(\`a[href*="/e2ee/t/\${conversationId}/"], a[href*="/\${conversationId}/"]\`);
      
      if (conversationLink) {
        console.log(\`🖱️ 找到对话链接，准备点击打开: \${conversationId}\`);
        conversationLink.click();
        console.log(\`✅ 已点击打开对话: \${conversationId}\`);
        return true;
      } else {
        console.log(\`❌ 未找到对话链接: \${conversationId}\`);
        return this.openConversation(conversationId);
      }
    }, "openConversationByClick") || false;
  }

  delayedOpenConversation(conversationId, delay = null) {
    const openDelay = delay !== null ? delay : this.autoOpenDelay;
    console.log(\`⏰ 将在 \${openDelay}ms 后打开对话: \${conversationId}\`);

    setTimeout(() => {
      if (this.autoOpenEnabled) {
        this.openConversationByClick(conversationId);
      }
    }, openDelay);
  }

  // ==================== 通知方法 ====================
  notifyCallbacks(message, source = "") {
    this.callbacks.forEach((callback) => {
      try {
        callback(message, source);
      } catch (error) {
        console.error("❌ 回调执行出错:", error);
      }
    });

    this.showNotification(message);

    if (this.autoOpenEnabled && source === "列表监听" && message.conversationId) {
      console.log(\`🚀 自动打开新消息对话: \${message.conversationId}\`);
      this.delayedOpenConversation(message.conversationId);
    }
  }

  showNotification(message) {
    if (Notification.permission === "default") {
      console.log("🔔 请求通知权限...");
      Notification.requestPermission().then(permission => {
        console.log(\`🔔 通知权限状态: \${permission}\`);
        if (permission === "granted") {
          this.createNotification(message);
        }
      });
    } else if (Notification.permission === "granted") {
      this.createNotification(message);
    } else {
      console.log("❌ 通知权限被拒绝");
    }
  }

  createNotification(message) {
    try {
      const notificationOptions = {
        body: message.isImage ? "[图片消息]" : (message.messagePreview || "新消息"),
        icon: message.isImage && message.imageBase64
          ? message.imageBase64
          : "https://static.xx.fbcdn.net/rsrc.php/v3/y9/r/YAYXsGNV5rp.png",
        tag: message.conversationId || "messenger-message",
        requireInteraction: true,
        silent: false,
      };

      if (message.isImage && message.imageBase64) {
        notificationOptions.image = message.imageBase64;
      }

      const notification = new Notification(
        \`\${message.userName || "Messenger"} 发来新消息\`,
        notificationOptions
      );

      console.log("✅ 通知已发送:", {
        标题: \`\${message.userName || "Messenger"} 发来新消息\`,
        内容: notificationOptions.body,
        对话ID: message.conversationId
      });

      notification.onclick = () => {
        console.log("🖱️ 通知被点击，准备打开对话:", message.conversationId);
        window.focus();
        
        if (message.conversationId && this.autoOpenEnabled) {
          this.delayedOpenConversation(message.conversationId, 500);
        }
        
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 8000);

    } catch (error) {
      console.error("❌ 创建通知失败:", error);
      this.showFallbackAlert(message);
    }
  }

  showFallbackAlert(message) {
    console.log("⚠️ 使用降级通知方案");
    const alertMessage = \`新消息来自 \${message.userName || "Messenger"}: \${message.isImage ? "[图片消息]" : message.messagePreview}\`;
    console.log("🔔 " + alertMessage);
  }

  checkNotificationPermission() {
    console.log("🔔 当前通知权限状态:", Notification.permission);
    
    if (Notification.permission === "default") {
      console.log("💡 提示: 可以启用浏览器通知");
      console.log("  运行: Notification.requestPermission().then(console.log)");
    } else if (Notification.permission === "granted") {
      console.log("✅ 通知权限已授予");
    } else {
      console.log("❌ 通知权限被拒绝");
    }
  }

  // ==================== 工具方法 ====================
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  cleanupOldMessages() {
    const now = Date.now();
    const expired = [];
    this.knownListMessages.forEach((timestamp, id) => {
      if (now - timestamp > MessengerMessageListener.CONFIG.MESSAGE_ID_TTL) {
        expired.push(id);
      }
    });
    expired.forEach((id) => this.knownListMessages.delete(id));
  }

  startCleanupTask() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMessages();
    }, 60000);
  }

  isDebugMode() {
    return window.messengerListenerDebug === true;
  }

  log(...args) {
    if (this.isDebugMode()) {
      console.log(...args);
    }
  }

  safeExecute(fn, context = "Unknown") {
    try {
      return fn();
    } catch (error) {
      console.error(\`❌ [\${context}] 执行出错:\`, error);
      return null;
    }
  }

  // ==================== 聊天标签页监听 ====================
  startChatTabMonitoring() {
    if (this.chatTabObserver) {
      this.log("⚠️ [标签页] 监听器已在运行");
      return;
    }

    this.log("🏠 [标签页] 启动聊天标签页监听器...");

    const chatTabLink = document.querySelector(MessengerMessageListener.SELECTORS.CHAT_TAB_LINK);
    
    if (!chatTabLink) {
      this.log("❌ [标签页] 未找到聊天标签页链接");
      return;
    }

    // 初始状态检测
    this.updateChatTabStatus();

    // 监听标签页变化
    this.chatTabObserver = new MutationObserver(() => {
      if (this.isDestroyed) return;
      this.updateChatTabStatus();
    });

    this.chatTabObserver.observe(chatTabLink, {
      attributes: true,
      attributeFilter: ['aria-label', 'aria-current']
    });

    this.log("✅ [标签页] 监听器已启动");
  }

  updateChatTabStatus() {
    return this.safeExecute(() => {
      const chatTabLink = document.querySelector(MessengerMessageListener.SELECTORS.CHAT_TAB_LINK);
      
      if (!chatTabLink) {
        return;
      }

      const ariaCurrent = chatTabLink.getAttribute('aria-current');
      const ariaLabel = chatTabLink.getAttribute('aria-label') || '';
      
      const wasInChatTab = this.isInChatTab;
      this.isInChatTab = ariaCurrent === 'page';
      
      const hasUnreadMessages = ariaLabel.includes('未读');
      const unreadMatch = ariaLabel.match(/(\\d+)条未读/);
      const unreadCount = unreadMatch ? parseInt(unreadMatch[1]) : 0;

      this.log(\`📊 [标签页] 状态更新: 在聊天界面=\${this.isInChatTab}, 未读消息=\${hasUnreadMessages}, 数量=\${unreadCount}\`);

      // 如果不在聊天界面但有未读消息,自动切换到聊天界面
      if (!this.isInChatTab && hasUnreadMessages) {
        this.log('🔔 [标签页] 检测到未读消息,切换到聊天界面');
        this.switchToChatTab();
      }

      // 如果从非聊天界面切换到聊天界面,重启列表监听
      if (!wasInChatTab && this.isInChatTab) {
        this.log('✅ [标签页] 已进入聊天界面,重启列表监听');
        this.stopListMonitoring();
        setTimeout(() => this.startListMonitoring(), 300);
      }
    }, "updateChatTabStatus");
  }

  switchToChatTab() {
    return new Promise((resolve) => {
      this.safeExecute(() => {
        const link = document.querySelector(MessengerMessageListener.SELECTORS.CHAT_TAB_LINK);
        if (!link) {
          this.log("❌ 未找到聊天标签页");
          resolve(false);
          return;
        }

        this.log("🖱️ 强制点击进入聊天标签页");
        link.click();

        setTimeout(() => {
          this.isInChatTab = true;
          this.stopListMonitoring();
          this.startListMonitoring();
          resolve(true);
        }, 600);
      }, "switchToChatTab") || resolve(false);
    });
  }

  stopChatTabMonitoring() {
    if (this.chatTabObserver) {
      this.chatTabObserver.disconnect();
      this.chatTabObserver = null;
      this.log("⏹️ [标签页] 监听器已停止");
    }
  }

  // ==================== 对话ID提取 ====================
  extractConversationId(href) {
    if (!href) return null;
    const match = href.match(/\\/t\\/(\\d+)|\\/(\\d+)\\//);
    return match ? (match[1] || match[2]) : null;
  }

  // ==================== 列表信息提取 ====================
  getLinkStatus(element) {
    return this.safeExecute(() => {
      const link = element.querySelector('a[href*="/e2ee/t/"]');
      if (!link) return null;

      const href = link.getAttribute("href");
      const ariaCurrent = link.getAttribute("aria-current");
      const tabIndex = link.getAttribute("tabindex");

      return {
        href,
        conversationId: this.extractConversationId(href),
        isCurrentPage: ariaCurrent === "page",
        tabIndex,
        isOpen: ariaCurrent === "page" && tabIndex === "0",
        isClosed: ariaCurrent === "false" && tabIndex === "-1",
      };
    }, "getLinkStatus");
  }

  extractListMessageInfo(element) {
    const info = {
      userName: "",
      messagePreview: "",
      time: Date.now(),
      isUnread: false,
      conversationLink: "",
      conversationId: "",
      isCurrentOpen: false,
      linkStatus: null,
      element: element,
      isImage: false,
      imageBase64: "",
    };

    return this.safeExecute(() => {
      const linkStatus = this.getLinkStatus(element);
      if (linkStatus) {
        Object.assign(info, {
          conversationLink: linkStatus.href,
          conversationId: linkStatus.conversationId,
          isCurrentOpen: linkStatus.isOpen,
          linkStatus: linkStatus,
        });
      }

      const userNameSpan = element.querySelector(MessengerMessageListener.SELECTORS.USER_NAME);
      info.userName=userNameSpan.textContent.trim();
      

      const allText = element.textContent;
      const hasUnreadIndicator = allText.includes("未读消息：");
      info.isUnread = hasUnreadIndicator;

      if (hasUnreadIndicator) {
        const lines = allText.split("\\n").filter((line) => line.trim());
        for (const line of lines) {
          if (line.includes("未读消息：")) {
            const parts = line.split("未读消息：");
            if (parts.length > 1) {
              info.messagePreview = parts[1].split("·")[0].trim();
            }
            break;
          }
        }

        const imageElement = element.querySelector(MessengerMessageListener.SELECTORS.IMAGE_MESSAGE);
        if (imageElement) {
          info.isImage = true;
          info.messagePreview = "[图片消息]";
          const src = imageElement.getAttribute("src");
          if (src && src.startsWith("data:image")) {
            info.imageBase64 = src;
          }
        }

        if (!info.messagePreview || info.messagePreview.trim() === "") {
          const emojiElements = element.querySelectorAll('img[alt][src*="emoji.php"], img[alt][src*="/images/emoji.php"]');
          if (emojiElements.length > 0) {
            const emojiTexts = Array.from(emojiElements)
              .map(img => img.getAttribute('alt') || '')
              .filter(alt => alt.trim() !== '')
              .join(' ');
            
            if (emojiTexts) {
              info.messagePreview = emojiTexts;
            }
          }
        }
      } else {
        const textLines = allText.split("\\n").filter((line) => line.trim());
        let foundPreview = false;
        
        for (const line of textLines) {
          if (line.startsWith("你:")) {
            info.messagePreview = line.trim();
            foundPreview = true;
            break;
          }
        }
        
        if (!foundPreview) {
          const emojiElements = element.querySelectorAll('img[alt][src*="emoji.php"], img[alt][src*="/images/emoji.php"]');
          if (emojiElements.length > 0) {
            const emojiTexts = Array.from(emojiElements)
              .map(img => img.getAttribute('alt') || '')
              .filter(alt => alt.trim() !== '')
              .join(' ');
            
            if (emojiTexts) {
              info.messagePreview = emojiTexts;
            }
          }
        }

        const imageElement = element.querySelector(MessengerMessageListener.SELECTORS.IMAGE_MESSAGE);
        if (imageElement) {
          info.isImage = true;
          info.messagePreview = "[图片消息]";
          const src = imageElement.getAttribute("src");
          if (src && src.startsWith("data:image")) {
            info.imageBase64 = src;
          }
        }
      }

      info.time = Date.now();

      return info;
    }, "extractListMessageInfo") || info;
  }

  // ==================== 列表监听 ====================
  startListMonitoring() {
    if (this.listObserver) {
      this.log("⚠️ [列表] 监听器已在运行");
      return;
    }

    this.log("🚀 [列表] 启动列表监听器...");

    const targetNode = document.querySelector(MessengerMessageListener.SELECTORS.THREAD_LIST);
    
    if (!targetNode) {
      this.log("❌ [列表] 未找到消息列表容器");
      return;
    }

    this.log("✅ [列表] 找到消息列表容器，启动监听");

    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    };

    const debouncedCheck = this.debounce(() => {
      this.checkListForNewMessages();
    }, MessengerMessageListener.CONFIG.CHECK_DEBOUNCE);

    this.listObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed) return;
      
      const hasChange = mutations.some(mutation => {
        return mutation.type === 'childList' || 
               mutation.type === 'characterData' ||
               (mutation.type === 'attributes' && mutation.attributeName === 'aria-current');
      });

      if (hasChange) {
        this.log(\`📝 [列表] 检测到DOM变化\`);
        debouncedCheck();
      }
    });

    this.listObserver.observe(targetNode, config);
    
    setTimeout(() => {
      this.checkListForNewMessages();
    }, 200);
    
    this.log("✅ [列表] 监听器已启动并持续运行");
  }

  checkListForNewMessages() {
    if (this.isDestroyed) return;
    
    this.log("🔍 [列表] 扫描消息列表...");

    const messageRows = document.querySelectorAll(MessengerMessageListener.SELECTORS.THREAD_ROW);
    let unreadCount = 0;
    let newMessagesFound = 0;

    messageRows.forEach((row) => {
      const info = this.extractListMessageInfo(row);

      if (info.isUnread) {
        unreadCount++;

        // 过滤自己发送的消息
        if (info.messagePreview?.startsWith('你:')) {
          this.log('⏭️ [列表] 跳过自己的消息');
          return;
        }

        // 过滤临时状态
        if (info.messagePreview?.includes('正在发送') || info.messagePreview?.includes('正在输入')) {
          this.log('⏭️ [列表] 跳过临时状态');
          return;
        }

        // 去重检查
        const messageId = this.generateHash(\`\${info.conversationId}-\${info.messagePreview}\`);
        if (this.knownListMessages.has(messageId)) {
          return;
        }

        // 记录新消息
        this.knownListMessages.set(messageId, Date.now());
        newMessagesFound++;

        this.log(\`🆕 [列表] 新消息: \${info.userName} - \${info.messagePreview}\`);
        this.notifyCallbacks(info, "列表监听");
      }
    });

    this.log(\`📊 [列表] 总计 \${unreadCount} 条未读, \${newMessagesFound} 条新消息\`);
  }

  stopListMonitoring() {
    if (this.listObserver) {
      this.listObserver.disconnect();
      this.listObserver = null;
      this.log("⏹️ [列表] 监听器已停止");
    }
  }

  // ==================== 根观察器 ====================
  startRootMonitoring() {
    if (this.rootObserver) return;

    this.rootObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed) return;

      let shouldRestartList = false;

      for (const mutation of mutations) {
        if (mutation.type !== 'childList') continue;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // 检测列表容器
          if (node.matches && node.matches(MessengerMessageListener.SELECTORS.THREAD_LIST) ||
              node.querySelector && node.querySelector(MessengerMessageListener.SELECTORS.THREAD_LIST)) {
            shouldRestartList = true;
          }
        }
      }

      if (shouldRestartList) {
        this.stopListMonitoring();
        setTimeout(() => this.startListMonitoring(), 100);
      }
    });

    this.rootObserver.observe(document.body, { childList: true, subtree: true });
  }

  stopRootMonitoring() {
    if (this.rootObserver) {
      this.rootObserver.disconnect();
      this.rootObserver = null;
      this.log("⏹️ 根观察器已停止");
    }
  }

  // ==================== 启动和停止方法 ====================
  start() {
    console.log("🚀 启动 Messenger 列表监听器...");
    this.isDestroyed = false;

    this.checkNotificationPermission();

    this.startRootMonitoring();
    this.startChatTabMonitoring();
    this.startListMonitoring();

    console.log("✅ 列表监听器已启动");
  }

  stop() {
    console.log("⏹️ 停止所有监听器...");
    this.isDestroyed = true;

    this.stopRootMonitoring();
    this.stopChatTabMonitoring();
    this.stopListMonitoring();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log("✅ 所有监听器已停止");
  }

  getDebugStatus() {
    return {
      isInChatTab: this.isInChatTab,
      currentURL: window.location.href,
      chatTabStatus: this.getChatTabInfo(),
      knownMessagesCount: this.knownListMessages.size,
    };
  }

  getChatTabInfo() {
    const chatTabLink = document.querySelector(MessengerMessageListener.SELECTORS.CHAT_TAB_LINK);
    if (!chatTabLink) return null;
    
    return {
      ariaCurrent: chatTabLink.getAttribute('aria-current'),
      ariaLabel: chatTabLink.getAttribute('aria-label'),
    };
  }

  destroy() {
    this.stop();
    this.callbacks = [];
    this.knownListMessages.clear();
    console.log("💥 监听器已销毁");
  }

  manualCheck() {
    console.log("🔧 手动触发检查...");
    this.checkListForNewMessages();
  }

  enableDebug() {
    window.messengerListenerDebug = true;
    console.log("🐛 调试模式已启用");
  }

  disableDebug() {
    window.messengerListenerDebug = false;
    console.log("🐛 调试模式已禁用");
  }
}

// ==================== 初始化 ====================
const listener = new MessengerMessageListener();

// 注册消息回调
listener.onNewMessage(async(message, source) => {
  console.log("");
  console.log("📨 ========== 收到新消息！ ==========");
  console.log("🆔 对话 ID:", message.conversationId);
  console.log("👤 发送人:", message.userName);
  console.log("💬 消息预览:", message.messagePreview);
  console.log("📷 是否图片:", message.isImage ? "是" : "否");
  if (message.isImage && message.imageBase64) {
    console.log("🖼️ 图片 Base64:", message.imageBase64.substring(0, 50) + "...");
  }
  console.log("⏰ 时间:", new Date(message.time).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
  console.log("📍 来源:", source);
  console.log("=====================================");
  console.log("");

  // 🔥 过滤系统消息和多媒体消息
  const systemMessages = [
    '发送了贴图',
    '发送了语音消息', 
    '发送了附件',
    '发送了照片',
    '发送了动图',
    '发送了视频',
    'sent a sticker',
    'sent a voice message',
    'sent an attachment',
    'sent a photo',
    'sent a GIF',
  ];

  const isSystemMessage = systemMessages.some(msg => 
    message.messagePreview?.includes(msg)
  );

  if (isSystemMessage) {
    console.log('⏭️ 跳过系统/多媒体消息，不触发知识库');
    return;
  }

  // 只有在消息为纯文本且配置了知识库时才触发
  if (
    message.messagePreview && !message.isImage &&
    pluginConfig?.knowledge?.enableRetrieval &&
    pluginConfig?.knowledge?.selectedKnowledgeBase
  ) {
    console.log('触发知识库检索，消息内容:', message.messagePreview);
    const response = await window.electronAPI.sendKnowledgeBaseMessage(
      message.messagePreview,
      pluginConfig?.knowledge
    );
    window?.replaceAndSend(response);
  }
});

// 启用自动打开功能
listener.enableAutoOpen(1000);

// 延迟启动以等待页面加载
setTimeout(() => {
  listener.start();
}, 1000);

console.log("📋 可用命令:");
console.log("  listener.manualCheck()        - 手动触发检查");
console.log("  listener.stop()               - 停止监听");
console.log("  listener.start()              - 重新启动");
console.log("  listener.enableDebug()        - 启用调试日志");
console.log("  listener.enableAutoOpen()     - 启用自动打开");
console.log("  listener.disableAutoOpen()    - 禁用自动打开");
console.log("  listener.getDebugStatus()     - 查看调试状态");
console.log("");

window.listener = listener;

if (Notification.permission === "default") {
  console.log("💡 运行 Notification.requestPermission() 启用桌面通知");
}
`;
