/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-09-18 16:35:20
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-11-26 09:26:12
 * @FilePath: /social_media/public/electron.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const {
  app,
  BrowserWindow,
  ipcMain,
  session,
  protocol,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

// ===========================================
// 简化的日志系统
// ===========================================
let logFile = null;
let logInitialized = false;

let logStream = null;

function initializeLogging() {
  try {
    const userDataPath = app.getPath("userData");
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    logFile = path.join(userDataPath, "main-process.log");
    // 创建一个写入流
    logStream = fs.createWriteStream(logFile, { flags: "a" });
    log("info", "日志系统初始化完成");
  } catch (error) {
    console.error(error);
  }
}

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [MAIN-${level.toUpperCase()}] ${message}`;

  console.log(logMessage); // 保持控制台输出

  // 异步写入，不阻塞主线程
  if (logStream && logStream.writable) {
    logStream.write(logMessage + "\n");
    if (args.length > 0) {
      logStream.write(`    Args: ${JSON.stringify(args)}\n`);
    }
  }
}

// ===========================================
// 代理认证支持 - 原始使用方式
// ===========================================
const { httpProxyRules } = require("./services/httpProxy");
const { sockProxyRules } = require("./services/socksProxy");

// 存储代理服务器引用
const proxyServers = new Map();

// ===========================================
// 基础设置
// ===========================================
log("info", "=== Electron 主进程启动 ===");
log(
  "info",
  `Node.js: ${process.version}, Electron: ${process.versions.electron}`
);

process.on("uncaughtException", (err) => {
  log("error", "未捕获异常:", err.message);
});

process.on("unhandledRejection", (reason, promise) => {
  log("error", "未处理的Promise拒绝:", reason);
});

// 其他模块导入
const { notificationManager } = require("./services/NotificationManager");
const translationService = require("./services/translationService.js");
require("@electron/remote/main").initialize();
const settingsManager = require("./services/settingsManager.cjs");
const { inject } = require("vue");

const isDev = process.env.NODE_ENV === "development";
const preloadPath = isDev
  ? path.join(__dirname, "../public/preload.js")
  : path.join(__dirname, "preload.js");
const linepreloadPath = isDev
  ? path.join(__dirname, "../public/fillChromeAPI.js")
  : path.join(__dirname, "fillChromeAPI.js");

// ===========================================
// 窗口管理
// ===========================================
let mainWindow = null;
let lockWindow = null;
const extensionPath = app.isPackaged
  ? path.join(process.resourcesPath, "extensions", "line-extension")
  : path.join(__dirname, "extensions", "line-extension");

console.log("Extension path:", extensionPath);
console.log("Exists:", require("fs").existsSync(extensionPath));

function createLockWindow() {
  log("info", "创建锁定窗口");

  lockWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  lockWindow.loadFile(path.join(__dirname, "../public/lock.html"));
  lockWindow.on("closed", () => {
    lockWindow = null;
  });
}

function createWindow() {
  log("info", "创建主窗口");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
      webviewTag: true,
      sandbox: true,
      preload: preloadPath,
      partition: "persist:my-session",
    },
  });

  require("@electron/remote/main").enable(mainWindow.webContents);

  const startUrl = isDev
    ? "http://localhost:8080"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow
    .loadURL(startUrl)
    .then(() => {
      log("info", "主窗口加载完成");
    })
    .catch((error) => {
      log("error", "主窗口加载失败:", error.message);
      app.quit();
    });

  notificationManager.initialize(mainWindow);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });
  mainWindow.on("close", (event) => {
    // Mac 下点击关闭按钮时，完全退出应用
    if (process.platform === "darwin") {
      app.quit(); // 强制退出应用
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("crashed", (event) => {
    log("error", "渲染进程崩溃");
  });

  mainWindow.webContents.on("unresponsive", () => {
    log("warn", "渲染进程无响应");
  });

  mainWindow.webContents.on("responsive", () => {
    log("info", "渲染进程恢复响应");
  });
}

// ===========================================
// 🔥 修复：容器会话创建 - 完全重写代理逻辑
// ===========================================
async function createContainerSession(containerId, config = {}) {
  log("info", `🚀 创建容器会话: ${containerId}`);
  log("info", "📋 容器配置:", JSON.stringify(config, null, 2));

  const partition = `persist:container_${containerId}`;
  const ses = session.fromPartition(partition);
  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;

    // 移除或修改 CSP 头
    if (headers["content-security-policy"]) {
      // 方法1：完全移除 CSP（最简单但最不安全）
      delete headers["content-security-policy"];

      // 方法2：修改 CSP 允许 unsafe-inline（推荐）
      // headers['content-security-policy'] = headers['content-security-policy'].map(
      //   csp => csp.replace(/script-src ([^;]+)/g, "script-src $1 'unsafe-inline'")
      // );
    }

    // 同样处理 CSP 的备用头
    if (headers["content-security-policy-report-only"]) {
      delete headers["content-security-policy-report-only"];
    }

    callback({ responseHeaders: headers });
  });
  try {
    // 🔥 步骤1：完全清理旧的代理设
    log("info", "🧹 清理旧代理设置");
    await ses.setProxy({
      proxyRules: "",
      proxyBypassRules: "",
      pacScript: "",
      mode: "system",
    });

    config = config.config || config; // 兼容传入整个container对象的情况
    let InjectCode = `
    const { contextBridge } = require("electron");
console.log("注入容器信息");
 contextBridge.exposeInMainWorld('containerConfig', ${JSON.stringify(config)});
contextBridge.exposeInMainWorld('containerId', "${containerId}");`;
    // InjectCode += `\n\n// init\n${fs.readFileSync(init_code, "utf8")}`;

    if (config.id === "line") {
      const lineAPIInitCode = fs.readFileSync(linepreloadPath, "utf8");
      log("info", "🚀 创建容器会话: line");

      // 确保 LINE API 也使用 contextBridge
      InjectCode += `\n\n// LINE Chrome API\n${lineAPIInitCode}`;
    }

    const preloadPath = path.join(
      app.getPath("temp"),
      `${config.id}_inject_${containerId}.js`
    );
    await fsp.writeFile(preloadPath, InjectCode, { encoding: "utf8" });
    const absolutePath = path.resolve(preloadPath); // ✅ 新增：绝对路径
    // ✅ 核心：用containerId作为ID + 自动跳过
    const scriptId = containerId; // 🎯 您的需求！

    try {
      // 先检查是否已注册
      const existingScripts = ses.getPreloadScripts();
      const alreadyRegistered = existingScripts.some(
        (script) => script.id === scriptId
      );

      if (alreadyRegistered) {
        log("info", `⏭️ 脚本已存在，跳过注册: ${scriptId}`);
      } else {
        // 首次注册
        ses.registerPreloadScript({
          id: scriptId, // ✅ containerId作为ID
          type: "frame",
          filePath: absolutePath,
        });
        log("info", `✅ 首次注册成功: ${scriptId}`);
      }
    } catch (error) {
      log("warn", `⚠️ 脚本注册异常（可能已注册）: ${error.message}`);
    }
    // 🔥 步骤2：设置用户代理和其他指纹
    if (config.fingerprint?.userAgent) {
      ses.setUserAgent(config.fingerprint.userAgent);
      log("info", "👤 用户代理已设置:", config.fingerprint.userAgent);

      // 附加指纹设置
      if (config.fingerprint.acceptLanguages) {
        ses.setUserAgent(
          config.fingerprint.userAgent,
          config.fingerprint.acceptLanguages
        );
        log(
          "info",
          "🌐 Accept Languages 已设置:",
          config.fingerprint.acceptLanguages
        );
      }

      // 模拟屏幕分辨率（通过 WebPreferences 影响渲染）
      if (config.fingerprint.screenResolution) {
        const [width, height] = config.fingerprint.screenResolution
          .split("x")
          .map(Number);
        ses.webRequest.onBeforeSendHeaders(
          { urls: ["<all_urls>"] },
          (details, callback) => {
            details.requestHeaders[
              "X-Screen-Resolution"
            ] = `${width}x${height}`;
            callback({ requestHeaders: details.requestHeaders });
          }
        );
        log(
          "info",
          "📏 屏幕分辨率模拟已设置:",
          config.fingerprint.screenResolution
        );
      }

      // 设置时区（通过环境变量或模拟）
      if (config.fingerprint.timezone) {
        process.env.TZ = config.fingerprint.timezone;
        log("info", "🕒 时区已设置:", config.fingerprint.timezone);
      }

      // 模拟 WebGL 指纹（简单伪造 vendor/renderer 信息）
      if (config.fingerprint.webglVendor) {
        ses.webRequest.onBeforeRequest(
          { urls: ["<all_urls>"] },
          (details, callback) => {
            if (
              details.resourceType === "xhr" ||
              details.resourceType === "fetch"
            ) {
              ses.setPermissionRequestHandler(
                (webContents, permission, callback) => {
                  if (permission === "webgl") {
                    webContents.session.webglContextAttributes = {
                      vendor: config.fingerprint.webglVendor,
                      renderer:
                        config.fingerprint.webglRenderer || "WebKit WebGL",
                    };
                  }
                  callback(true);
                }
              );
            }
            callback({});
          }
        );
        log(
          "info",
          "🎨 WebGL 指纹已设置:",
          `${config.fingerprint.webglVendor}/${
            config.fingerprint.webglRenderer || "WebKit WebGL"
          }`
        );
      }
    }

    // 🔥 步骤4：代理配置 - 关键修复点
    log("info", "代理配置:", config);
    if (config.proxy?.enabled) {
      log("info", "🌐 开始配置代理...");

      // 先清理可能存在的旧代理服务器
      const existingProxy = proxyServers.get(containerId);
      if (existingProxy?.server?.close) {
        log("info", "🗑️ 清理旧代理服务器");
        await existingProxy.server.close();
        proxyServers.delete(containerId);
      }

      let proxyRules;
      let proxyServer = null;

      try {
        if (config.proxy.username && config.proxy.password) {
          // 需要认证的代理
          log("info", "🔐 配置认证代理");
          const proxyUrl = `${config.proxy.type}://${config.proxy.username}:${config.proxy.password}@${config.proxy.host}:${config.proxy.port}`;
          if (
            config.proxy.type === "socks5" ||
            config.proxy.type === "socks5h"
          ) {
            log("info", `🧦 创建SOCKS5代理: ${proxyUrl}`);
            proxyServer = await sockProxyRules(proxyUrl);
            proxyRules = proxyServer.url;
            proxyServers.set(containerId, {
              server: proxyServer.url,
              type: "socks5",
              config: config.proxy,
            });
          } else if (
            config.proxy.type === "http" ||
            config.proxy.type === "https"
          ) {
            // HTTP/HTTPS: 不拼接 user:pass，改用 login 事件
            log("info", `🌐 创建HTTP代理: ${proxyUrl}`);
            proxyServer = await httpProxyRules(proxyUrl);
            proxyRules = proxyServer.url;
            proxyServers.set(containerId, {
              server: proxyServer.url,
              type: "http",
              config: config.proxy,
            });
          } else {
            proxyRules = `${config.proxy.type}://${config.proxy.host}:${config.proxy.port}`;
            proxyServers.set(containerId, {
              server: proxyRules,
              type: "http",
              config: config.proxy,
            });
          }
        } else {
          proxyRules = `${config.proxy.type}://${config.proxy.host}:${config.proxy.port}`;
          proxyServers.set(containerId, {
            server: proxyRules,
            type: "http",
            config: config.proxy,
          });
        }

        log("info", `📋 应用代理规则: `);
        log("info", JSON.stringify(proxyRules, null, 2));

        // 🔥 关键修复：强制设置代理并等待生效
        await ses.setProxy({
          proxyRules: proxyRules,
          proxyBypassRules: "",
          pacScript: "",
          mode: "fixed_servers",
        });

        // 🔥 立即验证代理设置
        log("info", "🔍 验证代理设置...");
        const testUrls = ["https://httpbin.org/ip"];
        let proxyWorking = false;

        for (const testUrl of testUrls) {
          try {
            const resolved = await ses.resolveProxy(testUrl);
            log("info", `📡 代理解析 ${testUrl}: ${resolved}`);

            if (resolved.includes("PROXY") || resolved.includes("SOCKS")) {
              proxyWorking = true;
              log("info", "✅ 代理验证成功！");
              break;
            }
          } catch (error) {
            log("warn", `⚠️ 代理验证失败 ${testUrl}:`, error.message);
          }
        }

        if (!proxyWorking) {
          throw new Error("代理设置验证失败 - 代理未生效");
        }
      } catch (proxyError) {
        log("error", "❌ 代理配置失败:", proxyError.message);

        // 清理失败的代理服务器
        if (proxyServer?.close) {
          await proxyServer.close();
        }
        proxyServers.delete(containerId);

        throw new Error(`代理配置失败: ${proxyError.message}`);
      }
    } else {
      log("info", "🔧 未启用代理，使用系统网络设置");
    }

    // 🔥 步骤5：设置网络监控（仅在调试模式下详细记录）
    if (config.proxy?.enabled) {
      ses.webRequest.onBeforeRequest(
        { urls: ["<all_urls>"] },
        (details, callback) => {
          if (
            details.url.includes("httpbin") ||
            details.url.includes("ipify")
          ) {
            log(
              "debug",
              `🌐 [${containerId}] 代理请求: ${details.method} ${details.url}`
            );
          }
          callback({});
        }
      );

      ses.webRequest.onCompleted({ urls: ["<all_urls>"] }, (details) => {
        if (
          (details.url.includes("httpbin") || details.url.includes("ipify")) &&
          details.statusCode >= 400
        ) {
          log(
            "warn",
            `⚠️ [${containerId}] 请求错误: ${details.statusCode} ${details.url}`
          );
        }
      });

      ses.webRequest.onErrorOccurred({ urls: ["<all_urls>"] }, (details) => {
        if (details.url.includes("httpbin") || details.url.includes("ipify")) {
          log(
            "error",
            `❌ [${containerId}] 网络错误: ${details.error} ${details.url}`
          );
        }
      });
    }

    log("info", `✅ 容器会话创建成功: ${partition}`);
    return ses;
  } catch (error) {
    log("error", `❌ 容器会话创建失败: ${error.message}`);
    throw error;
  }
}

