// Messenger 新消息监听器 - 深度优化版 (移除时间戳依赖，添加图片消息支持，通知携带base64)
class MessengerMessageListener {
  // 配置常量
  static CONFIG = {
    CHECK_DEBOUNCE: 500,
    EXTRACT_DEBOUNCE: 300,
    MAX_KNOWN_MESSAGES: 1000, // 防止内存泄漏
    MESSAGE_ID_TTL: 3600000, // 1小时后清理旧消息ID
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  };

  // DOM 选择器常量 (移除时间相关选择器，添加图片选择器)
  static SELECTORS = {
    THREAD_LIST: '[data-pagelet="MWThreadList"]',
    THREAD_ROW: '[data-pagelet="MWThreadListThreadListRow"]',
    MESSAGE_CONTAINER: '[data-pagelet="MWMessagesContainer"]',
    MESSAGE_ROW:
      '[data-pagelet="MWMessageRow"], div[data-testid="message-row"], .x1n2onr6[role="row"]',
    OPEN_LINK: 'a[aria-current="page"][tabindex="0"][href*="/messages/"]',
    USER_NAME: 'span.xdmh292[dir="auto"]',
    IMAGE_MESSAGE: "img.xz74otr.xmz0i5r.x193iq5w", // 图片消息选择器
  };

  constructor() {
    this.observer = null;
    this.messageObserver = null;
    this.knownMessages = new Map(); // Map<ID, timestamp> - 仅用于列表页面
    this.callbacks = [];
    this.currentOpenConversationId = null;
    this.isInConversationPage = false;
    this.lastMessageCount = 0;
    this.lastSnapshot = [];
    this.lastTailHash = "";
    this.checkTimeout = null;
    this.extractTimeout = null;
    this.cleanupInterval = null;
    this.isDestroyed = false;
    this.retryCount = 0;

    // 启动定期清理
    this.startCleanupTask();
  }

