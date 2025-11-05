(function () {
  "use strict";

  console.log(
    "%c[Instagram Listener v3.3 通知版] 🔥 启动",
    "color: #E4405F; font-size: 18px; font-weight: bold;"
  );

  const messages = [];
  const callbacks = [];
  let wsCount = 0;
  const recentMessages = new Set();
  let debugMode = true;
  let notificationsEnabled = false;

  // ===== 通知权限管理 =====
  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("%c[通知] ⚠️ 浏览器不支持通知", "color: #ff9900;");
      return false;
    }

    if (Notification.permission === "granted") {
      notificationsEnabled = true;
      console.log("%c[通知] ✅ 通知已启用", "color: #00ff00;");
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      notificationsEnabled = permission === "granted";

      if (notificationsEnabled) {
        console.log("%c[通知] ✅ 通知权限已授予", "color: #00ff00;");
        // 发送测试通知
        new Notification("Instagram 消息监听器", {
          body: "通知已启用！您将收到新消息提醒",
          icon: "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
          tag: "test",
        });
      } else {
        console.log("%c[通知] ❌ 通知权限被拒绝", "color: #ff0000;");
      }

      return notificationsEnabled;
    }

    console.log("%c[通知] ❌ 通知权限已被永久拒绝", "color: #ff0000;");
    return false;
  }

  // ===== 发送通知 =====
  function sendNotification(parsed) {
    if (!notificationsEnabled || Notification.permission !== "granted") {
      return;
    }

    try {
      const title = "Instagram 新消息";
      let body = parsed.messageText || "[未知消息]";

      // 限制通知内容长度
      if (body.length > 100) {
        body = body.substring(0, 97) + "...";
      }

      const notification = new Notification(title, {
        body: body,
        icon: "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
        badge:
          "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
        tag: parsed.threadId || "instagram-message",
        requireInteraction: false,
        silent: false,
        timestamp: parsed.timestamp,
      });

      // 点击通知时聚焦窗口并导航
      notification.onclick = () => {
        window.focus();
        navigateToThread(parsed.threadId);
        notification.close();
      };

      // 5秒后自动关闭
      setTimeout(() => notification.close(), 5000);

      console.log("%c[通知] 📬 已发送通知", "color: #00ccff;");
    } catch (e) {
      console.error("[通知] ❌ 发送失败:", e);
    }
  }

  // ===== Direct ID 追踪器 =====
  const directIDTracker = {
    ids: new Set(),
    totalCount: 0,
    lastUpdate: null,
  };

  function captureDirectID(id) {
    if (!id || directIDTracker.ids.has(id)) return false;

    directIDTracker.ids.add(id);
    directIDTracker.totalCount++;
    directIDTracker.lastUpdate = new Date().toLocaleTimeString("zh-CN");

    console.log(
      `%c[✓] %c${id} %c@ ${directIDTracker.lastUpdate}`,
      "color: #00aa00; font-weight: bold;",
      "color: #ff6600; font-family: monospace; font-weight: bold;",
      "color: #888888; font-size: 11px;"
    );

    return true;
  }

  function handleBodyText(bodyText) {
    if (!bodyText || typeof bodyText !== "string") return;

    const matches = [...bodyText.matchAll(/\/direct\/t\/(\d+)\//g)];
    if (matches.length) {
      const newIds = [];
      for (const m of matches) {
        if (captureDirectID(m[1])) newIds.push(m[1]);
      }

      if (newIds.length && debugMode) {
        console.group(
          `%c📊 ${newIds.length} 个新 Direct ID`,
          "color: #0066ff; font-weight: bold;"
        );
        console.table(newIds);
        console.groupEnd();
      }
    }
  }

  // ===== 拦截 XHR =====
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._xhrUrl = String(url || "");
    this._xhrMethod = method;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const self = this;

    if (body) {
      if (typeof body === "string") {
        handleBodyText(body);
      } else if (body instanceof FormData) {
        handleBodyText(
          Array.from(body.entries())
            .map(([k, v]) => k + "=" + v)
            .join("&")
        );
      }
    }

    const origOnReadyStateChange = this.onreadystatechange;
    this.onreadystatechange = function () {
      try {
        if (this.readyState === 4) {
          try {
            const isDirectRequest =
              self._xhrUrl && self._xhrUrl.includes("direct");

            if (this.responseText) {
              handleBodyText(this.responseText);

              if (isDirectRequest) {
                try {
                  const data = JSON.parse(this.responseText);
                  if (data) {
                    if (data.inbox) {
                      if (data.inbox.threads) {
                        data.inbox.threads.forEach((thread) => {
                          if (thread.thread_id) {
                            captureDirectID(thread.thread_id);
                          }
                        });
                      }
                    }

                    if (Array.isArray(data.route_urls)) {
                      data.route_urls.forEach(
                        (u) => u && handleBodyText(String(u))
                      );
                    }

                    if (data.payload && typeof data.payload === "object") {
                      Object.keys(data.payload).forEach((key) => {
                        handleBodyText(String(key));
                        if (typeof data.payload[key] === "string") {
                          handleBodyText(data.payload[key]);
                        }
                      });
                    }
                  }
                } catch (e) {
                  if (debugMode) {
                    console.log("[调试] JSON解析失败:", e);
                  }
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}

      if (origOnReadyStateChange) {
        origOnReadyStateChange.apply(this, arguments);
      }
    };

    return origSend.apply(this, arguments);
  };

  // ===== SPA 路由导航 =====
  function navigateToThread(threadId) {
    if (!threadId) return false;

    const targetPath = `/direct/t/${threadId}/`;

    if (window.location.pathname === targetPath) {
      console.log("[Instagram] ℹ️ 已在此对话中");
      return true;
    }

    console.log(
      `%c[Instagram] 🔗 进入对话: ${threadId}`,
      "color: #FFA500; font-weight: bold;"
    );

    window.history.pushState(null, "", targetPath);
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));

    setTimeout(() => {
      const link = document.querySelector(`a[href="${targetPath}"]`);
      if (link) link.click();
    }, 100);

    return true;
  }

  // ===== 解码Unicode =====
  function decodeUnicode(str) {
    try {
      return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
    } catch (e) {
      return str;
    }
  }

  // ===== 清理URL中的转义字符 =====
  function cleanUrl(url) {
    if (!url) return null;
    return url.replace(/\\\//g, "/");
  }

  // ===== 提取JSON数据 =====
  function extractJSON(text) {
    try {
      const lsRespIndex = text.indexOf("/ls_resp");
      if (lsRespIndex === -1) return null;

      const afterLsResp = text.substring(lsRespIndex);
      const jsonStart = afterLsResp.indexOf("{");
      if (jsonStart === -1) return null;

      const jsonStr = afterLsResp.substring(jsonStart);
      const parsed = JSON.parse(jsonStr);

      return parsed;
    } catch (e) {
      if (debugMode) {
        console.log("%c[调试] JSON解析失败:", "color: #f00;", e.message);
      }
      return null;
    }
  }

  // ===== 递归查找数组中的特定操作 =====
  function findOperation(arr, operationName) {
    if (!Array.isArray(arr)) return null;

    for (let item of arr) {
      if (Array.isArray(item)) {
        if (item.length >= 2 && item[0] === 5 && item[1] === operationName) {
          return item.slice(2);
        }

        const found = findOperation(item, operationName);
        if (found) return found;
      }
    }

    return null;
  }

  // ===== 解析参数值 =====
  function parseValue(val) {
    if (!val) return null;

    if (Array.isArray(val)) {
      if (val[0] === 19 && val.length >= 2) {
        return val[1];
      }
      if (val[0] === 9) {
        return null;
      }
    }

    if (
      typeof val === "string" ||
      typeof val === "number" ||
      typeof val === "boolean"
    ) {
      return val;
    }

    return null;
  }

  // ===== 提取 updateThreadSnippet 消息文本 =====
  function extractThreadSnippet(stepArray) {
    const args = findOperation(stepArray, "updateThreadSnippet");
    if (!args || args.length < 2) return null;

    const messageText = args[1];
    if (typeof messageText === "string") {
      return decodeUnicode(messageText);
    }

    return null;
  }

  // ===== 提取 insertMessage 参数 =====
  function extractInsertMessage(stepArray) {
    const args = findOperation(stepArray, "insertMessage");
    if (!args) return null;

    const result = {
      messageText: null,
      messageType: parseValue(args[2]),
      threadId: parseValue(args[3]),
      senderId: parseValue(args[5]),
      recipientId: parseValue(args[6]),
      messageId: typeof args[8] === "string" ? args[8] : null,
      _allArgs: args,
    };

    if (typeof args[0] === "string") {
      result.messageText = decodeUnicode(args[0]);
    }

    if (result.threadId) {
      captureDirectID(result.threadId);
    }

    return result;
  }

  // ===== 提取 insertXmaAttachment 贴图信息 =====
  function extractXmaAttachment(stepArray) {
    const args = findOperation(stepArray, "insertXmaAttachment");
    if (!args) return null;

    const mediaUrl = typeof args[4] === "string" ? cleanUrl(args[4]) : null;
    const mimeType = typeof args[7] === "string" ? args[7] : null;
    const previewUrl = typeof args[8] === "string" ? cleanUrl(args[8]) : null;

    let mediaType = "sticker";
    if (mimeType) {
      if (mimeType.includes("gif")) mediaType = "gif";
      else if (mimeType.includes("image")) mediaType = "sticker";
    }

    const result = {
      mediaType,
      mediaUrl,
      previewUrl: previewUrl && previewUrl !== mediaUrl ? previewUrl : null,
      mimeType,
      isXma: true,
    };

    for (let i = 10; i < Math.min(args.length, 25); i++) {
      const w = parseValue(args[i]);
      const h = parseValue(args[i + 1]);
      if (w && h) {
        const wNum = parseInt(w);
        const hNum = parseInt(h);
        if (wNum >= 50 && wNum <= 1000 && hNum >= 50 && hNum <= 1000) {
          result.width = wNum;
          result.height = hNum;
          break;
        }
      }
    }

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "generic_share") {
        result.shareType = "generic_share";
        break;
      }
    }

    return result;
  }

  // ===== 提取 insertBlobAttachment 媒体信息 =====
  function extractBlobAttachment(stepArray) {
    const args = findOperation(stepArray, "insertBlobAttachment");
    if (!args) return null;

    const fileName = typeof args[0] === "string" ? args[0] : null;
    const fileSize = parseValue(args[1]);
    const mediaUrl = typeof args[3] === "string" ? cleanUrl(args[3]) : null;
    const fallbackUrl = typeof args[4] === "string" ? cleanUrl(args[4]) : null;
    let mimeType = typeof args[6] === "string" ? args[6] : null;

    let mediaType = null;
    if (fileName) {
      if (fileName.startsWith("image")) mediaType = "image";
      else if (fileName.startsWith("video")) mediaType = "video";
      else if (fileName.startsWith("audioclip")) mediaType = "audio";
    }

    if (!mediaType && mimeType) {
      if (mimeType.includes("image")) mediaType = "image";
      else if (mimeType.includes("video")) mediaType = "video";
      else if (mimeType.includes("audio")) mediaType = "audio";
    }

    const result = {
      mediaType,
      fileName,
      fileSize: fileSize ? parseInt(fileSize) : null,
      mediaUrl,
      previewUrl: fallbackUrl && fallbackUrl !== mediaUrl ? fallbackUrl : null,
      mimeType,
    };

    if (mediaType === "image" || mediaType === "video") {
      for (let i = 10; i < Math.min(args.length, 20); i++) {
        const w = parseValue(args[i]);
        const h = parseValue(args[i + 1]);
        if (w && h) {
          const wNum = parseInt(w);
          const hNum = parseInt(h);
          if (wNum >= 100 && wNum <= 10000 && hNum >= 100 && hNum <= 10000) {
            result.width = wNum;
            result.height = hNum;
            break;
          }
        }
      }
    }

    if (mediaType === "audio") {
      if (fileName) {
        const durMatch = fileName.match(/-(\d{3,5})\.mp4$/);
        if (durMatch) {
          result.duration = parseInt(durMatch[1]);
        }
      }

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === "string" && arg.includes(",") && arg.length > 20) {
          if (/^[0-9.,]+$/.test(arg)) {
            result.waveform = arg;
            break;
          }
        }
      }

      if (!result.duration) {
        for (let i = 0; i < args.length; i++) {
          const val = parseValue(args[i]);
          if (val) {
            const num = parseInt(val);
            if (num >= 100 && num <= 300000) {
              result.duration = num;
              break;
            }
          }
        }
      }
    }

    return result;
  }

  // ===== 解析 Instagram 消息 =====
  function parseInstagramMessage(bytes) {
    if (bytes.length < 50) return null;

    try {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

      const jsonData = extractJSON(text);
      if (!jsonData) return null;

      let payload = null;
      if (jsonData.payload && typeof jsonData.payload === "string") {
        try {
          payload = JSON.parse(jsonData.payload);
        } catch (e) {
          if (debugMode) {
            console.log("%c[调试] payload解析失败:", "color: #f00;", e.message);
          }
          return null;
        }
      }

      if (!payload || !payload.step) {
        return null;
      }

      const stepArray = payload.step;

      if (!findOperation(stepArray, "insertMessage")) {
        return null;
      }

      let messageText = extractThreadSnippet(stepArray);
      const insertMsgInfo = extractInsertMessage(stepArray);

      if (!insertMsgInfo || !insertMsgInfo.threadId) {
        return null;
      }

      let mediaInfo = null;

      if (findOperation(stepArray, "insertXmaAttachment")) {
        mediaInfo = extractXmaAttachment(stepArray);

        if (!messageText && mediaInfo && mediaInfo.mediaType) {
          switch (mediaInfo.mediaType) {
            case "gif":
              messageText = "[GIF动图]";
              break;
            case "sticker":
              messageText = "[贴图]";
              break;
            default:
              messageText = "[分享]";
          }
        }
      } else if (findOperation(stepArray, "insertBlobAttachment")) {
        mediaInfo = extractBlobAttachment(stepArray);

        if (!messageText && mediaInfo && mediaInfo.mediaType) {
          switch (mediaInfo.mediaType) {
            case "image":
              messageText = "[图片]";
              break;
            case "audio":
              const seconds = mediaInfo.duration
                ? (mediaInfo.duration / 1000).toFixed(1)
                : "?";
              messageText = `[语音 ${seconds}秒]`;
              break;
            case "video":
              messageText = "[视频]";
              break;
          }
        }
      }

      if (insertMsgInfo.messageText) {
        messageText = insertMsgInfo.messageText;
      }

      if (!messageText) {
        messageText = "[未知消息]";
      }

      const result = {
        timestamp: Date.now(),
        threadId: insertMsgInfo.threadId,
        senderId: insertMsgInfo.senderId,
        recipientId: insertMsgInfo.recipientId,
        messageId: insertMsgInfo.messageId,
        messageText: messageText,
        messageType: insertMsgInfo.messageType,
        summary: messageText,
        _debug: {
          allInsertMessageArgs: insertMsgInfo._allArgs,
          stepArray: stepArray,
          jsonData: jsonData,
          payload: payload,
        },
      };

      if (mediaInfo) {
        Object.assign(result, mediaInfo);
      }

      return result;
    } catch (e) {
      console.error("[Instagram] ❌ 解析失败:", e);
      if (debugMode) {
        console.error(e.stack);
      }
      return null;
    }
  }

  // ===== 检查重复 =====
  function isDuplicate(parsed) {
    const hash =
      parsed.messageId ||
      `${parsed.threadId}_${parsed.messageText}_${parsed.senderId}`;

    if (recentMessages.has(hash)) {
      return true;
    }

    recentMessages.add(hash);

    if (recentMessages.size > 100) {
      const oldest = Array.from(recentMessages)[0];
      recentMessages.delete(oldest);
    }

    return false;
  }

  // ===== 格式化工具 =====
  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  }

  function formatDuration(ms) {
    if (!ms) return "";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}分${remainingSeconds}秒`;
    }
    return `${seconds}秒`;
  }

  // ===== 处理新消息 =====
  function handleNewMessage(parsed) {
    if (isDuplicate(parsed)) {
      console.log("%c[Instagram] ⏭️ 跳过重复消息", "color: #888;");
      return;
    }

    // 判断是否为自己发送
    const snippetArgs = findOperation(
      parsed._debug.stepArray,
      "updateThreadSnippet"
    );
    let isSelfMessage = false;
    if (snippetArgs && snippetArgs.length > 1) {
      const rawSnippet = snippetArgs[1];
      if (typeof rawSnippet === "string") {
        const decoded = decodeUnicode(rawSnippet);
        if (decoded.includes("你:") || decoded.startsWith("你：")) {
          isSelfMessage = true;
        }
      }
    }

    if (isSelfMessage) {
      console.log(
        `%c[Instagram] 🙈 跳过自己发送的消息: "${parsed.messageText}" (thread: ${parsed.threadId})`,
        "color: #aaa; font-style: italic; font-size: 12px;"
      );
      return;
    }

    // 输出消息信息
    console.log("%c" + "═".repeat(60), "color: #E4405F;");
    console.log(
      "%c📨 新消息",
      "color: #00ff00; font-size: 16px; font-weight: bold;"
    );
    console.log("💬 内容:", parsed.messageText);
    console.log("🆔 Thread ID:", parsed.threadId);

    if (parsed.mediaType) {
      console.log("%c📎 媒体附件", "color: #FFA500; font-weight: bold;");

      let typeDisplay = parsed.mediaType.toUpperCase();
      if (parsed.isXma) {
        typeDisplay += " (贴图/分享)";
      }
      console.log("  ├─ 类型:", typeDisplay);

      if (parsed.mimeType) {
        console.log("  ├─ MIME:", parsed.mimeType);
      }

      if (parsed.shareType) {
        console.log("  ├─ 分享类型:", parsed.shareType);
      }

      if (parsed.fileName) {
        console.log("  ├─ 文件名:", parsed.fileName);
      }

      if (parsed.fileSize) {
        console.log("  ├─ 大小:", formatFileSize(parsed.fileSize));
      }

      if (parsed.duration) {
        console.log("  ├─ 时长:", formatDuration(parsed.duration));
      }

      if (parsed.width && parsed.height) {
        console.log("  ├─ 尺寸:", `${parsed.width}×${parsed.height}`);
      }

      if (parsed.waveform) {
        console.log("  ├─ 波形:", parsed.waveform.substring(0, 50) + "...");
      }

      if (parsed.mediaUrl) {
        const urlPreview =
          parsed.mediaUrl.length > 100
            ? parsed.mediaUrl.substring(0, 100) + "..."
            : parsed.mediaUrl;
        console.log("  ├─ 媒体URL:", urlPreview);
      }

      if (parsed.previewUrl && parsed.previewUrl !== parsed.mediaUrl) {
        const previewUrlDisplay =
          parsed.previewUrl.length > 100
            ? parsed.previewUrl.substring(0, 100) + "..."
            : parsed.previewUrl;
        console.log("  └─ 预览URL:", previewUrlDisplay);
      } else if (!parsed.mediaUrl) {
        console.log("  └─ ⚠️ 未提取到URL");
      }
    }

    console.log("⏰ 时间:", new Date(parsed.timestamp).toLocaleTimeString());
    console.log("%c" + "═".repeat(60), "color: #E4405F;");

    messages.push(parsed);

    callbacks.forEach((cb) => {
      try {
        cb(parsed);
      } catch (e) {
        console.error("[Instagram] 回调错误:", e);
      }
    });

    // 🔔 发送系统通知（在导航前）
    sendNotification(parsed);

    // 延迟后自动导航
    setTimeout(() => {
      navigateToThread(parsed.threadId);
    }, 1000); // 增加到1秒，确保通知有时间显示
  }

  // ===== WebSocket 代理 =====
  const NativeWebSocket = window.WebSocket;

  function ProxyWebSocket(url, protocols) {
    const ws = protocols
      ? new NativeWebSocket(url, protocols)
      : new NativeWebSocket(url);

    const isInstagramIM = url.includes("edge-chat.instagram.com");

    if (isInstagramIM) {
      wsCount++;
      console.log(
        "%c[Instagram] ✅ IM WebSocket #" + wsCount,
        "color: #00ff00; font-size: 14px; font-weight: bold;"
      );

      ws.addEventListener("open", () => {
        console.log("%c[Instagram] 🟢 连接成功", "color: #00ff00;");
      });

      ws.addEventListener("close", () => {
        console.log("%c[Instagram] 🔴 连接断开", "color: #ff0000;");
      });

      const originalOnMessage = ws.onmessage;
      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            const bytes = new Uint8Array(buffer);
            const parsed = parseInstagramMessage(bytes);
            if (parsed) {
              handleNewMessage(parsed);
            }
          });
        } else if (event.data instanceof ArrayBuffer) {
          const bytes = new Uint8Array(event.data);
          const parsed = parseInstagramMessage(bytes);
          if (parsed) {
            handleNewMessage(parsed);
          }
        }

        if (originalOnMessage) {
          originalOnMessage.call(ws, event);
        }
      };

      const originalAddEventListener = ws.addEventListener;
      ws.addEventListener = function (type, listener, options) {
        if (type === "message") {
          const wrappedListener = (event) => {
            if (event.data instanceof Blob) {
              event.data.arrayBuffer().then((buffer) => {
                const bytes = new Uint8Array(buffer);
                const parsed = parseInstagramMessage(bytes);
                if (parsed) {
                  handleNewMessage(parsed);
                }
              });
            } else if (event.data instanceof ArrayBuffer) {
              const bytes = new Uint8Array(event.data);
              const parsed = parseInstagramMessage(bytes);
              if (parsed) {
                handleNewMessage(parsed);
              }
            }
            listener.call(this, event);
          };
          return originalAddEventListener.call(
            this,
            type,
            wrappedListener,
            options
          );
        }
        return originalAddEventListener.call(this, type, listener, options);
      };
    }

    return ws;
  }

  ProxyWebSocket.prototype = NativeWebSocket.prototype;
  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach((prop, index) => {
    Object.defineProperty(ProxyWebSocket, prop, {
      value: index,
      enumerable: true,
    });
  });

  window.WebSocket = ProxyWebSocket;

  // ===== 全局 API =====
  window.InstagramListener = {
    getMessages: () => messages,
    getLastMessage: () => messages[messages.length - 1],

    getDirectIDs: () => Array.from(directIDTracker.ids),
    getDirectIDCount: () => directIDTracker.totalCount,
    clearDirectIDs: () => {
      directIDTracker.ids.clear();
      directIDTracker.totalCount = 0;
      console.log("[Instagram] 🗑️ 已清空Direct ID记录");
    },

    showStats: () => {
      console.log(
        "%c📊 统计信息",
        "color: #E4405F; font-size: 16px; font-weight: bold;"
      );
      console.log(`📨 总消息数: ${messages.length}`);
      console.log(`🔌 WebSocket 连接数: ${wsCount}`);
      console.log(`💾 去重缓存: ${recentMessages.size}/100`);
      console.log(`👥 捕获的Direct ID: ${directIDTracker.ids.size}`);
      console.log(`🐛 调试模式: ${debugMode ? "开启" : "关闭"}`);
      console.log(`🔔 通知状态: ${notificationsEnabled ? "已启用" : "未启用"}`);

      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        console.log(
          `🕐 最后消息: ${new Date(lastMsg.timestamp).toLocaleString()}`
        );
      }

      if (directIDTracker.lastUpdate) {
        console.log(`🕐 最后ID更新: ${directIDTracker.lastUpdate}`);
      }
    },

    showDirectIDs: () => {
      const ids = Array.from(directIDTracker.ids);
      console.log(
        `%c👥 所有Direct ID (共${ids.length}个)`,
        "color: #0066ff; font-weight: bold; font-size: 14px;"
      );
      console.table(ids);
    },

    showLastMessage: () => {
      const last = messages[messages.length - 1];
      if (last) {
        console.log("%c最后一条消息:", "color: #00ffff; font-weight: bold;");
        console.log(JSON.stringify(last, null, 2));
      } else {
        console.log("暂无消息");
      }
    },

    onMessage: (callback) => {
      callbacks.push(callback);
      console.log(`[Instagram] ✅ 已注册回调 (共 ${callbacks.length} 个)`);
    },

    clearMessages: () => {
      messages.length = 0;
      recentMessages.clear();
      console.log("[Instagram] 🗑️ 已清空消息记录");
    },

    setDebug: (enabled) => {
      debugMode = enabled;
      console.log(`[Instagram] 🐛 调试模式: ${enabled ? "已开启" : "已关闭"}`);
    },

    showLastDebug: () => {
      const last = messages[messages.length - 1];
      if (last && last._debug) {
        console.group(
          "%c🔍 最后一条消息的调试信息",
          "color: #ff00ff; font-weight: bold; font-size: 14px;"
        );
        console.log("完整调试信息:", last._debug);
        console.groupEnd();
      } else {
        console.log("暂无消息或无调试信息");
      }
    },

    getCurrentUserId: () => {
      try {
        const methods = [
          () => window._sharedData?.config?.viewerId,
          () => {
            const data = localStorage.getItem("ig_csrf_token");
            return data;
          },
          () => {
            const meta = document.querySelector(
              'meta[name="instagram-user-id"]'
            );
            return meta?.content;
          },
        ];

        for (const method of methods) {
          try {
            const id = method();
            if (id) {
              console.log(
                "%c当前用户ID:",
                "color: #00ff00; font-weight: bold;",
                id
              );
              return id;
            }
          } catch (e) {}
        }

        console.log("%c无法获取当前用户ID", "color: #ff0000;");
        return null;
      } catch (e) {
        console.error("获取用户ID失败:", e);
        return null;
      }
    },

    // 通知相关API
    enableNotifications: async () => {
      const result = await requestNotificationPermission();
      if (result) {
        console.log(
          "%c[通知] ✅ 通知已成功启用",
          "color: #00ff00; font-weight: bold;"
        );
      } else {
        console.log(
          "%c[通知] ❌ 通知启用失败",
          "color: #ff0000; font-weight: bold;"
        );
      }
      return result;
    },

    disableNotifications: () => {
      notificationsEnabled = false;
      console.log("%c[通知] 🔕 通知已禁用", "color: #ff9900;");
    },

    getNotificationStatus: () => {
      if (!("Notification" in window)) {
        return "不支持";
      }
      return {
        permission: Notification.permission,
        enabled: notificationsEnabled,
      };
    },

    testNotification: () => {
      if (!notificationsEnabled) {
        console.log(
          "%c[通知] ⚠️ 通知未启用，请先调用 enableNotifications()",
          "color: #ff9900;"
        );
        return;
      }

      const testMessage = {
        threadId: "test",
        messageText: "这是一条测试通知！",
        timestamp: Date.now(),
      };

      sendNotification(testMessage);
      console.log("%c[通知] 📬 测试通知已发送", "color: #00ccff;");
    },

    test: () => {
      console.log(
        `%c[Instagram] 测试: 消息${
          messages.length
        } | WebSocket${wsCount} | DirectID${directIDTracker.ids.size} | 通知${
          notificationsEnabled ? "✓" : "✗"
        }`,
        "color: #FFA500;"
      );
    },
  };

  console.log(
    "%c[Instagram] ✅ 初始化完成 v3.3 通知版",
    "color: #00ff00; font-size: 16px; font-weight: bold;"
  );
  console.log(
    "%c✅ Direct ID 捕获器已启用",
    "color: #00aa00; font-weight: bold;"
  );
  console.log("%c🐛 调试模式已开启", "color: #ff6600; font-weight: bold;");
  console.log("%c🔔 通知功能已集成", "color: #00ccff; font-weight: bold;");
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
  console.log("%c可用命令:", "color: #00ccff; font-weight: bold;");
  console.log("  InstagramListener.enableNotifications()  - 启用系统通知");
  console.log("  InstagramListener.disableNotifications() - 禁用系统通知");
  console.log("  InstagramListener.testNotification()     - 发送测试通知");
  console.log("  InstagramListener.getNotificationStatus()- 查看通知状态");
  console.log("  InstagramListener.showStats()            - 查看统计信息");
  console.log("  InstagramListener.showDirectIDs()        - 查看所有Direct ID");
  console.log("  InstagramListener.showLastMessage()      - 查看最后一条消息");
  console.log("  InstagramListener.showLastDebug()        - 查看完整调试信息");
  console.log("  InstagramListener.getCurrentUserId()     - 获取当前用户ID");
  console.log("  InstagramListener.setDebug(false)        - 关闭调试模式");
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
  console.log(
    "%c💡 提示: 首次使用请运行 InstagramListener.enableNotifications() 以启用通知",
    "color: #ffcc00; font-style: italic;"
  );

  // 自动请求通知权限
  setTimeout(() => {
    if (Notification.permission === "default") {
      console.log(
        "%c[通知] 💡 检测到未授权，3秒后将请求通知权限...",
        "color: #ffcc00;"
      );
      setTimeout(() => requestNotificationPermission(), 3000);
    } else if (Notification.permission === "granted") {
      notificationsEnabled = true;
      console.log("%c[通知] ✅ 通知权限已存在，自动启用", "color: #00ff00;");
    }
  }, 2000);

  setTimeout(() => window.InstagramListener.test(), 2000);
})();