// 🔥 修复：代理状态检查函数
async function checkProxyStatus(containerId) {
  try {
    log("info", `🔍 检查容器代理状态: ${containerId}`);
    const partition = `persist:container_${containerId}`;
    const ses = session.fromPartition(partition);

    const testUrls = ["https://httpbin.org/ip"];

    const results = [];

    for (const url of testUrls) {
      try {
        const resolved = await ses.resolveProxy(url);
        const isProxy =
          resolved.includes("PROXY") || resolved.includes("SOCKS");
        results.push({
          url,
          resolved,
          isProxy,
        });
        log(
          "info",
          `📡 代理状态 ${url}: ${resolved} (${isProxy ? "使用代理" : "直连"})`
        );
      } catch (error) {
        results.push({
          url,
          error: error.message,
          isProxy: false,
        });
        log("error", `❌ 检查失败 ${url}:`, error.message);
      }
    }

    return { success: true, results };
  } catch (error) {
    log("error", "代理状态检查失败:", error.message);
    return { success: false, error: error.message };
  }
}

// 🔥 修复：强制重置代理函数
async function resetContainerProxy(containerId, config) {
  try {
    log("info", `🔄 重置容器代理: ${containerId}`);

    // 清理旧的代理服务器
    const existingProxy = proxyServers.get(containerId);
    if (existingProxy?.server?.close) {
      log("info", "🗑️ 关闭旧代理服务器");
      await existingProxy.server.close();
      proxyServers.delete(containerId);
    }

    // 重新创建容器会话
    const ses = await createContainerSession(containerId, config);

    return { success: true, message: "代理重置完成" };
  } catch (error) {
    log("error", `重置代理失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 全局导出函数
global.createContainerSession = createContainerSession;
global.checkProxyStatus = checkProxyStatus;
global.resetContainerProxy = resetContainerProxy;

// ===========================================
// 应用事件处理
// ===========================================
app
  .whenReady()
  .then(async () => {
    initializeLogging();
    log("info", "应用准备就绪");

    const userDataPath = app.getPath("userData");

    try {
      settingsManager.init(userDataPath);
      const savedSettings = settingsManager.loadSettingsFromDisk();
      log("info", "设置已加载");
    } catch (error) {
      log("error", "设置管理器初始化失败:", error.message);
    }
    protocol.registerFileProtocol("file", (request, callback) => {
      const pathname = decodeURI(request.url.replace("file:///", ""));
      callback(pathname);
    });

    const savedSettings = settingsManager.loadSettingsFromDisk();
    if (savedSettings.security?.appLock && savedSettings.security?.password) {
      createLockWindow();
    } else {
      createWindow();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch((error) => {
    log("error", "应用准备失败:", error.message);
  });

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", async () => {
  log("info", "清理代理服务器");
  for (const [containerId, proxyData] of proxyServers) {
    if (proxyData?.server?.close) {
      await proxyData.server.close();
    }
  }
  proxyServers.clear();
});

// ===========================================
// IPC 处理器
// ===========================================

// 代理相关IPC
ipcMain.handle("check-proxy-status", async (event, containerId) => {
  return await checkProxyStatus(containerId);
});

ipcMain.handle("reset-container-proxy", async (event, containerId, config) => {
  return await resetContainerProxy(containerId, config);
});

// 基础窗口控制
ipcMain.handle("minimize-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
    return { success: true };
  }
  return { success: false };
});
ipcMain.handle("window-toggle-fullscreen", () => {
  if (mainWindow) {
    const isFullScreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullScreen);
    return { success: true, isFullScreen: !isFullScreen };
  }
  return { success: false };
});
ipcMain.handle("close-window", () => {
  if (mainWindow) {
    app.quit();
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle("toggle-devtools", () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
    return { success: true };
  }
  return { success: false };
});

// 日志管理
ipcMain.handle("get-main-log", () => {
  try {
    if (logFile && fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, "utf8");
      return { success: true, logs: logContent };
    }
    return { success: false, error: "日志文件不存在" };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("clear-main-log", () => {
  try {
    if (logFile) {
      fs.writeFileSync(logFile, "");
      log("info", "日志已清空");
      return { success: true };
    }
    return { success: false, error: "日志文件未初始化" };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on("renderer-log", (event, logData) => {
  const { level, message, source, stack } = logData;
  const prefix = source ? `[${source.toUpperCase()}]` : "[RENDERER]";

  if (stack && level === "error") {
    log(level, `${prefix} ${message}`);
    log(level, `${prefix} 堆栈: ${stack}`);
  } else {
    log(level, `${prefix} ${message}`);
  }
});
ipcMain.handle("read-script-file", async (event, relativePath) => {
  try {
    const scriptPath = path.join(app.getAppPath(), relativePath);
    const content = fs.readFileSync(scriptPath, "utf-8");
    return { success: true, content };
  } catch (error) {
    console.error("读取脚本文件失败:", error);
    return { success: false, error: error.message };
  }
});
// 🔥 修复：容器管理IPC
ipcMain.handle(
  "create-container-session",
  async (event, containerId, config) => {
    try {
      log("info", `📨 IPC: 创建容器会话: ${containerId}`);

      const ses = await createContainerSession(containerId, config);

      log("info", "✅ IPC: 容器会话创建成功");
      return {
        success: true,
        partition: `persist:container_${containerId}`,
      };
    } catch (error) {
      log("error", "❌ IPC: 容器创建失败:", error.message);
      return { success: false, error: error.message };
    }
  }
);

// 🔥 修复：代理测试IPC
ipcMain.handle("test-proxy", async (event, proxyConfig) => {
  try {
    log("info", "🧪 IPC: 测试代理配置");

    const testPartition = "test-proxy-" + Date.now();
    const testSession = session.fromPartition(testPartition);
    let proxyRules;
    let testProxyServer = null;

    // 使用相同的代理设置逻辑
    if (proxyConfig.username && proxyConfig.password) {
      if (proxyConfig.type === "socks5") {
        const proxyUrl = `socks5://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
        testProxyServer = await sockProxyRules(proxyUrl);
        proxyRules = testProxyServer;
      } else {
        const proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
        testProxyServer = await httpProxyRules(proxyUrl);
        proxyRules = testProxyServer.url;
      }
    } else {
      if (proxyConfig.type === "socks5") {
        proxyRules = `socks5://${proxyConfig.host}:${proxyConfig.port}`;
      } else {
        proxyRules = `http://${proxyConfig.host}:${proxyConfig.port}`;
      }
    }

    await testSession.setProxy({
      proxyRules,
      proxyBypassRules: "",
      pacScript: "",
      mode: "fixed_servers",
    });

    // 证书处理
    testSession.setCertificateVerifyProc((request, callback) => {
      callback(0); // 测试时接受所有证书
    });

    const testWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        session: testSession,
        webSecurity: false,
      },
    });

    const testResult = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: "测试超时" });
      }, 15000);

      testWindow.webContents.once("did-finish-load", async () => {
        clearTimeout(timeout);

        try {
          const pageContent = await testWindow.webContents.executeJavaScript(`
            document.body.innerText
          `);

          resolve({
            success: true,
            message: "代理连接正常",
            pageContent: pageContent,
          });
        } catch (jsError) {
          resolve({
            success: true,
            message: "代理连接正常（无法获取页面内容）",
          });
        }
      });

      testWindow.webContents.once(
        "did-fail-load",
        (event, errorCode, errorDescription) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            error: `加载失败: ${errorDescription} (错误代码: ${errorCode})`,
          });
        }
      );

      const testUrls = ["https://httpbin.org/ip"];

      testWindow.loadURL(testUrls[0]).catch((err) => {
        clearTimeout(timeout);
        resolve({ success: false, error: err.message });
      });
    });

    testWindow.destroy();

    // 清理测试代理服务器
    if (testProxyServer && testProxyServer.close) {
      await testProxyServer.close();
    }

    return testResult;
  } catch (error) {
    log("error", "IPC: 代理测试失败:", error.message);
    return { success: false, error: error.message };
  }
});