  // ==================== 工具方法 ====================
  // 防抖工具
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 生成消息唯一ID (简化: 只用 conversationId + content，无时间戳)
  generateMessageId(content, conversationId) {
    const str = `${conversationId}-${content}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const id = hash.toString(36);
    if (this.isDebugMode()) {
      this.log(
        `🔑 生成消息 ID: ${id} (内容: ${content.substring(
          0,
          20
        )}..., 对话: ${conversationId.substring(0, 8)}...)`
      );
    }
    return id;
  }

  // 清理过期消息ID
  cleanupOldMessages() {
    const now = Date.now();
    const expired = [];

    this.knownMessages.forEach((timestamp, id) => {
      if (now - timestamp > MessengerMessageListener.CONFIG.MESSAGE_ID_TTL) {
        expired.push(id);
      }
    });
    expired.forEach((id) => this.knownMessages.delete(id));

    // 如果超过最大限制,删除最旧的
    if (
      this.knownMessages.size >
      MessengerMessageListener.CONFIG.MAX_KNOWN_MESSAGES
    ) {
      const sorted = Array.from(this.knownMessages.entries()).sort(
        (a, b) => a[1] - b[1]
      );
      const toDelete = sorted.slice(
        0,
        this.knownMessages.size -
          MessengerMessageListener.CONFIG.MAX_KNOWN_MESSAGES
      );
      toDelete.forEach(([id]) => this.knownMessages.delete(id));
    }
    if (expired.length > 0 && this.isDebugMode()) {
      console.log(`🧹 已清理 ${expired.length} 个过期消息ID`);
    }
  }

  // 按对话ID清理
  cleanupConversationMessages(conversationId) {
    const toDelete = [];
    this.knownMessages.forEach((timestamp, id) => {
      if (id.startsWith(conversationId.substring(0, 10))) {
        // 哈希前缀近似匹配
        toDelete.push(id);
      }
    });
    toDelete.forEach((id) => this.knownMessages.delete(id));
    if (this.isDebugMode()) {
      this.log(`🧹 已清理对话 ${conversationId} 的 ${toDelete.length} 个记录`);
    }
  }

  // 启动清理任务
  startCleanupTask() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMessages();
    }, 60000);
  }

  // 调试模式检测
  isDebugMode() {
    return window.messengerListenerDebug === true;
  }

  // 安全的 console.log
  log(...args) {
    if (this.isDebugMode()) {
      console.log(...args);
    }
  }

  // 错误处理包装器
  safeExecute(fn, context = "Unknown") {
    try {
      return fn();
    } catch (error) {
      console.error(`❌ [${context}] 执行出错:`, error);
      return null;
    }
  }

  // ==================== 核心提取逻辑 ====================
  // 从 href 提取对话 ID
  extractConversationId(href) {
    if (!href) return null;
    const match = href.match(/\/messages\/e2ee\/t\/(\d+)/);
    return match ? match[1] : null;
  }

  // 检测当前打开的对话
  detectOpenConversation() {
    return this.safeExecute(() => {
      const openLink = document.querySelector(
        MessengerMessageListener.SELECTORS.OPEN_LINK
      );
      if (openLink) {
        const conversationId = this.extractConversationId(
          openLink.getAttribute("href")
        );
        if (conversationId !== this.currentOpenConversationId) {
          this.log(`📂 当前打开的对话 ID: ${conversationId}`);
          // 清理旧对话记录
          if (this.currentOpenConversationId) {
            this.cleanupConversationMessages(this.currentOpenConversationId);
          }
          this.currentOpenConversationId = conversationId;
        }
        this.isInConversationPage = !!conversationId;
        return conversationId;
      }
      this.isInConversationPage = false;
      return null;
    }, "detectOpenConversation");
  }

  // 提取链接状态
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

  // 提取消息信息 (移除时间提取)
  extractMessageInfo(element) {
    const info = {
      userName: "",
      messagePreview: "",
      time: "", // 保留字段，但始终为空（或用当前时间显示）
      isUnread: false,
      conversationLink: "",
      conversationId: "",
      isCurrentOpen: false,
      linkStatus: null,
      element: element,
      isImage: false, // 标识是否为图片消息
    };
    return (
      this.safeExecute(() => {
        // 提取链接状态
        const linkStatus = this.getLinkStatus(element);
        if (linkStatus) {
          Object.assign(info, {
            conversationLink: linkStatus.href,
            conversationId: linkStatus.conversationId,
            isCurrentOpen: linkStatus.isOpen,
            linkStatus: linkStatus,
          });
        }
        // 提取用户名
        const userNameSpan = element.querySelector(
          MessengerMessageListener.SELECTORS.USER_NAME
        );
        if (userNameSpan) {
          const nameElement = userNameSpan.querySelector("span.xuxw1ft");
          if (nameElement) {
            info.userName = nameElement.textContent.trim();
          }
        }
        // 提取消息预览和未读状态
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
              // 检查是否为图片消息
              const imageElement = element.querySelector(
                MessengerMessageListener.SELECTORS.IMAGE_MESSAGE
              );
              if (imageElement) {
                info.isImage = true;
                info.messagePreview = "[图片消息]";
              }
              break;
            }
          }
        } else {
          const textLines = allText.split("\n").filter((line) => line.trim());
          for (const line of textLines) {
            if (line.startsWith("你:")) {
              info.messagePreview = line.trim();
              // 检查是否为图片消息
              const imageElement = element.querySelector(
                MessengerMessageListener.SELECTORS.IMAGE_MESSAGE
              );
              if (imageElement) {
                info.isImage = true;
                info.messagePreview = "[图片消息]";
              }
              break;
            }
          }
        }
        // 时间字段为空（fallback在通知时处理）
        info.time = "";
        return info;
      }, "extractMessageInfo") || info
    );
  }

  // 提取单条消息 (添加图片支持和base64提取)
  extractSingleMessage(messageRow) {
    const info = {
      sender: "",
      content: "",
      timestamp: "", // 始终为空
      isSentByMe: false,
      hasAvatar: false,
      isImage: false, // 标识是否为图片消息
      imageBase64: "", // 新增字段存储base64数据
    };
    return (
      this.safeExecute(() => {
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
          const senderSelectors =
            'span.x1hyvwdk.xjm9jq1, span[dir="auto"].x1lliihq, h4 span, span.xzpqnlu.x1hyvwdk.xjm9jq1';
          const senderSpan = messageRow.querySelector(senderSelectors);
          if (senderSpan) info.sender = senderSpan.textContent.trim();
        }
        // 提取内容和base64
        const { content, imageBase64 } = this.extractMessageContent(
          messageRow,
          info.sender
        );
        info.content = content;
        info.imageBase64 = imageBase64;
        // 检查是否为图片消息
        const imageElement = messageRow.querySelector(
          MessengerMessageListener.SELECTORS.IMAGE_MESSAGE
        );
        if (imageElement) {
          info.isImage = true;
          info.content = "[图片消息]";
        }
        // 时间戳为空，无需提取
        info.timestamp = "";
        return info;
      }, "extractSingleMessage") || info
    );
  }

  // 提取消息内容 (添加图片支持和base64提取)
  extractMessageContent(messageRow, senderName) {
    const result = {
      content: "",
      imageBase64: "",
    };
    // 首先检查是否为图片消息
    const imageElement = messageRow.querySelector(
      MessengerMessageListener.SELECTORS.IMAGE_MESSAGE
    );
    if (imageElement) {
      result.content = "[图片消息]";
      const src = imageElement.getAttribute("src");
      if (src && src.startsWith("data:image")) {
        result.imageBase64 = src;
      }
      return result;
    }

    const contentSelectors =
      'div[dir="auto"][style*="text-align: start;"] > span.xexx8yu, div[dir="auto"].x1gslohp, div[role="textbox"], span[dir="auto"].xexx8yu';
    const contentElement = messageRow.querySelector(contentSelectors);

    if (!contentElement) return result;
    let rawContent = contentElement.textContent
      .trim()
      .replace(/Enter$|输入中|typing/g, "")
      .trim();
    if (
      rawContent === senderName ||
      (rawContent.includes("今天") && rawContent.match(/\d+:\d+/))
    ) {
      rawContent = "";
    }
    if (!rawContent) {
      const emojiImg = contentElement.querySelector(
        `img[alt][src*="emoji.php"], img[alt]:not([class*="x1rg5ohu"]):not([alt="${senderName}"])`
      );
      if (emojiImg?.alt) {
        result.content = emojiImg.alt.trim();
        return result;
      }
    }
    const hasEmoji = contentElement.querySelector("img[alt]");
    if (hasEmoji) {
      const childElements = contentElement.querySelectorAll(
        'span, div[dir="auto"], img[alt]'
      );
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

  // 记录消息快照 (基于内容)
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

  // ==================== 消息检测逻辑 ====================
  // 检查新消息 (列表页面: 用ID去重；对话页面: 切换监听)
  checkForNewMessages = this.debounce(function () {
    if (this.isDestroyed) return;
    this.log("🔍 检查新消息...");
    this.detectOpenConversation();
    if (this.isInConversationPage) {
      this.log("📱 当前在对话页面，切换到内联监听...");
      this.startMessageMonitoring();
      return;
    }
    const messageRows = document.querySelectorAll(
      MessengerMessageListener.SELECTORS.THREAD_ROW
    );
    this.log(`找到 ${messageRows.length} 个对话`);
    let unreadCount = 0;
    messageRows.forEach((row) => {
      const info = this.extractMessageInfo(row);

      if (info.isUnread) unreadCount++;
      // 列表页面: ID基于内容+对话ID
      const messageId = this.generateMessageId(
        info.messagePreview,
        info.conversationId
      );
      if (
        info.isUnread &&
        info.messagePreview &&
        !info.isCurrentOpen &&
        !this.knownMessages.has(messageId)
      ) {
        this.knownMessages.set(messageId, Date.now());
        this.log("🆕 检测到新的未读消息！");
        // 时间fallback: 当前时间
        const displayTime = new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        info.time = displayTime;
        this.notifyCallbacks(info);
      }
    });
    this.log(`📊 总计 ${unreadCount} 条未读消息`);
    // 切换监听模式
    const openConv = this.detectOpenConversation();
    if (openConv) {
      this.startMessageMonitoring();
    } else {
      this.stopMessageMonitoring();
    }
  }, MessengerMessageListener.CONFIG.CHECK_DEBOUNCE);

  // 通知所有回调 (添加base64支持)
  notifyCallbacks(message) {
    this.callbacks.forEach((callback) => {
      try {
        const messageWithBase64 = {
          ...message,
          imageBase64: message.isImage
            ? message.element
                ?.querySelector(
                  MessengerMessageListener.SELECTORS.IMAGE_MESSAGE
                )
                ?.getAttribute("src") || ""
            : "",
        };
        callback(messageWithBase64);
      } catch (error) {
        console.error("❌ 回调执行出错:", error);
      }
    });
  }

  // 检测末尾哈希变化
  detectTailHashChange(currentSnapshot) {
    if (currentSnapshot.length === 0) return false;

    const currentTailHash = currentSnapshot[currentSnapshot.length - 1];
    const hasTailChange = currentTailHash !== this.lastTailHash;

    this.lastTailHash = currentTailHash;

    if (hasTailChange) {
      this.log("🆕 [调试] 检测到末尾哈希变化！");
    }

    return hasTailChange;
  }

  // ==================== 对话监听 ====================
  // 实时监听对话窗口消息
  startMessageMonitoring() {
    if (!this.isInConversationPage || this.messageObserver) return;
    this.log("🎯 开始监听对话窗口的新消息...");
    const getMessageRows = () =>
      Array.from(
        document.querySelectorAll(
          MessengerMessageListener.SELECTORS.MESSAGE_ROW
        )
      );
    const initialRows = getMessageRows();
    this.lastMessageCount = initialRows.length;
    this.lastSnapshot = this.recordMessageSnapshot(initialRows);

    if (this.lastSnapshot.length > 0) {
      this.lastTailHash = this.lastSnapshot[this.lastSnapshot.length - 1];
    }
    const messageContainer =
      document.querySelector(
        MessengerMessageListener.SELECTORS.MESSAGE_CONTAINER
      ) ||
      document.querySelector('div[role="main"]') ||
      document.body;
    const debouncedHandler = this.debounce((mutations) => {
      this.handleMessageMutations(getMessageRows);
    }, MessengerMessageListener.CONFIG.EXTRACT_DEBOUNCE);
    this.messageObserver = new MutationObserver(debouncedHandler);

    this.messageObserver.observe(messageContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.log("✅ 对话消息监听器已启动");
  }

  // 处理消息变化 (直接通知新增非自己消息，无去重，传递base64)
  handleMessageMutations(getMessageRows) {
    if (this.isDestroyed) return;
    const currentRows = getMessageRows();
    const currentSnapshot = this.recordMessageSnapshot(currentRows);
    const currentMessageCount = currentRows.length;
    const snapshotChange = Math.abs(
      currentSnapshot.length - this.lastSnapshot.length
    );
    const hasLengthChange = snapshotChange > 0;
    const hasTailChange = this.detectTailHashChange(currentSnapshot);
    if (!hasTailChange && !hasLengthChange) return;
    this.log("📨 检测到变化！检查一致性...");
    const newHash = currentSnapshot[currentSnapshot.length - 1];
    const isNewMessage =
      hasLengthChange || hasTailChange || !this.lastSnapshot.includes(newHash);
    const isHistoryLoad = snapshotChange > 2;
    if (isNewMessage && !isHistoryLoad) {
      this.log("🆕 确认新增消息！");

      const newRow = currentRows[currentRows.length - 1];
      const newMessage = this.extractSingleMessage(newRow);
      if (newMessage.content && !newMessage.isSentByMe) {
        // 对话页面: 直接通知，无ID/内容去重（即使重复也通知）
        const displayTime = new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const adaptedInfo = {
          userName: newMessage.sender !== "你" ? newMessage.sender : "",
          messagePreview: newMessage.content,
          time: displayTime, // fallback当前时间
          isUnread: true,
          conversationLink: "",
          conversationId: this.currentOpenConversationId,
          isCurrentOpen: true,
          linkStatus: null,
          element: newRow,
          isImage: newMessage.isImage,
          imageBase64: newMessage.imageBase64, // 传递base64数据
        };
        this.notifyCallbacks(adaptedInfo);
        // 辅助: 记录到knownMessages（基于内容，防跨对话）
        const messageId = this.generateMessageId(
          newMessage.content,
          this.currentOpenConversationId
        );
        if (!this.knownMessages.has(messageId)) {
          this.knownMessages.set(messageId, Date.now());
        }
      }
    }
    this.lastMessageCount = currentMessageCount;
    this.lastSnapshot = currentSnapshot;
  }

  // 停止消息监听
  stopMessageMonitoring() {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
      this.messageObserver = null;
      this.lastMessageCount = 0;
      this.lastSnapshot = [];
      this.lastTailHash = "";
      this.log("⏹️ 对话消息监听器已停止");
    }
  }

  // ==================== 公共 API ====================
  // 添加消息回调
  onNewMessage(callback) {
    if (typeof callback === "function") {
      this.callbacks.push(callback);
      this.log(`✅ 已添加回调函数，当前共 ${this.callbacks.length} 个回调`);
    }
  }

  // 移除回调
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
      this.log(`✅ 已移除回调函数，剩余 ${this.callbacks.length} 个回调`);
    }
  }

  // 重置状态
  reset() {
    this.knownMessages.clear();
    this.currentOpenConversationId = null;
    this.isInConversationPage = false;
    this.lastSnapshot = [];
    this.lastTailHash = "";
    this.log("🔄 已清空已知消息列表");
  }

  // 启动监听
  start() {
    if (this.observer) {
      console.warn("⚠️ 监听器已在运行中");
      return;
    }
    console.log("🚀 开始监听 Messenger 新消息...");
    this.isDestroyed = false;
    this.checkForNewMessages();
    const targetNode = document.querySelector(
      MessengerMessageListener.SELECTORS.THREAD_LIST
    );
    if (!targetNode) {
      console.error("❌ 未找到消息列表容器");
      console.log("💡 提示: 请确保你在 Messenger 消息列表页面");

      if (
        this.retryCount < MessengerMessageListener.CONFIG.MAX_RETRY_ATTEMPTS
      ) {
        this.retryCount++;
        console.log(
          `🔄 将在 ${MessengerMessageListener.CONFIG.RETRY_DELAY}ms 后重试 (${this.retryCount}/${MessengerMessageListener.CONFIG.MAX_RETRY_ATTEMPTS})`
        );
        setTimeout(
          () => this.start(),
          MessengerMessageListener.CONFIG.RETRY_DELAY
        );
      } else {
        console.log("💥 重试次数耗尽，请手动刷新页面");
      }
      return;
    }
    this.retryCount = 0;
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-current", "tabindex"],
    };
    this.observer = new MutationObserver((mutations) => {
      const hasImportantChange = mutations.some(
        (mutation) =>
          (mutation.type === "childList" &&
            mutation.target.closest(
              MessengerMessageListener.SELECTORS.THREAD_ROW
            )) ||
          (mutation.type === "attributes" &&
            ["aria-current", "tabindex"].includes(mutation.attributeName))
      );
      if (hasImportantChange) {
        this.checkForNewMessages();
      }
    });
    this.observer.observe(targetNode, config);
    console.log("✅ 监听器已启动，等待新消息...");
  }

  // 停止监听
  stop() {
    this.isDestroyed = true;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      console.log("⏹️ 监听器已停止");
    }

    this.stopMessageMonitoring();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    clearTimeout(this.checkTimeout);
    clearTimeout(this.extractTimeout);
  }

  // 销毁实例
  destroy() {
    this.stop();
    this.callbacks = [];
    this.knownMessages.clear();
    console.log("💥 监听器已销毁");
  }

  // 手动触发检查
  manualCheck() {
    console.log("🔧 手动触发检查...");
    this.checkForNewMessages();
  }

  // 获取统计信息 (移除时间统计)
  getStats() {
    const rows = document.querySelectorAll(
      MessengerMessageListener.SELECTORS.THREAD_ROW
    );
    const stats = {
      total: rows.length,
      unread: 0,
      open: 0,
      knownMessagesCount: this.knownMessages.size,
      conversations: [],
    };
    rows.forEach((row) => {
      const info = this.extractMessageInfo(row);
      if (info.isUnread) stats.unread++;
      if (info.isCurrentOpen) stats.open++;
      stats.conversations.push({
        id: info.conversationId,
        name: info.userName,
        isUnread: info.isUnread,
        isOpen: info.isCurrentOpen,
        isImage: info.isImage,
      });
    });
    return stats;
  }

  // 提取对话消息 (移除时间)
  extractConversationMessages(limit = 10) {
    console.log(`🔍 提取最新 ${limit} 条消息...`);

    const messageRows = Array.from(
      document.querySelectorAll(MessengerMessageListener.SELECTORS.MESSAGE_ROW)
    );

    const messages = messageRows
      .slice(-limit)
      .map((row) => this.extractSingleMessage(row))
      .filter((msg) => msg.content);
    console.log(`✅ 成功提取 ${messages.length} 条消息`);
    return messages;
  }

  // 启用调试模式
  enableDebug() {
    window.messengerListenerDebug = true;
    console.log("🐛 调试模式已启用");
  }

  // 禁用调试模式
  disableDebug() {
    window.messengerListenerDebug = false;
    console.log("🐛 调试模式已禁用");
  }
}

// ==================== 初始化 ====================
// 创建实例
const listener = new MessengerMessageListener();

// 注册新消息回调
listener.onNewMessage((message) => {
  console.log("");
  console.log("📨 ========== 收到新消息！ ==========");
  console.log("🆔 对话 ID:", message.conversationId);
  console.log("👤 发送人:", message.userName);
  console.log("💬 消息预览:", message.messagePreview);
  console.log("📷 是否图片:", message.isImage ? "是" : "否");
  if (message.isImage && message.imageBase64) {
    console.log(
      "🖼️ 图片 Base64:",
      message.imageBase64.substring(0, 50) + "..."
    );
  }
  console.log("⏰ 时间:", message.time); // 显示fallback时间
  console.log("🔗 对话链接:", message.conversationLink);
  console.log("📂 对话状态:", message.isCurrentOpen ? "已打开" : "未打开");
  console.log("=====================================");
  console.log("");
  // 发送浏览器通知
  if (Notification.permission === "granted") {
    new Notification(`${message.userName || "Messenger"} 发来新消息`, {
      body: message.isImage ? "[图片消息]" : message.messagePreview,
      icon:
        message.isImage && message.imageBase64
          ? message.imageBase64
          : "https://static.xx.fbcdn.net/rsrc.php/v3/y9/r/YAYXsGNV5rp.png",
      tag: message.conversationId,
    });
  }
});

// 启动监听
listener.start();

// 使用说明
console.log("📋 可用命令:");
console.log("");
console.log("【基础功能】");
console.log(" listener.start() - 启动监听");
console.log(" listener.stop() - 停止监听");
console.log(" listener.reset() - 重置状态");
console.log(" listener.destroy() - 销毁实例");
console.log("");
console.log("【消息管理】");
console.log(" listener.manualCheck() - 手动检查");
console.log(" listener.getStats() - 获取统计");
console.log(" listener.extractConversationMessages(10) - 提取消息");
console.log("");
console.log("【回调管理】");
console.log(" listener.onNewMessage(callback) - 添加回调");
console.log(" listener.removeCallback(callback) - 移除回调");
console.log("");
console.log("【调试工具】");
console.log(" listener.enableDebug() - 启用调试模式");
console.log(" listener.disableDebug() - 禁用调试模式");
console.log("");
console.log("💡 当前版本优化项:");
console.log(" ✓ 防止内存泄漏 (自动清理)");
console.log(" ✓ 性能优化 (防抖)");
console.log(" ✓ 错误处理增强");
console.log(" ✓ 调试日志可控");
console.log(" ✓ 自动重连");
console.log(" ✓ 移除时间戳依赖 (直接基于新增行通知，所有新消息均触发)");
console.log(" ✓ 支持图片消息检测");
console.log(" ✓ 图片消息通知携带base64内容");
console.log("");
// 导出到全局
window.messengerListener = listener;

// 请求通知权限
if (Notification.permission === "default") {
  console.log("💡 提示: 可以启用浏览器通知");
  console.log(" 运行: Notification.requestPermission()");
  console.log("");
}
