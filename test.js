// Messenger 双模式新消息监听器 - 优化表情和图片提取
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
    IMAGE_MESSAGE: "img.xz74otr.xmz0i5r.x193iq5w", // 图片消息选择器
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

    this.startCleanupTask();
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
      console.error(`❌ [${context}] 执行出错:`, error);
      return null;
    }
  }

  // ==================== 对话检测 ====================
  extractConversationId(href) {
    if (!href) return null;
    const match = href.match(/\/messages\/e2ee\/t\/(\d+)|\/(\d+)\//);
    return match ? (match[1] || match[2]) : null;
  }

  detectOpenConversation() {
    return this.safeExecute(() => {
      const openLink = document.querySelector(MessengerMessageListener.SELECTORS.OPEN_LINK);
      if (openLink) {
        const conversationId = this.extractConversationId(openLink.getAttribute("href"));
        const conversationChanged = conversationId !== this.currentOpenConversationId;

        if (conversationChanged) {
          this.log(`📂 对话切换: ${this.currentOpenConversationId} -> ${conversationId}`);
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
          this.log(`📋 离开对话页面`);
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
        const lines = allText.split("\n").filter((line) => line.trim());
        for (const line of lines) {
          if (line.includes("未读消息：")) {
            const parts = line.split("未读消息：");
            if (parts.length > 1) {
              info.messagePreview = parts[1].split("·")[0].trim();
            }
            break;
          }
        }

        // 检查是否为图片消息
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

  // ==================== 对话消息提取 - 借鉴优化版本 ====================
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
      // 检测是否是自己发送的消息
      const sentByMeIndicators = [
        messageRow.querySelector("h5 span"),
        messageRow.querySelector('[data-testid="sent-message"]'),
        messageRow.querySelector('div[aria-label*="你发送了"]'),
      ];
      info.isSentByMe = sentByMeIndicators.some((indicator) =>
        indicator?.textContent.includes("你发送了")
      );

      // 提取发送者
      if (info.isSentByMe) {
        info.sender = "你";
      } else {
        const senderSelectors = 'span.x1hyvwdk.xjm9jq1, span[dir="auto"].x1lliihq, h4 span, span.xzpqnlu.x1hyvwdk.xjm9jq1';
        const senderSpan = messageRow.querySelector(senderSelectors);
        if (senderSpan) info.sender = senderSpan.textContent.trim();
      }

      // 提取内容和base64 - 使用借鉴的优化方法
      const { content, imageBase64 } = this.extractMessageContent(messageRow, info.sender);
      info.content = content;
      info.imageBase64 = imageBase64;

      // 检查是否为图片消息
      const imageElement = messageRow.querySelector(MessengerMessageListener.SELECTORS.IMAGE_MESSAGE);
      if (imageElement) {
        info.isImage = true;
        if (!info.content) info.content = "[图片消息]";
      }

      info.timestamp = Date.now();

      return info;
    }, "extractSingleMessage") || info;
  }

  // ==================== 消息内容提取 - 借鉴优化版本 ====================
  extractMessageContent(messageRow, senderName) {
    const result = { content: "", imageBase64: "" };

    // 首先检查是否为图片消息
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

    if (!contentElement) return result;

    let rawContent = contentElement.textContent.trim().replace(/Enter$|输入中|typing/g, "").trim();

    // 过滤掉发送者名称和时间信息
    if (rawContent === senderName || (rawContent.includes("今天") && rawContent.match(/\d+:\d+/))) {
      rawContent = "";
    }

    // 处理纯表情消息
    if (!rawContent) {
      const emojiImg = contentElement.querySelector(`img[alt][src*="emoji.php"], img[alt]:not([class*="x1rg5ohu"]):not([alt="${senderName}"])`);
      if (emojiImg?.alt) {
        result.content = emojiImg.alt.trim();
        return result;
      }
    }

    // 处理混合内容（文本+表情）
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

  // 记录消息快照
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

  // 检测末尾哈希变化
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
        this.log(`📝 [列表] 检测到DOM变化`);
        debouncedCheck();
      }
    });

    this.listObserver.observe(targetNode, config);
    
    // 立即检查一次
    setTimeout(() => {
      this.checkListForNewMessages();
    }, 200);
    
    this.log("✅ [列表] 监听器已启动并持续运行");
  }

  checkListForNewMessages() {
    if (this.isDestroyed) return;
    
    this.log("🔍 [列表] 扫描消息列表...");

    const messageRows = document.querySelectorAll(MessengerMessageListener.SELECTORS.THREAD_ROW);
    this.log(`[列表] 找到 ${messageRows.length} 个对话`);

    let unreadCount = 0;
    let newMessagesFound = 0;

    messageRows.forEach((row) => {
      const info = this.extractListMessageInfo(row);

      if (info.isUnread) {
        unreadCount++;

        const messageId = this.generateHash(`${info.conversationId}-${info.messagePreview}`);

        // 去重逻辑
        const previewHash = this.generateHash(info.messagePreview);
        let skipDueToDuplicate = false;
        if (this.isInConversationPage && this.recentConvoMessages.has(previewHash)) {
          skipDueToDuplicate = true;
          this.log(`⏭️ [列表] 跳过重复消息: ${info.messagePreview.substring(0, 20)} (来自当前对话)`);
        }

        // 只通知未打开对话的新消息，且非重复
        if (info.messagePreview && !info.isCurrentOpen && !this.knownListMessages.has(messageId) && !skipDueToDuplicate) {
          this.knownListMessages.set(messageId, Date.now());
          newMessagesFound++;
          
          this.log(`🆕 [列表] 新未读消息: ${info.userName} - ${info.messagePreview.substring(0, 20)}`);
          this.notifyCallbacks(info, "列表监听");
        }
      }
    });

    this.log(`📊 [列表] 总计 ${unreadCount} 条未读, ${newMessagesFound} 条新消息`);
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

      // 检查是否有新的列表容器出现
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

    // 初始化快照
    const getMessageRows = () => Array.from(document.querySelectorAll(MessengerMessageListener.SELECTORS.MESSAGE_ROW));
    const initialRows = getMessageRows();
    this.lastSnapshot = this.recordMessageSnapshot(initialRows);

    if (this.lastSnapshot.length > 0) {
      this.lastTailHash = this.lastSnapshot[this.lastSnapshot.length - 1];
    }

    this.log(`[对话] 初始快照: ${this.lastSnapshot.length} 条消息`);

    const debouncedCheck = this.debounce(() => {
      this.handleConversationMutations(getMessageRows);
    }, MessengerMessageListener.CONFIG.CONVERSATION_DEBOUNCE);

    this.conversationObserver = new MutationObserver((mutations) => {
      if (this.isDestroyed || !this.isInConversationPage) return;

      const hasChange = mutations.some(mutation => mutation.type === 'childList' || mutation.type === 'characterData');

      if (hasChange) {
        this.log(`📝 [对话] 检测到DOM变化`);
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

  // 处理对话变化
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
      this.log(`[对话] 无变化`);
      return;
    }

    let prefixMatch = false;
    let suffixMatch = false;
    let isNewMessage = false;
    let isHistoryLoad = false;

    if (hasLengthChange) {
      if (currLen < lastLen) {
        this.log(`[对话] 快照长度减少 (${snapshotChange})，忽略`);
        this.lastSnapshot = currentSnapshot;
        return;
      }

      const lastStr = this.lastSnapshot.join('||');
      const currStr = currentSnapshot.join('||');

      prefixMatch = currentSnapshot.slice(0, lastLen).join('||') === lastStr;
      suffixMatch = currentSnapshot.slice(-lastLen).join('||') === lastStr;

      if (prefixMatch && hasTailChange) {
        isNewMessage = true;
        this.log(`📨 [对话] 确认新增末尾消息！(前缀匹配 + 尾变)`);
      } else if (suffixMatch) {
        isHistoryLoad = true;
        this.log(`📜 [对话] 检测到历史加载: +${snapshotChange} 条 (后缀匹配)`);
      } else if (hasTailChange) {
        isNewMessage = true;
        this.log(`📨 [对话] 确认其他变化新消息！(尾变)`);
      } else {
        this.log(`[对话] 变化但无尾变 (可能抖动): 长度${snapshotChange}, 前缀${prefixMatch}, 后缀${suffixMatch}`);
      }
    } else {
      isNewMessage = hasTailChange;
    }

    const isHistoryLoadFinal = isHistoryLoad || snapshotChange > 3;

    this.log(`📨 [对话] 检测到变化！长度变化: ${snapshotChange}, 末尾变化: ${hasTailChange}, 前缀: ${prefixMatch}, 后缀: ${suffixMatch}`);

    if (isNewMessage && !isHistoryLoadFinal) {
      const newRow = currentRows[currentRows.length - 1];
      const newMessage = this.extractSingleMessage(newRow);

      if (newMessage.content && !newMessage.isSentByMe) {
        this.log(`💬 [对话] 新消息: ${newMessage.sender} - ${newMessage.content.substring(0, 30)}`);

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
        this.log(`⚠️ [对话] 最后行无有效内容或为己发，忽略`);
      }
    } else if (isHistoryLoadFinal && !isNewMessage) {
      this.log(`⏭️ [对话] 忽略历史/大批量加载`);
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

  // ==================== 公共 API ====================
  notifyCallbacks(message, source = "") {
    this.callbacks.forEach((callback) => {
      try {
        callback(message, source);
      } catch (error) {
        console.error("❌ 回调执行出错:", error);
      }
    });
  }

  onNewMessage(callback) {
    if (typeof callback === "function") {
      this.callbacks.push(callback);
      console.log(`✅ 已添加回调函数，当前共 ${this.callbacks.length} 个回调`);
    }
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
      console.log(`✅ 已移除回调函数，剩余 ${this.callbacks.length} 个回调`);
    }
  }

  start() {
    console.log("🚀 启动 Messenger 双模式监听器...");
    this.isDestroyed = false;

    // 启动根观察器（检测列表容器出现）
    this.startRootMonitoring();

    // 尝试启动列表监听
    this.startListMonitoring();

    // 检测对话状态
    this.detectOpenConversation();

    // 定期检测对话切换
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

listener.onNewMessage((message, source) => {
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

  if (Notification.permission === "granted") {
    new Notification(`${message.userName || "Messenger"} 发来新消息`, {
      body: message.isImage ? "[图片消息]" : message.messagePreview,
      icon: message.isImage && message.imageBase64
        ? message.imageBase64
        : "https://static.xx.fbcdn.net/rsrc.php/v3/y9/r/YAYXsGNV5rp.png",
      tag: message.conversationId,
    });
  }
});

// 延迟启动以等待页面加载
setTimeout(() => {
  listener.start();
}, 1000);

console.log("📋 可用命令:");
console.log("  listener.manualCheck()   - 手动触发检查");
console.log("  listener.stop()          - 停止监听");
console.log("  listener.start()         - 重新启动");
console.log("  listener.enableDebug()   - 启用调试日志");
console.log("");

window.messengerListener = listener;

if (Notification.permission === "default") {
  console.log("💡 运行 Notification.requestPermission() 启用桌面通知");
}