// 插件加载
ipcMain.handle("load-plugin", async (event, config) => {
  log("info", `加载插件，平台: ${config.platformId}`);

  if (config.platformId == "line") {
    const current_session = session.fromPartition(
      `persist:container_${config.id}`
    );
    try {
      await current_session.clearStorageData();
      const extension = await current_session.loadExtension(extensionPath);
      return extension;
    } catch (error) {
      log("error", "插件加载失败:", error.message);
      return false;
    }
  }
  return true;
});

ipcMain.handle("get-preload-path", () => {
  return { preloadPath, linepreloadPath };
});

// 翻译服务
ipcMain.handle("translate-text", async (event, text, channel, targetLang) => {
  try {
    log("info", `翻译请求，目标语言: ${targetLang}, 渠道: ${channel}`);
    if (channel === "google") {
      const translatedText = await translationService.googleTranslate(
        text,
        targetLang
      );
      return { success: true, translatedText };
    } else if (channel === "baidu") {
      const translatedText = await translationService.baiduTranslate(
        text,
        targetLang
      );
      return { success: true, translatedText };
    } else if (channel === "youdao") {
      const translatedText = await translationService.youdaoTranslate(
        text,
        targetLang
      );
      return { success: true, translatedText };
    } else return { success: true, translatedText: "翻译提供商暂未支持" };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
// 知识库问答
ipcMain.handle(
  "send-knowledge-base-message",
  async (event, message, knowledge) => {
    try {
      log("info", `知识库问答请求，消息: ${message}`);
      const response = await fetch(
        "http://95.40.47.163:8000/api/v1/kb/rag/ask",
        {
          method: "POST",
          headers: {
            "X-User-ID": knowledge.user_id,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: message,
            search_params: {
              top_k: knowledge.topK,
              similarity_threshold: knowledge.similarityThreshold,
            },
            knowledge_base_id: knowledge.selectedKnowledgeBase,
            stream: false,
            endpoint_name: "siliconflow_DP_V3",
          }),
        }
      );
      const rawText = await response.text();

      // ✅ 打印原文
      log("info", `响应原文: ${rawText}`);

      // 检查 HTTP 状态
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        throw new Error("解析 JSON 失败: " + err.message);
      }

      if (!data.answer) {
        throw new Error("接口返回不包含 answer 字段: " + JSON.stringify(data));
      }

      console.log("✅ 响应数据:", data);
      return data.answer;
    } catch (error) {
      console.error("❌ 错误:", error.message);
      return { success: false, error: error.message };
    }
  }
);

// 文件操作
ipcMain.handle("save-file", async (event, data, filename) => {
  try {
    const { dialog } = require("electron");
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data);
      log("info", `文件已保存: ${result.filePath}`);
      return { success: true, filePath: result.filePath };
    }
    return { success: false, error: "用户取消" };
  } catch (error) {
    log("error", "保存文件失败:", error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-file", async (event) => {
  try {
    const { dialog } = require("electron");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], "utf8");
      log("info", `文件已加载: ${result.filePaths[0]}`);
      return { success: true, data };
    }
    return { success: false, error: "用户取消" };
  } catch (error) {
    log("error", "加载文件失败:", error.message);
    return { success: false, error: error.message };
  }
});

