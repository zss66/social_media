// ============================================
// Instagram WebSocket Pre-Injector v1.0
// 最早期注入，确保在 Instagram 初始化前劫持 WebSocket
// ============================================

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

          console.log(
            `%c[IG-WS-PreInject] 📦 消息已暂存 (#${wsId}) - 队列: ${pendingMessages.length}`,
            "color: #ffcc00;"
          );

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
      `%c[IG-WS-PreInject] 🎯 拦截 WebSocket 创建`,
      "color: #00aaff; font-weight: bold;"
    );
    console.log(`  URL: ${url.substring(0, 80)}...`);

    // 立即创建原始 WebSocket
    const ws = protocols
      ? new TrueNativeWebSocket(url, protocols)
      : new TrueNativeWebSocket(url);

    const isInstagramIM = url.includes("edge-chat.instagram.com");

    if (isInstagramIM) {
      wsCount++;
      const wsId = wsCount;

      console.log(
        `%c[IG-WS-PreInject] 📡 Instagram IM 连接 #${wsId} - 预注入监听`,
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
            `%c[IG-WS-PreInject] 👁️ Instagram 设置 onmessage (#${wsId})`,
            "color: #ffcc00;"
          );
          originalOnMessage = handler;

          if (handler) {
            const wrappedHandler = function (event) {
              // 先执行我们的监听
              try {
                messageHandler(event);
              } catch (error) {
                console.error(`[IG-WS-PreInject] 监听器错误:`, error);
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
            `%c[IG-WS-PreInject] 👁️ Instagram 添加 message 监听器 (#${wsId})`,
            "color: #ffcc00;"
          );

          const wrappedListener = function (event) {
            try {
              messageHandler(event);
            } catch (error) {
              console.error(`[IG-WS-PreInject] 监听器错误:`, error);
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
          `%c[IG-WS-PreInject] 🟢 连接已建立 (#${wsId})`,
          "color: #00ff00; font-weight: bold;"
        );
      });

      originalAddEventListener("close", (event) => {
        console.log(
          `%c[IG-WS-PreInject] 🔴 连接已断开 (#${wsId}, code: ${event.code})`,
          "color: #ff6600;"
        );
      });

      console.log(
        `%c[IG-WS-PreInject] ✅ 预注入监听已安装 (#${wsId})`,
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
        `%c[IG-WS-PreInject] 🎯 主脚本已就绪，待处理消息: ${pendingMessages.length}`,
        "color: #00ffff; font-weight: bold;"
      );
      return pendingMessages.length;
    },
    clearPending: () => {
      const count = pendingMessages.length;
      pendingMessages.length = 0;
      console.log(
        `%c[IG-WS-PreInject] 🗑️ 已清空 ${count} 条待处理消息`,
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
