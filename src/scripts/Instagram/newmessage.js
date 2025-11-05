// ============================================
// Instagram Listener v4.0 Main Script
// 主脚本（需先加载 WebSocket Pre-Injector）
// ============================================

export const newInstagramMessage = `
(function () {
  "use strict";

  console.log(
    "%c[IG-WS-PreInject] 🚀 启动 WebSocket 预注入",
    "color: #00ffff; font-size: 16px; font-weight: bold; background: #000; padding: 5px;"
  );

  // === 1. 保存真正的原始 WebSocket ===
  const TrueNativeWebSocket = (function () {
    let proto = window.WebSocket;
    while (proto && proto.name === "ProxyWebSocket" && proto.__original__) {
      proto = proto.__original__;
    }
    return proto || window.WebSocket;
  })();

  console.log(
    "%c[IG-WS-PreInject] 📌 已保存原始 WebSocket: " + TrueNativeWebSocket.name,
    "color: #00ff88; font-weight: bold;"
  );

  // === 2. 消息队列（在主脚本加载前暂存） ===
  const pendingMessages = [];
  let mainScriptReady = false;
  let wsCount = 0;

  // === 3. 消息处理器（简化版，仅存储） ===
  function createMessageHandler(wsId) {
    return function (event) {
      try {
        if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
          const timestamp = Date.now();

          // 存储到队列
          pendingMessages.push({
            wsId,
            timestamp,
            data: event.data,
          });

          

          // 如果主脚本已就绪，立即处理
          if (mainScriptReady && window.InstagramListener?._processMessage) {
            try {
              window.InstagramListener._processMessage(event.data);
            } catch (e) {
              console.error("[IG-WS-PreInject] 处理消息失败:", e);
            }
          }
        }
      } catch (error) {
        console.error("[IG-WS-PreInject] 消息捕获异常:", error);
      }
    };
  }

  // === 4. WebSocket 代理（极简版） ===
  function InstagramProxyWebSocket(url, protocols) {
    console.log(
      \`%c[IG-WS-PreInject] 🎯 拦截 WebSocket 创建\`,
      "color: #00aaff; font-weight: bold;"
    );
    console.log(\`  URL: \${url.substring(0, 80)}...\`);

    // 立即创建原始 WebSocket
    const ws = protocols
      ? new TrueNativeWebSocket(url, protocols)
      : new TrueNativeWebSocket(url);

    const isInstagramIM = url.includes("edge-chat.instagram.com");

    if (isInstagramIM) {
      wsCount++;
      const wsId = wsCount;

      console.log(
        \`%c[IG-WS-PreInject] 📡 Instagram IM 连接 #\${wsId} - 预注入监听\`,
        "color: #00ff00; font-size: 13px; font-weight: bold;"
      );

      const messageHandler = createMessageHandler(wsId);

      // === 透明劫持 onmessage ===
      let originalOnMessage = null;

      Object.defineProperty(ws, "onmessage", {
        get() {
          return originalOnMessage;
        },
        set(handler) {
          console.log(
            \`%c[IG-WS-PreInject] 👁️ Instagram 设置 onmessage (#\${wsId})\`,
            "color: #ffcc00;"
          );
          originalOnMessage = handler;

          if (handler) {
            const wrappedHandler = function (event) {
              // 先执行我们的监听
              try {
                messageHandler(event);
              } catch (error) {
                console.error(\`[IG-WS-PreInject] 监听器错误:\`, error);
              }
              // 再调用 Instagram 的原始处理器
              return handler.call(this, event);
            };

            Object.getOwnPropertyDescriptor(
              TrueNativeWebSocket.prototype,
              "onmessage"
            ).set.call(ws, wrappedHandler);
          }
        },
        configurable: true,
        enumerable: true,
      });

      // === 透明包装 addEventListener ===
      const originalAddEventListener = ws.addEventListener.bind(ws);
      const originalRemoveEventListener = ws.removeEventListener.bind(ws);

      ws.addEventListener = function (type, listener, options) {
        if (type === "message" && listener) {
          console.log(
            \`%c[IG-WS-PreInject] 👁️ Instagram 添加 message 监听器 (#\${wsId})\`,
            "color: #ffcc00;"
          );

          const wrappedListener = function (event) {
            try {
              messageHandler(event);
            } catch (error) {
              console.error(\`[IG-WS-PreInject] 监听器错误:\`, error);
            }
            return listener.call(this, event);
          };

          return originalAddEventListener(type, wrappedListener, options);
        }
        return originalAddEventListener(type, listener, options);
      };

      ws.removeEventListener = originalRemoveEventListener;

      // === 添加备份监听器 ===
      originalAddEventListener("message", messageHandler, { capture: true });

      originalAddEventListener("open", () => {
        console.log(
          \`%c[IG-WS-PreInject] 🟢 连接已建立 (#\${wsId})\`,
          "color: #00ff00; font-weight: bold;"
        );
      });

      originalAddEventListener("close", (event) => {
        console.log(
          \`%c[IG-WS-PreInject] 🔴 连接已断开 (#\${wsId}, code: \${event.code})\`,
          "color: #ff6600;"
        );
      });

      console.log(
        \`%c[IG-WS-PreInject] ✅ 预注入监听已安装 (#\${wsId})\`,
        "color: #00cc00; font-style: italic;"
      );
    }

    return ws;
  }

  // === 5. 继承原型 ===
  InstagramProxyWebSocket.prototype = TrueNativeWebSocket.prototype;
  Object.setPrototypeOf(InstagramProxyWebSocket, TrueNativeWebSocket);

  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach((prop, index) => {
    Object.defineProperty(InstagramProxyWebSocket, prop, {
      value: index,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  });

  InstagramProxyWebSocket.__original__ = TrueNativeWebSocket;
  InstagramProxyWebSocket.__isInstagramProxy__ = true;

  // === 6. 安装到全局（强制且不可逆） ===
  function installWebSocketProxy() {
    try {
      // 先尝试删除旧属性
      try {
        delete window.WebSocket;
      } catch (e) {}

      // 强制定义
      Object.defineProperty(window, "WebSocket", {
        get: () => InstagramProxyWebSocket,
        set: (value) => {
          console.warn(
            "%c[IG-WS-PreInject] 🛡️ 拦截覆盖尝试，保持预注入代理",
            "color: #ff0000; font-weight: bold; font-size: 14px;"
          );
        },
        configurable: false, // 不可配置，防止被覆盖
        enumerable: true,
      });

      console.log(
        "%c[IG-WS-PreInject] ✅ 预注入代理安装成功（不可逆）",
        "color: #00ff00; font-size: 14px; font-weight: bold;"
      );
      return true;
    } catch (error) {
      console.error("[IG-WS-PreInject] ❌ 预注入失败:", error);

      // 回退方案：直接替换
      try {
        window.WebSocket = InstagramProxyWebSocket;
        console.warn("%c[IG-WS-PreInject] ⚠️ 使用回退方案", "color: #ff9900;");
        return true;
      } catch (e) {
        console.error("[IG-WS-PreInject] ❌ 回退方案也失败:", e);
        return false;
      }
    }
  }

  // === 7. 立即安装 ===
  const installed = installWebSocketProxy();

  if (!installed) {
    console.error(
      "%c[IG-WS-PreInject] ❌ 预注入失败，消息监听将不可用",
      "color: #ff0000; font-size: 16px; font-weight: bold;"
    );
  }

  // === 8. 防御性检查（每秒） ===
  setInterval(() => {
    try {
      const currentWS = window.WebSocket;
      if (
        currentWS !== InstagramProxyWebSocket &&
        !currentWS.__isInstagramProxy__
      ) {
        console.warn(
          "%c[IG-WS-PreInject] 🔄 检测到代理被覆盖，强制恢复",
          "color: #ff0000; font-weight: bold;"
        );
        installWebSocketProxy();
      }
    } catch (e) {
      console.error("[IG-WS-PreInject] 检查失败:", e);
    }
  }, 1000);

  // === 9. 暴露给主脚本的接口 ===
  window.__IGWSPreInject__ = {
    version: "1.0",
    wsCount: () => wsCount,
    pendingMessages: () => pendingMessages,
    markReady: () => {
      mainScriptReady = true;
      console.log(
        \`%c[IG-WS-PreInject] 🎯 主脚本已就绪，待处理消息: \${pendingMessages.length}\`,
        "color: #00ffff; font-weight: bold;"
      );
      return pendingMessages.length;
    },
    clearPending: () => {
      const count = pendingMessages.length;
      pendingMessages.length = 0;
      console.log(
        \`%c[IG-WS-PreInject] 🗑️ 已清空 \${count} 条待处理消息\`,
        "color: #ff9900;"
      );
    },
    getStats: () => ({
      wsCount,
      pendingCount: pendingMessages.length,
      mainReady: mainScriptReady,
      proxyActive: window.WebSocket === InstagramProxyWebSocket,
    }),
  };

  // === 初始化完成 ===
  console.log(
    "%c[IG-WS-PreInject] ✅ 预注入完成，等待主脚本...",
    "color: #00ff00; font-size: 14px; font-weight: bold;"
  );
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
  console.log(
    "%c💡 使用 window.__IGWSPreInject__.getStats() 查看状态",
    "color: #ffcc00;"
  );
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
})();

(function () {
  "use strict";
  
  // === 检查预注入脚本 ===
  if (!window.__IGWSPreInject__) {
    console.error(
      "%c[Instagram] ❌ 未检测到 WebSocket 预注入脚本！",
      "color: #ff0000; font-size: 16px; font-weight: bold;"
    );
    console.error("%c请确保先加载 instagram-ws-preinjector.js", "color: #ff0000;");
    return;
  }

  console.log(
    "%c[Instagram Listener v4.0 Main] 🔥 启动",
    "color: #E4405F; font-size: 18px; font-weight: bold;"
  );

  // === 核心变量 ===
  const messages = [];
  const callbacks = [];
  const recentMessages = new Set();
  let debugMode = true;
  let notificationsEnabled = false;

  // === 通知权限管理 ===
  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("%c[通知] ⚠️ WebView 不支持 Notification API", "color: #ff9900;");
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
        new Notification("Instagram 消息监听器", {
          body: "通知已启用！您将收到新消息提醒",
          icon: "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
          tag: "test",
        });
      }
      return notificationsEnabled;
    }
    return false;
  }

  // === 发送通知 ===
  function sendNotification(parsed) {
    if (!notificationsEnabled || Notification.permission !== "granted") return;
    try {
      const title = "Instagram 新消息";
      let body = parsed.messageText || "[未知消息]";
      if (body.length > 100) {
        body = body.substring(0, 97) + "...";
      }
      const notification = new Notification(title, {
        body: body,
        icon: "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
        tag: parsed.threadId || "instagram-message",
        timestamp: parsed.timestamp,
      });
      notification.onclick = () => {
        window.focus();
        navigateToThread(parsed.threadId);
        notification.close();
      };
      setTimeout(() => notification.close(), 5000);
    } catch (e) {
      console.error("[通知] ❌ 发送失败:", e);
    }
  }

  // === Direct ID 追踪器 ===
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
      \`%c[✓] %c\${id} %c@ \${directIDTracker.lastUpdate}\`,
      "color: #00aa00; font-weight: bold;",
      "color: #ff6600; font-family: monospace; font-weight: bold;",
      "color: #888888; font-size: 11px;"
    );
    return true;
  }

  function handleBodyText(bodyText) {
    if (!bodyText || typeof bodyText !== "string") return;
    const matches = [...bodyText.matchAll(/\\/direct\\/t\\/(\\d+)/g)];
    if (matches.length) {
      matches.forEach(m => captureDirectID(m[1]));
    }
  }

  // === 拦截 XHR ===
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
        if (this.readyState === 4 && this.responseText) {
          handleBodyText(this.responseText);
          
          if (self._xhrUrl && self._xhrUrl.includes("direct")) {
            try {
              const data = JSON.parse(this.responseText);
              if (data?.inbox?.threads) {
                data.inbox.threads.forEach((thread) => {
                  if (thread.thread_id) captureDirectID(thread.thread_id);
                });
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
      
      if (origOnReadyStateChange) {
        origOnReadyStateChange.apply(this, arguments);
      }
    };
    return origSend.apply(this, arguments);
  };

  // === SPA 路由导航 ===
  function navigateToThread(threadId) {
    if (!threadId) return false;
    const targetPath = \`/direct/t/\${threadId}/\`;
    if (window.location.pathname === targetPath) {
      console.log("[Instagram] ℹ️ 已在此对话中");
      return true;
    }
    console.log(
      \`%c[Instagram] 🔗 进入对话: \${threadId}\`,
      "color: #FFA500; font-weight: bold;"
    );
    window.history.pushState(null, "", targetPath);
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    setTimeout(() => {
      const link = document.querySelector(\`a[href="\${targetPath}"]\`);
      if (link) link.click();
    }, 100);
    return true;
  }

  // === 工具函数 ===
  function decodeUnicode(str) {
    try {
      return str.replace(/\\\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
    } catch (e) {
      return str;
    }
  }

  function cleanUrl(url) {
    if (!url) return null;
    return url.replace(/\\\\\\\\/g, "/");
  }

  function extractJSON(text) {
    try {
      const lsRespIndex = text.indexOf("/ls_resp");
      if (lsRespIndex === -1) return null;
      const afterLsResp = text.substring(lsRespIndex);
      const jsonStart = afterLsResp.indexOf("{");
      if (jsonStart === -1) return null;
      const jsonStr = afterLsResp.substring(jsonStart);
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

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

  function parseValue(val) {
    if (!val) return null;
    if (Array.isArray(val)) {
      if (val[0] === 19 && val.length >= 2) return val[1];
      if (val[0] === 9) return null;
    }
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      return val;
    }
    return null;
  }

  // === 提取消息片段 ===
  function extractThreadSnippet(stepArray) {
    const args = findOperation(stepArray, "updateThreadSnippet");
    if (!args || args.length < 2) return null;
    const messageText = args[1];
    if (typeof messageText === "string") {
      return decodeUnicode(messageText);
    }
    return null;
  }

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
    return {
      mediaType,
      mediaUrl,
      previewUrl: previewUrl && previewUrl !== mediaUrl ? previewUrl : null,
      mimeType,
      isXma: true,
    };
  }

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
    return {
      mediaType,
      fileName,
      fileSize: fileSize ? parseInt(fileSize) : null,
      mediaUrl,
      previewUrl: fallbackUrl && fallbackUrl !== mediaUrl ? fallbackUrl : null,
      mimeType,
    };
  }

  // === 解析 Instagram 消息 ===
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
          return null;
        }
      }
      
      if (!payload || !payload.step) return null;
      
      const stepArray = payload.step;
      if (!findOperation(stepArray, "insertMessage")) return null;
      
      let messageText = extractThreadSnippet(stepArray);
      const insertMsgInfo = extractInsertMessage(stepArray);
      if (!insertMsgInfo || !insertMsgInfo.threadId) return null;
      
      let mediaInfo = null;
      if (findOperation(stepArray, "insertXmaAttachment")) {
        mediaInfo = extractXmaAttachment(stepArray);
        if (!messageText && mediaInfo && mediaInfo.mediaType) {
          switch (mediaInfo.mediaType) {
            case "gif": messageText = "[GIF动图]"; break;
            case "sticker": messageText = "[贴图]"; break;
            default: messageText = "[分享]";
          }
        }
      } else if (findOperation(stepArray, "insertBlobAttachment")) {
        mediaInfo = extractBlobAttachment(stepArray);
        if (!messageText && mediaInfo && mediaInfo.mediaType) {
          switch (mediaInfo.mediaType) {
            case "image": messageText = "[图片]"; break;
            case "audio": messageText = \`[语音]\`; break;
            case "video": messageText = "[视频]"; break;
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
        },
      };
      
      if (mediaInfo) {
        Object.assign(result, mediaInfo);
      }
      
      return result;
    } catch (e) {
      console.error("[Instagram] ❌ 解析失败:", e);
      return null;
    }
  }

  // === 检查重复消息 ===
  function isDuplicate(parsed) {
    const hash = parsed.messageId || \`\${parsed.threadId}_\${parsed.messageText}_\${parsed.senderId}\`;
    if (recentMessages.has(hash)) return true;
    recentMessages.add(hash);
    if (recentMessages.size > 100) {
      const oldest = Array.from(recentMessages)[0];
      recentMessages.delete(oldest);
    }
    return false;
  }

  // === 处理新消息 ===
  async function handleNewMessage(parsed) {
    if (isDuplicate(parsed)) {
      console.log("%c[Instagram] ⏭️ 跳过重复消息", "color: #888;");
      return;
    }
    
    // 检查是否是自己发的
    const snippetArgs = findOperation(parsed._debug.stepArray, "updateThreadSnippet");
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
        \`%c[Instagram] 🙈 跳过自己发送的消息: "\${parsed.messageText}"\`,
        "color: #aaa; font-style: italic;"
      );
      return;
    }
    
    console.log("%c" + "═".repeat(60), "color: #E4405F;");
    console.log("%c📨 新消息", "color: #00ff00; font-size: 16px; font-weight: bold;");
    console.log("💬 内容:", parsed.messageText);
    console.log("🆔 Thread ID:", parsed.threadId);
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
    sendNotification(parsed);
    
    // 知识库处理
    if (
      !parsed.mediaType &&
      pluginConfig?.knowledge?.enableRetrieval &&
      pluginConfig?.knowledge?.selectedKnowledgeBase
    ) {
      setTimeout(() => {
        navigateToThread(parsed.threadId);
      }, 1000);
      console.log('触发知识库检索，消息内容:', parsed.messageText);
      const response = await window.electronAPI.sendKnowledgeBaseMessage(
        parsed.messageText,
        pluginConfig?.knowledge
      );
      window?.replaceAndSend(response);
    }
  }

  // === 消息处理函数（供预注入脚本调用） ===
  function processMessageData(data) {
    if (data instanceof Blob) {
      data.arrayBuffer().then((buffer) => {
        const bytes = new Uint8Array(buffer);
        const parsed = parseInstagramMessage(bytes);
        if (parsed) handleNewMessage(parsed);
      }).catch(err => {
        console.error('[Instagram] Blob 处理失败:', err);
      });
    } else if (data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(data);
      const parsed = parseInstagramMessage(bytes);
      if (parsed) handleNewMessage(parsed);
    }
  }

  // === 处理预注入脚本暂存的消息 ===
  function processPendingMessages() {
    const pending = window.__IGWSPreInject__.pendingMessages();
    if (pending.length > 0) {
      console.log(
        \`%c[Instagram] 📦 处理 \${pending.length} 条暂存消息\`,
        "color: #ffcc00; font-weight: bold;"
      );
      pending.forEach((msg) => {
        try {
          processMessageData(msg.data);
        } catch (e) {
          console.error('[Instagram] 处理暂存消息失败:', e);
        }
      });
      window.__IGWSPreInject__.clearPending();
    }
  }

  // === 全局 API ===
  window.InstagramListener = {
    _processMessage: processMessageData, // 供预注入脚本调用
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
      const preStats = window.__IGWSPreInject__.getStats();
      console.log(
        "%c📊 统计信息",
        "color: #E4405F; font-size: 16px; font-weight: bold;"
      );
      console.log(\`📨 总消息数: \${messages.length}\`);
      console.log(\`🔌 WebSocket 连接数: \${preStats.wsCount}\`);
      console.log(\`📦 待处理消息: \${preStats.pendingCount}\`);
      console.log(\`💾 去重缓存: \${recentMessages.size}/100\`);
      console.log(\`👥 捕获的Direct ID: \${directIDTracker.ids.size}\`);
      console.log(\`🐛 调试模式: \${debugMode ? "开启" : "关闭"}\`);
      console.log(\`🔔 通知状态: \${notificationsEnabled ? "已启用" : "未启用"}\`);
      console.log(\`🛡️ 预注入代理: \${preStats.proxyActive ? "✅ 活跃" : "❌ 失效"}\`);
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
      console.log(\`[Instagram] ✅ 已注册回调 (共 \${callbacks.length} 个)\`);
    },
    clearMessages: () => {
      messages.length = 0;
      recentMessages.clear();
      console.log("[Instagram] 🗑️ 已清空消息记录");
    },
    setDebug: (enabled) => {
      debugMode = enabled;
      console.log(\`[Instagram] 🐛 调试模式: \${enabled ? "已开启" : "已关闭"}\`);
    },
    enableNotifications: requestNotificationPermission,
    disableNotifications: () => {
      notificationsEnabled = false;
      console.log("%c[通知] 🔕 通知已禁用", "color: #ff9900;");
    },
    test: () => {
      const preStats = window.__IGWSPreInject__.getStats();
      console.log(
        \`%c[Instagram] 测试: 消息\${messages.length} | WS\${preStats.wsCount} | 待处理\${preStats.pendingCount} | DirectID\${directIDTracker.ids.size} | 通知\${notificationsEnabled ? "✓" : "✗"}\`,
        "color: #FFA500;"
      );
    },
  };

  // === 标记主脚本就绪 ===
  window.__IGWSPreInject__.markReady();

  // === 处理预注入脚本暂存的消息 ===
  processPendingMessages();

  // === 初始化日志 ===
  console.log(
    "%c[Instagram] ✅ 主脚本初始化完成 v4.0",
    "color: #00ff00; font-size: 16px; font-weight: bold;"
  );
  console.log(
    "%c🎯 已连接到预注入脚本 (v" + window.__IGWSPreInject__.version + ")",
    "color: #00ffcc; font-weight: bold;"
  );
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");
  console.log("%c可用命令:", "color: #00ccff; font-weight: bold;");
  console.log(" InstagramListener.showStats() - 查看统计信息");
  console.log(" InstagramListener.enableNotifications() - 启用通知");
  console.log(" window.__IGWSPreInject__.getStats() - 查看预注入状态");
  console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: #666;");

  // === 自动请求通知权限 ===
  setTimeout(() => {
    if (Notification.permission === "default") {
      setTimeout(() => requestNotificationPermission(), 3000);
    } else if (Notification.permission === "granted") {
      notificationsEnabled = true;
      console.log("%c[通知] ✅ 通知权限已存在，自动启用", "color: #00ff00;");
    }
  }, 2000);

  // === 自动测试 ===
  setTimeout(() => window.InstagramListener.test(), 2000);
})();
`;