// 系统通知
ipcMain.handle("show-notification", (event, options) => {
  const { Notification } = require("electron");

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: options.title || "Multi Social Platform",
      body: options.body || "",
      icon: options.icon || path.join(__dirname, "assets/icon.png"),
    });

    notification.show();

    if (options.onclick) {
      notification.on("click", () => {
        mainWindow?.focus();
      });
    }

    log("info", "通知已显示");
    return { success: true };
  }

  log("warn", "系统不支持通知");
  return { success: false, error: "系统不支持通知" };
});

ipcMain.handle("take-screenshot", async (event, containerId) => {
  try {
    log("info", `为容器 ${containerId} 截图`);
    return { success: true, imagePath: "/path/to/screenshot.png" };
  } catch (error) {
    log("error", "截图失败:", error.message);
    return { success: false, error: error.message };
  }
});

// 设置管理
ipcMain.handle("load-settings", () => {
  return settingsManager.loadSettingsFromDisk();
});

ipcMain.handle("save-settings", async (event, settings) => {
  return settingsManager.saveSettingsToDisk(settings);
});

ipcMain.handle("verify-password", async (event, inputPassword) => {
  try {
    const settings = settingsManager.loadSettingsFromDisk();
    const savedPassword = settings.security?.password || "";
    const passwordEncrypted = settings.security?.passwordEncrypted;

    let realPassword = savedPassword;
    if (passwordEncrypted) {
      realPassword = settingsManager.decrypt(savedPassword);
    }

    if (inputPassword === realPassword) {
      if (!mainWindow) {
        createWindow();
      } else {
        mainWindow.show();
      }
      lockWindow?.destroy();
      return true;
    }
    return false;
  } catch (err) {
    log("error", "密码验证失败:", err.message);
    return false;
  }
});

