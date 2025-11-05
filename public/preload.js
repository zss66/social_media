/*
 * @Description: Electron preload 脚本
 * 兼容 contextIsolation: true
 * 所有 Node.js 操作通过主进程 IPC 代理
 */

const { contextBridge, ipcRenderer } = require("electron");

console.log("[preload] started");
// === 锁定 WebSocket，防止被覆盖 ===

// ==================== 安全暴露的 API ====================

contextBridge.exposeInMainWorld("electronAPI", {
  // === 基础窗口控制 ===
  getinfo: () => ({ platform: process.platform }),
  minimize: () =>
    ipcRenderer.invoke("minimize-window").catch(logError("minimize-window")),
  toggleFullscreen: () =>
    ipcRenderer
      .invoke("window-toggle-fullscreen")
      .catch(logError("toggle-fullscreen")),
  close: () =>
    ipcRenderer.invoke("close-window").catch(logError("close-window")),
  toggleDevTools: () =>
    ipcRenderer.invoke("toggle-devtools").catch(logError("toggle-devtools")),
  focusWindow: () =>
    ipcRenderer.invoke("focus-window").catch(logError("focus-window")),

  // === 容器管理 ===
  initObserver: () =>
    ipcRenderer.invoke("init-observer").catch(logError("init-observer")),
  createContainerSession: (containerId, config) =>
    ipcRenderer
      .invoke("create-container-session", containerId, config)
      .catch(logError("create-container-session")),
  sleepContainer: async (containerId) => {
    console.log("Sleeping container", containerId);
    return await ipcRenderer.invoke("sleep-container-session", containerId);
  },
  wakeContainer: async (containerId, config) => {
    console.log("Waking container", containerId);
    return await ipcRenderer.invoke(
      "wake-container-session",
      containerId,
      config
    );
  },
  destroyContainerWebview: (containerId) =>
    ipcRenderer.invoke("destroy-container-webview", containerId),
  rebuildContainerWebview: (containerId, config) =>
    ipcRenderer.invoke("rebuild-container-webview", containerId, config),
  getContainerRestoreData: (containerId) =>
    ipcRenderer.invoke("get-container-restore-data", containerId),
  cleanupContainerData: (containerId) =>
    ipcRenderer.invoke("cleanup-container-data", containerId),
  registerContainerWebview: (containerId, webContentsId) =>
    ipcRenderer.invoke(
      "register-container-webview",
      containerId,
      webContentsId
    ),
  unregisterContainerWebview: (containerId) =>
    ipcRenderer.invoke("unregister-container-webview", containerId),

  // === 代理相关 ===
  testProxy: (proxyConfig) =>
    ipcRenderer.invoke("test-proxy", proxyConfig).catch(logError("test-proxy")),
  checkProxyStatus: (containerId) =>
    ipcRenderer.invoke("check-proxy-status", containerId),
  resetContainerProxy: (containerId, config) =>
    ipcRenderer.invoke("reset-container-proxy", containerId, config),

  // === 翻译与知识库 ===
  translateText: (text, channel, targetLang) =>
    ipcRenderer
      .invoke("translate-text", text, channel, targetLang)
      .catch(logError("translate-text")),
  sendKnowledgeBaseMessage: (message, knowledge) =>
    ipcRenderer
      .invoke("send-knowledge-base-message", message, knowledge)
      .catch(logError("knowledge-base")),

  // === 文件操作（通过主进程代理）===
  getPreloadPath: () =>
    ipcRenderer.invoke("get-preload-path").catch(logError("get-preload-path")),
  saveFile: (data, filename) => ipcRenderer.invoke("save-file", data, filename),
  loadFile: () => ipcRenderer.invoke("load-file"),
  readScriptFile: (relativePath) =>
    ipcRenderer.invoke("read-script-file", relativePath), // 新增：安全读文件

  // === 通知系统 ===
  showNotification: (options) =>
    ipcRenderer.invoke("show-notification", options),
  setupNotificationIntercept: (config) =>
    ipcRenderer.invoke("setup-notification-intercept", config),
  sendInterceptedNotification: (data) =>
    ipcRenderer.invoke("send-intercepted-notification", data),
  showNativeNotification: (data) =>
    ipcRenderer.invoke("show-native-notification", data),
  closeNativeNotification: (id) =>
    ipcRenderer.invoke("close-native-notification", id),
  updateNotificationSettings: (settings) =>
    ipcRenderer.invoke("update-notification-settings", settings),
  updateNotificationIntercept: (config) =>
    ipcRenderer.invoke("update-notification-intercept", config),
  closeAllNotifications: () => ipcRenderer.invoke("close-all-notifications"),
  getNotificationStats: () => ipcRenderer.invoke("get-notification-stats"),

  // === 截图与插件 ===
  takeScreenshot: (containerId) =>
    ipcRenderer.invoke("take-screenshot", containerId),
  loadPlugin: (config) => ipcRenderer.invoke("load-plugin", config),

  // === 应用锁与设置 ===
  triggerAppLock: () => ipcRenderer.send("app-lock"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),
  verifyPassword: (password) => ipcRenderer.invoke("verify-password", password),
  loadSettings: () => ipcRenderer.invoke("load-settings"),

  // === 事件监听（返回取消函数）===
  onContainerMessage: (callback) => {
    const listener = (event, ...args) => callback(...args);
    ipcRenderer.on("container-message", listener);
    return () => ipcRenderer.removeListener("container-message", listener);
  },
  removeContainerMessageListener: (callback) =>
    ipcRenderer.removeListener("container-message", callback),

  onNotificationIntercepted: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("notification-intercepted", listener);
    return () =>
      ipcRenderer.removeListener("notification-intercepted", listener);
  },
  onNotificationClick: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("notification-clicked", listener);
    return () => ipcRenderer.removeListener("notification-clicked", listener);
  },
  onNotificationClosed: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on("notification-closed", listener);
    return () => ipcRenderer.removeListener("notification-closed", listener);
  },

  // === 扩展功能 ===
  getLineExtensionUrl: () => ipcRenderer.invoke("get-line-extension-url"),
});

// ==================== Node 信息（安全暴露）================
contextBridge.exposeInMainWorld("nodeAPI", {
  versions: process.versions,
});

contextBridge.exposeInMainWorld("platformAPI", {
  platform: process.platform,
  arch: process.arch,
  isWindows: process.platform === "win32",
  isMac: process.platform === "darwin",
  isLinux: process.platform === "linux",
});

// ==================== WebSocket 消息分发器 ====================

// ==================== 安全注入 Instagram 脚本 ====================
// (async () => {
//   console.log(window.containerConfig);
//   try {
//     const result = await ipcRenderer.invoke(
//       "read-script-file",
//       "/public/services/instagramWebSocketListener.js"
//     );

//     if (result.success && result.content) {
//       // 使用 new Function 替代 eval，安全性更高
//       const scriptFunc = new Function(
//         result.content + "\n//# sourceURL=instagramWebSocketListener.js"
//       );
//       scriptFunc();

//       console.log("%c[Instagram 脚本已注入]", "color:#0b0;font-weight:bold;");
//     } else {
//       console.error("注入 Instagram 脚本失败:", result.error || "未知错误");
//     }
//   } catch (err) {
//     console.error("异步加载 Instagram 脚本异常:", err);
//   }
// })();

// ==================== 工具函数 ====================
function logError(name) {
  return (error) => {
    console.error(`[${name}] 调用失败:`, error);
  };
}
