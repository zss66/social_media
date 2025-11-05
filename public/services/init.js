// init_code.js
contextBridge.exposeInMainWorld("init_ws", {
  startWebSocket: () => {
    if (typeof window.__startWebSocket === "function") {
      window.__startWebSocket();
    }
  },
  stopWebSocket: () => {
    if (typeof window.__stopWebSocket === "function") {
      window.__stopWebSocket();
    }
  },
  getContainerConfig: () => window.containerConfig,
  getContainerId: () => window.containerId,
});

function injectWebSocketProxyToPage() {
  const proxyScript = `
    (function() {
      console.log('[WebSocket Proxy] 开始安装代理');
      
      const OriginalWebSocket = window.WebSocket;
      let canCreateWebSocket = false;
      let activeWebSocket = null;

      function ProxyWebSocket(url, protocols) {
        console.log(\`[Proxy] 捕获 WebSocket 请求: \${url}\`);

        if (!canCreateWebSocket) {
          console.warn(\`[Proxy] WebSocket 被阻止: \${url}\`);
          return createStubWebSocket(url);
        }

        console.log(\`[Proxy] 允许创建 WebSocket: \${url}\`);
        const ws = protocols
          ? new OriginalWebSocket(url, protocols)
          : new OriginalWebSocket(url);

        activeWebSocket = ws;
        return ws;
      }

      function createStubWebSocket(url) {
        return {
          url,
          readyState: 0,
          send: () => console.log(\`[Stub] send() 被阻止\`),
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          onerror: null,
          onopen: null,
          onmessage: null,
          onclose: null,
          binaryType: 'blob',
          bufferedAmount: 0,
          extensions: '',
          protocol: '',
          CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3
        };
      }

      ProxyWebSocket.prototype = OriginalWebSocket.prototype;
      ProxyWebSocket.CONNECTING = 0;
      ProxyWebSocket.OPEN = 1;
      ProxyWebSocket.CLOSING = 2;
      ProxyWebSocket.CLOSED = 3;

      Object.defineProperty(window, 'WebSocket', {
        value: ProxyWebSocket,
        writable: false,
        configurable: false
      });

      window.__startWebSocket = () => {
        canCreateWebSocket = true;
        console.log('[Proxy] ▶️ WebSocket 已启用');
      };

      window.__stopWebSocket = () => {
        canCreateWebSocket = false;
        if (activeWebSocket && activeWebSocket.readyState < 2) {
          activeWebSocket.close();
        }
        activeWebSocket = null;
        console.log('[Proxy] ⏹️ WebSocket 已禁用');
      };

      console.log('[WebSocket Proxy] ✅ 代理安装完成');
    })();
  `;

  // ✅ 使用 Blob URL 绕过 CSP（blob: 通常在 CSP 白名单中）
  const blob = new Blob([proxyScript], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  const script = document.createElement("script");
  script.src = blobUrl; // 使用 src 而不是 textContent
  script.onload = () => {
    URL.revokeObjectURL(blobUrl); // 清理
    console.log("[Preload] WebSocket 代理脚本已加载");
  };
  script.onerror = (e) => {
    console.error("[Preload] 脚本加载失败:", e);
  };

  const inject = () => {
    if (document.head) {
      document.head.prepend(script);
    } else {
      setTimeout(inject, 10);
    }
  };

  inject();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectWebSocketProxyToPage, {
    once: true,
  });
} else {
  injectWebSocketProxyToPage();
}

console.log("[Preload] 预加载脚本初始化完成");