ipcMain.on("app-lock", () => {
  if (!lockWindow) {
    createLockWindow();
    mainWindow?.hide();
  }
});

// 🔥 修复：容器数据管理 - 重建时恢复代理设置
const containerStates = new Map();

function getContainerDataPath(containerId) {
  return path.join(app.getPath("userData"), "containers", containerId);
}

ipcMain.handle("destroy-container-webview", async (event, containerId) => {
  try {
    log("info", `💤 销毁容器: ${containerId}`);

    const partition = `persist:container_${containerId}`;
    const ses = session.fromPartition(partition);
    const containerDataPath = getContainerDataPath(containerId);

    await fsp.mkdir(containerDataPath, { recursive: true });

    try {
      const cookies = await ses.cookies.get({});
      await fsp.writeFile(
        path.join(containerDataPath, "cookies.json"),
        JSON.stringify(cookies, null, 2)
      );
    } catch (error) {
      log("warn", "保存cookies失败:", error.message);
    }

    const { webContents } = require("electron");
    const allWebContents = webContents.getAllWebContents();
    const containerWebContents = allWebContents.find(
      (wc) => wc.session.partition === partition && !wc.isDestroyed()
    );

    if (containerWebContents) {
      try {
        const localStorage = await containerWebContents.executeJavaScript(`
          (() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              data[key] = localStorage.getItem(key);
            }
            return data;
          })()
        `);

        const sessionStorage = await containerWebContents.executeJavaScript(`
          (() => {
            const data = {};
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              data[key] = sessionStorage.getItem(key);
            }
            return data;
          })()
        `);

        const pageState = await containerWebContents.executeJavaScript(`
          ({
            url: window.location.href,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            title: document.title
          })
        `);

        await fsp.writeFile(
          path.join(containerDataPath, "localStorage.json"),
          JSON.stringify(localStorage, null, 2)
        );

        await fsp.writeFile(
          path.join(containerDataPath, "sessionStorage.json"),
          JSON.stringify(sessionStorage, null, 2)
        );

        await fsp.writeFile(
          path.join(containerDataPath, "pageState.json"),
          JSON.stringify(pageState, null, 2)
        );

        log("info", `容器数据已保存: ${containerId}`);
      } catch (jsError) {
        log("warn", "保存浏览器存储失败:", jsError.message);
      }
    }

    // 🔥 保存代理配置
    const proxyData = proxyServers.get(containerId);
    if (proxyData) {
      await fsp.writeFile(
        path.join(containerDataPath, "proxyConfig.json"),
        JSON.stringify(proxyData.config, null, 2)
      );

      if (proxyData.server?.close) {
        await proxyData.server.close();
      }
      proxyServers.delete(containerId);
      log("info", `代理配置已保存并清理: ${containerId}`);
    }

    containerStates.set(containerId, {
      partition,
      destroyed: true,
      destroyTime: Date.now(),
    });

    return { success: true, dataPath: containerDataPath };
  } catch (error) {
    log("error", `容器销毁失败: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// 🔥 修复：重建容器时恢复代理设置
ipcMain.handle(
  "rebuild-container-webview",
  async (event, containerId, config) => {
    try {
      log("info", `🚀 重建容器: ${containerId}`);

      const containerDataPath = getContainerDataPath(containerId);
      const partition = `persist:container_${containerId}`;

      let savedData = {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        pageState: { url: config.url || "about:blank" },
      };

      // 🔥 恢复代理配置
      let savedProxyConfig = null;
      try {
        const proxyConfigPath = path.join(
          containerDataPath,
          "proxyConfig.json"
        );
        if (
          await fsp
            .access(proxyConfigPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const proxyConfigData = await fsp.readFile(proxyConfigPath, "utf8");
          savedProxyConfig = JSON.parse(proxyConfigData);
          log(
            "info",
            `📡 发现保存的代理配置: ${savedProxyConfig.host}:${savedProxyConfig.port}`
          );

          // 将保存的代理配置合并到当前配置中
          if (!config.proxy) {
            config.proxy = savedProxyConfig;
            config.proxy.enabled = true;
            log("info", "🔄 恢复代理配置到容器");
          }
        }
      } catch (readProxyError) {
        log("warn", "读取代理配置失败:", readProxyError.message);
      }

      try {
        const cookiesPath = path.join(containerDataPath, "cookies.json");
        if (
          await fsp
            .access(cookiesPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const cookiesData = await fsp.readFile(cookiesPath, "utf8");
          savedData.cookies = JSON.parse(cookiesData);
        }

        const localStoragePath = path.join(
          containerDataPath,
          "localStorage.json"
        );
        if (
          await fsp
            .access(localStoragePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const localStorageData = await fsp.readFile(localStoragePath, "utf8");
          savedData.localStorage = JSON.parse(localStorageData);
        }

        const sessionStoragePath = path.join(
          containerDataPath,
          "sessionStorage.json"
        );
        if (
          await fsp
            .access(sessionStoragePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const sessionStorageData = await fsp.readFile(
            sessionStoragePath,
            "utf8"
          );
          savedData.sessionStorage = JSON.parse(sessionStorageData);
        }

        const pageStatePath = path.join(containerDataPath, "pageState.json");
        if (
          await fsp
            .access(pageStatePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const pageStateData = await fsp.readFile(pageStatePath, "utf8");
          savedData.pageState = JSON.parse(pageStateData);
        }
      } catch (readError) {
        log("warn", "读取保存数据失败:", readError.message);
      }

      // 🔥 重新创建容器会话（包括代理设置）
      const ses = await createContainerSession(containerId, config);

      // 🔥 恢复cookies - 优化：智能 URL 构造，避免 domain 无效
      for (const cookie of savedData.cookies) {
        try {
          // 🔥 新增：验证和修复 domain
          let effectiveDomain = cookie.domain;
          let effectiveUrl;
          if (!effectiveDomain || effectiveDomain === "") {
            console.warn(
              `[CookieRestore] Skipping empty domain for cookie: ${cookie.name}`
            );
            continue; // 跳过无效 domain
          }
          if (effectiveDomain.startsWith(".")) {
            // 子域：构造 URL 如 https://web + domain（WhatsApp 适配）
            effectiveUrl = `https://web${effectiveDomain}`; // e.g., https://web.whatsapp.com
          } else {
            // 标准 domain：直接用
            effectiveUrl = `https://${effectiveDomain}`;
          }

          // 🔥 额外防护：fallback 到容器 URL（如果有效 URL 仍无效）
          if (!effectiveUrl || effectiveUrl.includes("://.")) {
            effectiveUrl = config.url || "https://web.whatsapp.com"; // 容器 URL 作为默认
            console.warn(
              `[CookieRestore] Using fallback URL for ${cookie.name}: ${effectiveUrl}`
            );
          }

          await ses.cookies.set({
            url: effectiveUrl,
            name: cookie.name,
            value: cookie.value,
            domain: effectiveDomain,
            path: cookie.path || "/",
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            expirationDate: cookie.expirationDate || undefined,
          });

          console.log(
            `[CookieRestore] Restored: ${cookie.name} for domain ${effectiveDomain}`
          ); // 调试：成功日志
        } catch (cookieError) {
          log("warn", `恢复cookie失败 ${cookie.name}:`, cookieError.message);
        }
      }

      containerStates.set(containerId, {
        partition,
        destroyed: false,
        rebuildTime: Date.now(),
        savedData,
      });

      log("info", `✅ 容器重建完成: ${containerId}`);
      return {
        success: true,
        partition,
        savedData: {
          cookiesCount: savedData.cookies.length,
          localStorageKeys: Object.keys(savedData.localStorage).length,
          sessionStorageKeys: Object.keys(savedData.sessionStorage).length,
          lastUrl: savedData.pageState.url,
          proxyRestored: savedProxyConfig ? true : false,
        },
      };
    } catch (error) {
      log("error", `容器重建失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("get-container-restore-data", async (event, containerId) => {
  const containerState = containerStates.get(containerId);
  if (containerState && containerState.savedData) {
    return {
      success: true,
      data: containerState.savedData,
    };
  }
  return { success: false, error: "没有找到恢复数据" };
});

ipcMain.handle("cleanup-container-data", async (event, containerId) => {
  try {
    const containerDataPath = getContainerDataPath(containerId);
    await fsp.rm(containerDataPath, { recursive: true, force: true });
    containerStates.delete(containerId);

    const proxyData = proxyServers.get(containerId);
    if (proxyData?.server?.close) {
      await proxyData.server.close();
      proxyServers.delete(containerId);
    }

    log("info", `容器数据已清理: ${containerId}`);
    return { success: true };
  } catch (error) {
    log("error", "清理容器数据失败:", error.message);
    return { success: false, error: error.message };
  }
});

log("info", "主进程脚本加载完成");
