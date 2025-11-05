export const newFacebookMessage = `
// Messenger 双模式新消息监听器 - 补全 onNewMessage 方法
class MessengerMessageListener {
  static CONFIG = {
    CHECK_DEBOUNCE: 500,
    CONVERSATION_DEBOUNCE: 500,
    MAX_KNOWN_MESSAGES: 1000,
    MESSAGE_ID_TTL: 3600000,
  };

  static SELECTORS = {
    THREAD_LIST: '[data-pagelet="MWThreadList"]',
    THREAD_ROW: '[data-pagelet="MWThreadListThreadListRow"]',
    MESSAGE_CONTAINER: '[data-pagelet="MWMessagesContainer"], [data-pagelet="MWV2MessageList"], div[role="grid"]',
    MESSAGE_ROW: '[data-pagelet="MWMessageRow"], div[data-testid="message-row"], .x1n2onr6[role="row"]',
    OPEN_LINK: 'a[aria-current="page"][tabindex="0"][href*="/messages/"], a[href*="/100049012266806/"]',
    USER_NAME: 'span.xdmh292[dir="auto"], span.x1hyvwdk.xjm9jq1',
    IMAGE_MESSAGE: "img.xz74otr.xmz0i5r.x193iq5w",
  };

  constructor() {
    this.listObserver = null;
    this.conversationObserver = null;
    this.rootObserver = null;
    
    this.knownListMessages = new Map();
    this.lastSnapshot = [];
    this.lastTailHash = "";
    this.recentConvoMessages = new Set();
    
    this.callbacks = [];
    this.currentOpenConversationId = null;
    this.isInConversationPage = false;
    
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

      const conversationUrl = \`https://www.facebook.com/messages/e2ee/t/\${conversationId}/\`;

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

      const conversationLink = document.querySelector(\`a[href*="/messages/e2ee/t/\${conversationId}/"], a[href*="/\${conversationId}/"]\`);
      
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

  // ==================== 对话检测 ====================
  extractConversationId(href) {
    if (!href) return null;
    const match = href.match(/\\/messages\\/e2ee\\/t\\/(\\d+)|\\/(\\d+)\\//);
    return match ? (match[1] || match[2]) : null;
  }

  detectOpenConversation() {
  return this.safeExecute(() => {
    let conversationId = null;
    let isOpen = false;

    // 1. 弹窗模式检测（优先）
    const chatTabHeader = document.querySelector('[data-pagelet="MWChatTabHeader"]');
    if (chatTabHeader) {
      const urlMatch = window.location.href.match(/\\/messages\\/e2ee\\/t\\/(\\d+)/);
      conversationId = urlMatch ? urlMatch[1] : null;
      isOpen = !!conversationId;
    }

    // 2. 全屏模式检测（备用）
    if (!isOpen) {
      const openLink = document.querySelector('a[aria-current="page"][tabindex="0"][href*="/messages/"]');
      if (openLink) {
        conversationId = this.extractConversationId(openLink.getAttribute("href"));
        isOpen = !!conversationId;
      }
    }

    // 3. 状态更新
    const conversationChanged = conversationId !== this.currentOpenConversationId;

    if (isOpen && conversationId) {
      if (conversationChanged) {
        this.log(\`📂 对话切换: \${this.currentOpenConversationId} -> \${conversationId}\`);
        this.currentOpenConversationId = conversationId;
        this.isInConversationPage = true;
        this.lastSnapshot = [];
        this.lastTailHash = "";
        this.recentConvoMessages.clear();
        this.stopConversationMonitoring();
        setTimeout(() => this.startConversationMonitoring(), 100);
      } else {
        this.isInConversationPage = true;
      }
      return conversationId;
    } else {
      if (this.isInConversationPage) {
        this.log('📋 离开对话页面');
        this.stopConversationMonitoring();
        this.recentConvoMessages.clear();
      }
      this.isInConversationPage = false;
      this.currentOpenConversationId = null;
      return null;
    }
  }, "detectOpenConversation");
}

  // ==================== 列表信息提取 ====================
  getLinkStatus(element) {
    return this.safeExecute(() => {
      const link = element.querySelector('a[href*="/messages/"]');
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
      if (userNameSpan) {
        const nameElement = userNameSpan.querySelector("span.xuxw1ft");
        if (nameElement) {
          info.userName = nameElement.textContent.trim();
        }
      }

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

  // ==================== 对话消息提取 ====================
  extractSingleMessage(messageRow) {
    const info = {
      sender: "",
      content: "",
      timestamp: Date.now(),
      isSentByMe: false,
      isImage: false,
      imageBase64: "",
    };

    return this.safeExecute(() => {
      const sentByMeIndicators = [
        messageRow.querySelector("h5 span"),
        messageRow.querySelector('[data-testid="sent-message"]'),
        messageRow.querySelector('div[aria-label*="你发送了"]'),
      ];
      info.isSentByMe = sentByMeIndicators.some((indicator) =>
        indicator?.textContent.includes("你发送了")
      );

      if (info.isSentByMe) {
        info.sender = "你";
      } else {
        const senderSelectors = 'span.x1hyvwdk.xjm9jq1, span[dir="auto"].x1lliihq, h4 span, span.xzpqnlu.x1hyvwdk.xjm9jq1';
        const senderSpan = messageRow.querySelector(senderSelectors);
        if (senderSpan) info.sender = senderSpan.textContent.trim();
      }

      const { content, imageBase64 } = this.extractMessageContent(messageRow, info.sender);
      info.content = content;
      info.imageBase64 = imageBase64;

      const imageElement = messageRow.querySelector(MessengerMessageListener.SELECTORS.IMAGE_MESSAGE);
      if (imageElement) {
        info.isImage = true;
        if (!info.content) info.content = "[图片消息]";
      }

      info.timestamp = Date.now();

      return info;
    }, "extractSingleMessage") || info;
  }

  extractMessageContent(messageRow, senderName) {
    const result = { content: "", imageBase64: "" };

    const imageElement = messageRow.querySelector(MessengerMessageListener.SELECTORS.IMAGE_MESSAGE);
    if (imageElement) {
      result.content = "[图片消息]";
      const src = imageElement.getAttribute("src");
      if (src && src.startsWith("data:image")) {
        result.imageBase64 = src;
      }
      return result;
    }

    const contentSelectors = 'div[dir="auto"][style*="text-align: start;"] > span.xexx8yu, div[dir="auto"].x1gslohp, div[role="textbox"], span[dir="auto"].xexx8yu';
    const contentElement = messageRow.querySelector(contentSelectors);

    if (!contentElement) {
      const emojiElements = messageRow.querySelectorAll('img[alt][src*="emoji.php"], img[alt][src*="/images/emoji.php"]');
      if (emojiElements.length > 0) {
        const emojiTexts = Array.from(emojiElements)
          .map(img => img.getAttribute('alt') || '')
          .filter(alt => alt.trim() !== '')
          .join(' ');
        
        if (emojiTexts) {
          result.content = emojiTexts;
        }
      }
      return result;
    }

    let rawContent = contentElement.textContent.trim().replace(/Enter$|输入中|typing/g, "").trim();

    if (rawContent === senderName || (rawContent.includes("今天") && rawContent.match(/\\d+:\\d+/))) {
      rawContent = "";
    }

    if (!rawContent) {
      const emojiImg = contentElement.querySelector(\`img[alt][src*="emoji.php"], img[alt][src*="/images/emoji.php"], img[alt]:not([class*="x1rg5ohu"]):not([alt="\${senderName}"]) \`);
      if (emojiImg?.alt) {
        result.content = emojiImg.alt.trim();
        return result;
      }
    }

    const hasEmoji = contentElement.querySelector("img[alt]");
    if (hasEmoji) {
      const childElements = contentElement.querySelectorAll('span, div[dir="auto"], img[alt]');
      const mixedContent = Array.from(childElements)
        .map((el) => {
          if (el.textContent?.trim()) return el.textContent.trim();
          if (el.tagName === "IMG" && el.alt?.trim() && el.alt !== senderName) {
            return el.alt.trim();
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");

      result.content = mixedContent || rawContent;
      return result;
    }

    result.content = rawContent;
    return result;
  }

  recordMessageSnapshot(rows) {
    const snapshot = [];
    for (const row of rows) {
      const msgInfo = this.extractSingleMessage(row);
      if (msgInfo.content) {
        snapshot.push(msgInfo.content);
      }
    }
    return snapshot;
  }

  detectTailHashChange(currentSnapshot) {
    if (currentSnapshot.length === 0) return false;

    const currentTailHash = currentSnapshot[currentSnapshot.length - 1];
    const hasTailChange = currentTailHash !== this.lastTailHash;

    this.lastTailHash = currentTailHash;

    if (hasTailChange) {
      this.log("🆕 [对话] 检测到末尾哈希变化！");
    }

    return hasTailChange;
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

      // 🔥 关键：跳过当前打开的对话
      if (this.isInConversationPage && info.conversationId === this.currentOpenConversationId) {
        this.log(\`⏭️ [列表] 跳过当前对话: \${info.conversationId}\`);
        const previewHash = this.generateHash(info.messagePreview);
        this.recentConvoMessages.add(previewHash);
        return;
      }

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

      const previewHash = this.generateHash(info.messagePreview);
      if (this.recentConvoMessages.has(previewHash)) {
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
    if (this.rootObserver) {
      return;
    }

    this.log("🌐 启动根观察器...");

    this.rootObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed) return;

      const hasNewListContainer = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches && node.matches(MessengerMessageListener.SELECTORS.THREAD_LIST)) {
                return true;
              }
              if (node.querySelector && node.querySelector(MessengerMessageListener.SELECTORS.THREAD_LIST)) {
                return true;
              }
            }
          }
        }
        return false;
      });

      if (hasNewListContainer) {
        this.log("🔄 [根观察] 检测到列表容器出现，重新启动列表监听");
        this.stopListMonitoring();
        setTimeout(() => this.startListMonitoring(), 100);
      }
    });

    this.rootObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.log("✅ 根观察器已启动");
  }

  stopRootMonitoring() {
    if (this.rootObserver) {
      this.rootObserver.disconnect();
      this.rootObserver = null;
      this.log("⏹️ 根观察器已停止");
    }
  }

  // ==================== 对话监听 ====================
  startConversationMonitoring() {
    if (!this.isInConversationPage) {
      this.log("⚠️ [对话] 未在对话页面,跳过启动");
      return;
    }

    if (this.conversationObserver) {
      this.log("⚠️ [对话] 监听器已在运行");
      return;
    }

    this.log("🎯 [对话] 启动对话监听器...");

    const messageContainer =
      document.querySelector(MessengerMessageListener.SELECTORS.MESSAGE_CONTAINER) ||
      document.querySelector('div[role="main"]') ||
      document.body;

    const getMessageRows = () => Array.from(document.querySelectorAll(MessengerMessageListener.SELECTORS.MESSAGE_ROW));
    const initialRows = getMessageRows();
    this.lastSnapshot = this.recordMessageSnapshot(initialRows);

    if (this.lastSnapshot.length > 0) {
      this.lastTailHash = this.lastSnapshot[this.lastSnapshot.length - 1];
    }

    this.log(\`[对话] 初始快照: \${this.lastSnapshot.length} 条消息\`);

    const debouncedCheck = this.debounce(() => {
      this.handleConversationMutations(getMessageRows);
    }, MessengerMessageListener.CONFIG.CONVERSATION_DEBOUNCE);

    this.conversationObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed || !this.isInConversationPage) return;

      const hasChange = mutations.some(mutation => mutation.type === 'childList' || mutation.type === 'characterData');

      if (hasChange) {
        this.log(\`📝 [对话] 检测到DOM变化\`);
        debouncedCheck();
      }
    });

    this.conversationObserver.observe(messageContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this.log("✅ [对话] 监听器已启动");
  }

  handleConversationMutations(getMessageRows) {
    if (this.isDestroyed || !this.isInConversationPage) return;

    const currentRows = getMessageRows();
    const currentSnapshot = this.recordMessageSnapshot(currentRows);
    const lastLen = this.lastSnapshot.length;
    const currLen = currentSnapshot.length;
    const snapshotChange = Math.abs(currLen - lastLen);

    const hasLengthChange = snapshotChange > 0;
    const hasTailChange = this.detectTailHashChange(currentSnapshot);

    if (!hasLengthChange && !hasTailChange) {
      this.log(\`[对话] 无变化\`);
      return;
    }

    let prefixMatch = false;
    let suffixMatch = false;
    let isNewMessage = false;
    let isHistoryLoad = false;

    if (hasLengthChange) {
      if (currLen < lastLen) {
        this.log(\`[对话] 快照长度减少 (\${snapshotChange})，忽略\`);
        this.lastSnapshot = currentSnapshot;
        return;
      }

      const lastStr = this.lastSnapshot.join('||');
      const currStr = currentSnapshot.join('||');

      prefixMatch = currentSnapshot.slice(0, lastLen).join('||') === lastStr;
      suffixMatch = currentSnapshot.slice(-lastLen).join('||') === lastStr;

      if (prefixMatch && hasTailChange) {
        isNewMessage = true;
        this.log(\`📨 [对话] 确认新增末尾消息！(前缀匹配 + 尾变)\`);
      } else if (suffixMatch) {
        isHistoryLoad = true;
        this.log(\`📜 [对话] 检测到历史加载: +\${snapshotChange} 条 (后缀匹配)\`);
      } else if (hasTailChange) {
        isNewMessage = true;
        this.log(\`📨 [对话] 确认其他变化新消息！(尾变)\`);
      } else {
        this.log(\`[对话] 变化但无尾变 (可能抖动): 长度\${snapshotChange}, 前缀\${prefixMatch}, 后缀\${suffixMatch}\`);
      }
    } else {
      isNewMessage = hasTailChange;
    }

    const isHistoryLoadFinal = isHistoryLoad || snapshotChange > 3;

    this.log(\`📨 [对话] 检测到变化！长度变化: \${snapshotChange}, 末尾变化: \${hasTailChange}, 前缀: \${prefixMatch}, 后缀: \${suffixMatch}\`);

    if (isNewMessage && !isHistoryLoadFinal) {
      const newRow = currentRows[currentRows.length - 1];
      const newMessage = this.extractSingleMessage(newRow);

      if (newMessage.content && !newMessage.isSentByMe) {
        this.log(\`💬 [对话] 新消息: \${newMessage.sender} - \${newMessage.content.substring(0, 30)}\`);

        const notificationInfo = {
          userName: newMessage.sender !== "你" ? newMessage.sender : "",
          messagePreview: newMessage.content,
          time: newMessage.timestamp,
          isUnread: true,
          conversationLink: "",
          conversationId: this.currentOpenConversationId,
          isCurrentOpen: true,
          linkStatus: null,
          element: newRow,
          isImage: newMessage.isImage,
          imageBase64: newMessage.imageBase64,
        };

        const previewHash = this.generateHash(newMessage.content);
        this.recentConvoMessages.add(previewHash);

        this.notifyCallbacks(notificationInfo, "对话监听");
      } else {
        this.log(\`⚠️ [对话] 最后行无有效内容或为己发，忽略\`);
      }
    } else if (isHistoryLoadFinal && !isNewMessage) {
      this.log(\`⏭️ [对话] 忽略历史/大批量加载\`);
    }

    this.lastSnapshot = currentSnapshot;
  }

  stopConversationMonitoring() {
    if (this.conversationObserver) {
      this.conversationObserver.disconnect();
      this.conversationObserver = null;
      this.lastSnapshot = [];
      this.lastTailHash = "";
      this.recentConvoMessages.clear();
      this.log("⏹️ [对话] 监听器已停止");
    }
  }

  // ==================== 启动和停止方法 ====================
  start() {
    console.log("🚀 启动 Messenger 双模式监听器...");
    this.isDestroyed = false;

    this.checkNotificationPermission();

    this.startRootMonitoring();

    this.startListMonitoring();

    this.detectOpenConversation();

    const checkInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(checkInterval);
        return;
      }
      this.detectOpenConversation();
    }, 1000);

    console.log("✅ 双模式监听器已启动");
  }

  stop() {
    console.log("⏹️ 停止所有监听器...");
    this.isDestroyed = true;

    this.stopRootMonitoring();
    this.stopListMonitoring();
    this.stopConversationMonitoring();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    console.log("✅ 所有监听器已停止");
  }
  getDebugStatus() {
  return {
    isInConversationPage: this.isInConversationPage,
    currentOpenConversationId: this.currentOpenConversationId,
    currentURL: window.location.href,
    hasChatTab: !!document.querySelector('[data-pagelet="MWChatTabHeader"]'),
  };
}

  destroy() {
    this.stop();
    this.callbacks = [];
    this.knownListMessages.clear();
    this.recentConvoMessages.clear();
    console.log("💥 监听器已销毁");
  }

  manualCheck() {
    console.log("🔧 手动触发检查...");
    this.checkListForNewMessages();
    
    if (this.isInConversationPage) {
      const getMessageRows = () => Array.from(document.querySelectorAll(MessengerMessageListener.SELECTORS.MESSAGE_ROW));
      this.handleConversationMutations(getMessageRows);
    }
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

// 现在可以安全地使用 onNewMessage 方法了
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
  console.log("📂 对话状态:", message.isCurrentOpen ? "已打开" : "未打开");
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
    // 你的知识库处理代码
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
console.log("");

window.messengerListener = listener;

if (Notification.permission === "default") {
  console.log("💡 运行 Notification.requestPermission() 启用桌面通知");
}
`;
