const { webFrame } = require("electron");

console.log("fillChromeAPI.js - direct injection");

// ✅ 直接在页面上下文执行，完全避免 contextBridge
webFrame.executeJavaScript(`
(function initChromeAPI() {
  console.log("🔧 fillChromeAPI.js - 初始化");
  
  // 确保 chrome 存在
  window.chrome = window.chrome || {};
  
  // 安全地添加 API（不覆盖已存在的）
  if (!window.chrome.notifications) {
    window.chrome.notifications = {
      onClicked: { addListener: function () {} },
      onClosed: { addListener: function () {} },
      create: function () {},
      clear: function () {},
      getAll: function () {},
      update: function () {},
    };
  }
  
  if (!window.chrome.tabs) {
    window.chrome.tabs = {
      getZoom: function () {
        return { then: function (cb) { if (cb) cb(); } };
      },
    };
  }
  
  if (!window.chrome.action) {
    window.chrome.action = {
      setBadgeText: function () {},
    };
  }
  
  if (!window.chrome.downloads) {
    window.chrome.downloads = {
      download: async function (opts) {
        if (window.saveAsFile) {
          window.saveAsFile(opts.url, opts.filename);
        }
      },
      onChanged: { addListener: function () {} },
    };
  }
  
  if (!window.chrome.cookies) {
    window.chrome.cookies = {
      remove: function () {},
      getAll: function () {},
      getAllCookieStores: function () {},
      onChanged: { addListener: function () {} },
    };
  }
  
  console.log("✅ Chrome API 注入完成");
})();

// XHR Hook
(function initXHRHook() {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      if (window.handleXHRResponse) {
        window.handleXHRResponse(this);
      }
    });
    return originalSend.apply(this, args);
  };

  console.log("✅ XMLHttpRequest Hook 已初始化");
})();
`);
