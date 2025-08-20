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
// 简化的日志系统 - 调试版本
// ===========================================

let logFile = null;
let logInitialized = false;

// 简单的控制台日志，确保能看到输出
function simpleLog(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // 强制输出到控制台
  process.stdout.write(logMessage + '\n');
  
  // 如果有额外参数，也输出
  if (args.length > 0) {
    process.stdout.write(`    Args: ${JSON.stringify(args)}\n`);
  }
}

// 初始化日志系统
function initializeLogging() {
  try {
    simpleLog('info', '=== 开始初始化日志系统 ===');
    
    // 获取用户数据目录
    const userDataPath = app.getPath("userData");
    simpleLog('info', `用户数据目录: ${userDataPath}`);
    
    // 确保目录存在
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
      simpleLog('info', '创建用户数据目录');
    }
    
    // 设置日志文件路径
    logFile = path.join(userDataPath, "main-process.log");
    simpleLog('info', `日志文件路径: ${logFile}`);
    
    // 测试文件写入
    const testMessage = `[${new Date().toISOString()}] 日志系统初始化测试\n`;
    fs.writeFileSync(logFile, testMessage);
    simpleLog('info', '日志文件写入测试成功');
    
    logInitialized = true;
    simpleLog('info', '=== 日志系统初始化完成 ===');
    
  } catch (error) {
    simpleLog('error', '日志系统初始化失败:', error.message);
    simpleLog('error', '错误堆栈:', error.stack);
  }
}

// 增强的日志函数
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  
  // 构建日志消息
  let logMessage = `[${timestamp}] [MAIN-${level.toUpperCase()}] ${message}`;
  if (args.length > 0) {
    const argsStr = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logMessage += ` ${argsStr}`;
  }
  
  // 输出到控制台
  process.stdout.write(logMessage + '\n');
  
  // 写入文件
  if (logInitialized && logFile) {
    try {
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      process.stdout.write(`[ERROR] 写入日志文件失败: ${error.message}\n`);
    }
  }
}

// ===========================================
// 应用启动前的基础设置
// ===========================================

// 在app ready之前进行基础日志
simpleLog('info', '=== Electron 主进程启动 ===');
simpleLog('info', `Node.js 版本: ${process.version}`);
simpleLog('info', `Electron 版本: ${process.versions.electron}`);
simpleLog('info', `平台: ${process.platform}`);
simpleLog('info', `架构: ${process.arch}`);

// 全局异常处理
process.on("uncaughtException", (err) => {
  simpleLog('error', '未捕获的异常:', err.message);
  simpleLog('error', '堆栈:', err.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  simpleLog('error', '未处理的Promise拒绝:', reason);
  simpleLog('error', 'Promise:', promise);
});

// ===========================================
// 其他模块导入
// ===========================================

const { notificationManager } = require("./NotificationManager");
const translationService = require("./services/translationService.js");
require("@electron/remote/main").initialize();
const settingsManager = require("./services/settingsManager.cjs");

const isDev = process.env.NODE_ENV === "development";
simpleLog('info', `开发模式: ${isDev}`);

const preloadPath = isDev
  ? path.join(__dirname, "../public/preload.js")
  : path.join(__dirname, "preload.js");
const linepreloadPath = isDev
  ? path.join(__dirname, "../public/fillChromeAPI.js")
  : path.join(__dirname, "fillChromeAPI.js");

simpleLog('info', `预加载脚本路径: ${preloadPath}`);

// ===========================================
// 窗口相关
// ===========================================

let mainWindow = null;
let lockWindow = null;
let extensionPath = "";

function createLockWindow() {
  log("info", "创建锁定窗口...");
  
  try {
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
      log("info", "锁定窗口已关闭");
      lockWindow = null;
    });
    
    log("info", "锁定窗口创建成功");
  } catch (error) {
    log("error", "创建锁定窗口失败:", error.message);
  }
}

function createWindow() {
  log("info", "开始创建主窗口...");

  try {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      show: false,
      frame: false,
      
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: false,
        webSecurity: false,
        allowRunningInsecureContent: true,
        experimentalFeatures: true,
        webviewTag: true,
        sandbox: false,
        preload: preloadPath,
        partition: "persist:my-session",
      },
    });
    
    log("info", "主窗口对象创建成功");
    
    require("@electron/remote/main").enable(mainWindow.webContents);
    log("info", "远程模块已启用");
    
    const startUrl = isDev
      ? "http://localhost:8080"
      : `file://${path.join(__dirname, "../dist/index.html")}`;

    log("info", `准备加载URL: ${startUrl}`);

    mainWindow
      .loadURL(startUrl)
      .then(() => {
        log("info", "主窗口URL加载成功");
      })
      .catch((error) => {
        log("error", "主窗口URL加载失败:", error.message);
        app.quit();
      });
    
    log("info", "初始化通知管理器...");
    notificationManager.initialize(mainWindow);
    
    mainWindow.once("ready-to-show", () => {
      log("info", "主窗口准备显示");
      mainWindow.show();

      if (isDev) {
        log("info", "开发模式，打开开发者工具");
        mainWindow.webContents.openDevTools();
      }
    });

    mainWindow.on("closed", () => {
      log("info", "主窗口已关闭");
      mainWindow = null;
    });

    // 处理外部链接
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      log("info", `打开外部链接: ${url}`);
      require("electron").shell.openExternal(url);
      return { action: "deny" };
    });

    // 监听渲染进程事件
    mainWindow.webContents.on("crashed", (event) => {
      log("error", "渲染进程崩溃");
    });

    mainWindow.webContents.on("unresponsive", () => {
      log("warn", "渲染进程无响应");
    });

    mainWindow.webContents.on("responsive", () => {
      log("info", "渲染进程恢复响应");
    });
    
    log("info", "主窗口设置完成");
    
  } catch (error) {
    log("error", "创建主窗口失败:", error.message);
    log("error", "错误堆栈:", error.stack);
  }
}

// ===========================================
// 会话设置
// ===========================================

function setupSessions() {
  log("info", "开始设置会话...");

  const createContainerSession = async (containerId, config = {}) => {
    log("info", `为容器创建会话: ${containerId}`);
    
    extensionPath = path.join(__dirname, "extensions", "line-extension");
    const partition = `persist:container_${containerId}`;
    const ses = session.fromPartition(partition);
    
    log("info", `配置参数: ${JSON.stringify(config)}`);

    // 设置用户代理
    if (config.fingerprint && config.fingerprint.userAgent) {
      log("info", `设置用户代理: ${config.fingerprint.userAgent}`);
      ses.setUserAgent(config.fingerprint.userAgent);
    }

    // 设置代理
    if (config.proxy && config.proxy.enabled) {
      const proxyConfig = {
        proxyRules: `${config.proxy.type}://${config.proxy.host}:${config.proxy.port}`,
      };

      log("info", `设置代理: ${proxyConfig.proxyRules}`);

      try {
        if (config.proxy.username && config.proxy.password) {
          await ses.setProxy(proxyConfig);
          log("info", "代理设置成功，配置认证");
          
          ses.on("login", (event, request, authInfo, callback) => {
            log("info", "代理需要认证");
            event.preventDefault();
            callback(config.proxy.username, config.proxy.password);
          });
        } else {
          await ses.setProxy(proxyConfig);
          log("info", "代理设置成功");
        }
      } catch (error) {
        log("error", "代理设置失败:", error.message);
      }
    }

    // 设置请求头
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const headers = { ...details.requestHeaders };

      if (config.fingerprint) {
        if (config.fingerprint.language) {
          headers["Accept-Language"] = config.fingerprint.language.join(",");
          log("info", `设置Accept-Language: ${headers["Accept-Language"]}`);
        }
      }

      callback({ requestHeaders: headers });
    });

    log("info", `容器会话创建成功: ${partition}`);
    return ses;
  };

  global.createContainerSession = createContainerSession;
  log("info", "会话设置完成");
}

// ===========================================
// 应用事件处理
// ===========================================

app
  .whenReady()
  .then(async () => {
    // 在app ready后立即初始化日志系统
    initializeLogging();
    
    log("info", "应用已准备就绪，开始初始化...");
    
    const userDataPath = app.getPath("userData");
    log("info", `用户数据目录: ${userDataPath}`);

    // 初始化设置管理器
    log("info", "初始化设置管理器...");
    try {
      settingsManager.init(userDataPath);
      const savedSettings = settingsManager.loadSettingsFromDisk();
      log("info", "设置已从磁盘加载");
    } catch (error) {
      log("error", "设置管理器初始化失败:", error.message);
    }

    extensionPath = path.join(__dirname, "extensions", "line-extension");
    log("info", `扩展路径设置: ${extensionPath}`);
    
    // 注册插件加载IPC
    ipcMain.handle("load-plugin", async (event, config) => {
      log("info", `加载插件，平台: ${config.platformId}`);

      if (config.platformId == "line") {
        const current_session = session.fromPartition(
          `persist:container_${config.id}`
        );
        log("info", `为LINE平台加载插件: persist:container_${config.platformId}`);

        try {
          await current_session.clearStorageData();
          log("info", "存储数据已清除");
          
          const extension = await current_session.loadExtension(extensionPath);
          log("info", `扩展加载成功: ${extension.id}`);
          return extension;
        } catch (error) {
          log("error", "扩展加载失败:", error.message);
          return false;
        }
      } else {
        log("info", "当前容器不需要加载插件");
        return true;
      }
    });

    // 设置协议处理
    log("info", "注册文件协议...");
    protocol.registerFileProtocol("file", (request, callback) => {
      const pathname = decodeURI(request.url.replace("file:///", ""));
      callback(pathname);
    });

    // 设置会话
    setupSessions();
    
    // 根据设置决定创建哪个窗口
    const savedSettings = settingsManager.loadSettingsFromDisk();
    if (savedSettings.security?.appLock && savedSettings.security?.password) {
      log("info", "应用锁定已启用，创建锁定窗口");
      createLockWindow();
    } else {
      log("info", "应用锁定已禁用，创建主窗口");
      createWindow();
    }

    app.on("activate", () => {
      log("info", "应用被激活");
      if (BrowserWindow.getAllWindows().length === 0) {
        log("info", "没有窗口存在，创建新窗口");
        createWindow();
      }
    });
    
    log("info", "应用初始化完成！");
    
  })
  .catch((error) => {
    simpleLog('error', '应用准备失败:', error.message);
    simpleLog('error', '错误堆栈:', error.stack);
  });

app.on("window-all-closed", () => {
  log("info", "所有窗口已关闭");
  if (process.platform !== "darwin") {
    log("info", "退出应用");
    app.quit();
  }
});

// ===========================================
// 基础IPC处理
// ===========================================

ipcMain.handle("minimize-window", () => {
  log("info", "收到最小化窗口请求");
  if (mainWindow) {
    mainWindow.minimize();
    return { success: true };
  }
  return { success: false, error: "没有主窗口" };
});

ipcMain.handle("close-window", () => {
  log("info", "收到关闭窗口请求");
  if (mainWindow) {
    mainWindow.close();
    return { success: true };
  }
  return { success: false, error: "没有主窗口" };
});

ipcMain.handle("toggle-devtools", () => {
  log("info", "收到切换开发者工具请求");
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
      log("info", "开发者工具已关闭");
    } else {
      mainWindow.webContents.openDevTools();
      log("info", "开发者工具已打开");
    }
    return { success: true };
  }
  return { success: false, error: "没有主窗口" };
});

// 获取日志的IPC处理器
ipcMain.handle("get-main-log", () => {
  log("info", "收到获取主进程日志请求");
  try {
    if (logFile && fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, "utf8");
      const lineCount = logContent.split('\n').length;
      log("info", `返回了${lineCount}行日志`);
      return { success: true, logs: logContent };
    } else {
      log("warn", "日志文件不存在");
      return { success: false, error: "日志文件不存在" };
    }
  } catch (error) {
    log("error", "获取主进程日志失败:", error.message);
    return { success: false, error: error.message };
  }
});

// 清空日志的IPC处理器
ipcMain.handle("clear-main-log", () => {
  log("info", "收到清空主进程日志请求");
  try {
    if (logFile) {
      fs.writeFileSync(logFile, "");
      log("info", "用户请求清空日志文件");
      return { success: true };
    }
    return { success: false, error: "日志文件未初始化" };
  } catch (error) {
    log("error", "清空日志文件失败:", error.message);
    return { success: false, error: error.message };
  }
});

// 处理渲染进程日志
ipcMain.on("renderer-log", (event, logData) => {
  const { level, message, timestamp, source, stack } = logData;
  const prefix = source ? `[${source.toUpperCase()}]` : "[RENDERER]";

  if (stack && level === "error") {
    log(level, `${prefix} ${message}`);
    log(level, `${prefix} 堆栈: ${stack}`);
  } else {
    log(level, `${prefix} ${message}`);
  }
});

log("info", "主进程脚本加载完成");
// 容器管理相关IPC
ipcMain.handle("create-container-session", (event, containerId, config) => {
  try {
    log("info", `IPC: Creating session for container: ${containerId}`);
    const session = global.createContainerSession(containerId, config);
    const result = {
      success: true,
      partition: `persist:container_${containerId}`,
    };
    log("info", "IPC: Session created successfully");
    return result;
  } catch (error) {
    log("error", "IPC: Failed to create session:", error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("test-proxy", async (event, proxyConfig) => {
  try {
    log("info", "IPC: Testing proxy");
    const testSession = session.fromPartition("test");

    await testSession.setProxy({
      proxyRules: `${proxyConfig.type}://${proxyConfig.host}:${proxyConfig.port}`,
    });

    log("info", "IPC: Proxy test successful");
    return { success: true };
  } catch (error) {
    log("error", "IPC: Proxy test failed:", error.message);
    return { success: false, error: error.message };
  }
});

// 翻译服务相关IPC
ipcMain.handle("translate-text", async (event, text, targetLang) => {
  log("info", ` ${event}`);
  try {
    log("info", `IPC: Translating text to ${targetLang}`);
    const translatedText = await simulateTranslation(text, targetLang);
    return { success: true, translatedText };
  } catch (error) {
    log("error", "IPC: Translation failed:", error.message);
    return { success: false, error: error.message };
  }
});

// 模拟翻译函数
async function simulateTranslation(text, targetLang) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const langMap = {
    en: "English",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
    ja: "日本語",
    ko: "한국어",
  };
  out_text = translationService.googleTranslate(text, targetLang);
  return out_text;
}
// 截图相关IPC
ipcMain.handle("take-screenshot", async (event, containerId) => {
  try {
    log("info", `IPC: Taking screenshot for container: ${containerId}`);
    return { success: true, imagePath: "/path/to/screenshot.png" };
  } catch (error) {
    log("error", "IPC: Screenshot failed:", error.message);
    return { success: false, error: error.message };
  }
});

// 文件操作相关IPC
ipcMain.handle("save-file", async (event, data, filename) => {
  try {
    const { dialog } = require("electron");
    const fs = require("fs");

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, data);
      log("info", `File saved: ${result.filePath}`);
      return { success: true, filePath: result.filePath };
    }

    return { success: false, error: "User cancelled" };
  } catch (error) {
    log("error", "IPC: Save file failed:", error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-file", async (event) => {
  try {
    const { dialog } = require("electron");
    const fs = require("fs");

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "JSON Files", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], "utf8");
      log("info", `File loaded: ${result.filePaths[0]}`);
      return { success: true, data };
    }

    return { success: false, error: "User cancelled" };
  } catch (error) {
    log("error", "IPC: Load file failed:", error.message);
    return { success: false, error: error.message };
  }
});

// 系统通知相关IPC
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
      console.log("监听到点击事件");
      notification.on("click", () => {
        console.log("点击了通知");
        mainWindow.focus();
      });
    }

    log("info", "Notification shown");
    return { success: true };
  }

  log("warn", "Notifications not supported");
  return { success: false, error: "Notifications not supported" };
});




ipcMain.handle("get-preload-path", () => {
  // 返回 preload.js 的绝对路径字符串
  log("info", `Preload script path requested: ${preloadPath}`);
  return {
    preloadPath,
    linepreloadPath,
  };
});
// 存储容器状态
const containerStates = new Map();

// 获取容器数据存储路径
function getContainerDataPath(containerId) {
  const userDataPath = require("electron").app.getPath("userData");
  return path.join(userDataPath, "containers", containerId);
}

// 销毁容器webview并保存状态
ipcMain.handle("destroy-container-webview", async (event, containerId) => {
  try {
    log("info", `Destroying container webview: ${containerId}`);

    const partition = `persist:container_${containerId}`;
    const ses = session.fromPartition(partition);
    log("info", `程序在这里正常1: ${containerId}`);

    // 1. 保存session数据到文件系统
    const containerDataPath = getContainerDataPath(containerId);
    await fsp.mkdir(containerDataPath, { recursive: true });
    log("info", `程序在这里正常2: ${containerId}`);

    // 保存cookies
    const cookies = await ses.cookies.get({});
    await fsp.writeFile(
      path.join(containerDataPath, "cookies.json"),
      JSON.stringify(cookies, null, 2)
    );
    log("info", `程序在这里正常3: ${containerId}`);
    // 保存localStorage数据 (通过webContents获取)
    const { webContents } = require("electron");
    const allWebContents = webContents.getAllWebContents();
    log("info", `程序在这里正常4: ${containerId}`);

    const containerWebContents = allWebContents.find(
      (wc) => wc.session.partition === partition && !wc.isDestroyed()
    );
    log("info", `程序在这里正常: ${containerId}`);

    if (containerWebContents) {
      try {
        // 获取localStorage数据
        const localStorageData = await containerWebContents.executeJavaScript(`
          (() => {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              data[key] = localStorage.getItem(key);
            }
            return data;
          })()
        `);

        // 获取sessionStorage数据
        const sessionStorageData =
          await containerWebContents.executeJavaScript(`
          (() => {
            const data = {};
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              data[key] = sessionStorage.getItem(key);
            }
            return data;
          })()
        `);

        // 获取当前页面URL和滚动位置
        const pageState = await containerWebContents.executeJavaScript(`
          ({
            url: window.location.href,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            title: document.title
          })
        `);

        // 保存到文件
        await fsp.writeFile(
          path.join(containerDataPath, "localStorage.json"),
          JSON.stringify(localStorageData, null, 2)
        );

        await fsp.writeFile(
          path.join(containerDataPath, "sessionStorage.json"),
          JSON.stringify(sessionStorageData, null, 2)
        );

        await fsp.writeFile(
          path.join(containerDataPath, "pageState.json"),
          JSON.stringify(pageState, null, 2)
        );

        log("info", `Saved session data for container ${containerId}`);
      } catch (jsError) {
        log("warn", `Failed to save browser storage: ${jsError.message}`);
      }
    }

    // 2. 标记所有相关webContents为待销毁
    const webContentsToDestroy = allWebContents.filter(
      (wc) => wc.session.partition === partition && !wc.isDestroyed()
    );

    // 3. 不立即清理session，保留用于重建
    containerStates.set(containerId, {
      partition,
      destroyed: true,
      destroyTime: Date.now(),
    });

    log("info", `Container ${containerId} webview destroyed and data saved`);
    return {
      success: true,
      webContentsDestroyed: webContentsToDestroy.length,
      dataPath: containerDataPath,
    };
  } catch (error) {
    log(
      "error",
      `Failed to destroy container ${containerId}: ${error.message}`
    );
    return { success: false, error: error.message };
  }
});

// 重建容器webview并恢复状态
ipcMain.handle(
  "rebuild-container-webview",
  async (event, containerId, config) => {
    try {
      log("info", `Rebuilding container webview: ${containerId}`);

      const partition = `persist:container_${containerId}`;
      const containerDataPath = getContainerDataPath(containerId);

      // 1. 检查是否有保存的数据
      const cookiesPath = path.join(containerDataPath, "cookies.json");
      const localStoragePath = path.join(
        containerDataPath,
        "localStorage.json"
      );
      const sessionStoragePath = path.join(
        containerDataPath,
        "sessionStorage.json"
      );
      const pageStatePath = path.join(containerDataPath, "pageState.json");

      let savedData = {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
        pageState: { url: config.url || "about:blank" },
      };

      // 读取保存的数据
      try {
        if (
          await fsp
            .access(cookiesPath)
            .then(() => true)
            .catch(() => false)
        ) {
          const cookiesData = await fsp.readFile(cookiesPath, "utf8");
          savedData.cookies = JSON.parse(cookiesData);
        }

        if (
          await fsp
            .access(localStoragePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const localStorageData = await fsp.readFile(localStoragePath, "utf8");
          savedData.localStorage = JSON.parse(localStorageData);
        }

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

        if (
          await fsp
            .access(pageStatePath)
            .then(() => true)
            .catch(() => false)
        ) {
          const pageStateData = await fsp.readFile(pageStatePath, "utf8");
          savedData.pageState = JSON.parse(pageStateData);
        }

        log("info", `Loaded saved data for container ${containerId}`);
      } catch (readError) {
        log("warn", `Failed to read some saved data: ${readError.message}`);
      }

      // 2. 重新获取session并配置
      const ses = session.fromPartition(partition);
      log("info", `Creating session for container `);
      // console.log(`config的参数: ${JSON.stringify(config)}`)
      if (config.id == "line") {
        log("info", `Creating LINE extension session for: ${containerId}`);

        // 清除所有存储数据
        await ses.clearStorageData().then(() => {
          console.log("Storage data cleared");
        });
        console.log("extensionPath", extensionPath);
        ses.loadExtension(extensionPath);
        log("info", `LINE extension 加载完成: ${partition}`);
      }
      // 恢复cookies
      for (const cookie of savedData.cookies) {
        try {
          await ses.cookies.set({
            url: `https://${cookie.domain}`,
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            secure: cookie.secure,
            httpOnly: cookie.httpOnly,
            expirationDate: cookie.expirationDate,
          });
        } catch (cookieError) {
          log(
            "warn",
            `Failed to restore cookie ${cookie.name}: ${cookieError.message}`
          );
        }
      }

      // 重设用户代理
      if (config?.fingerprint?.userAgent) {
        ses.setUserAgent(config.fingerprint.userAgent);
        log("info", `UserAgent set: ${config.fingerprint.userAgent}`);
      }

      // 重设代理
      if (config?.proxy?.enabled) {
        const proxyRules = `${config.proxy.type}://${config.proxy.host}:${config.proxy.port}`;
        await ses.setProxy({ proxyRules });
        log("info", `Proxy set: ${proxyRules}`);

        if (config.proxy.username && config.proxy.password) {
          ses.on("login", (event, request, authInfo, callback) => {
            event.preventDefault();
            callback(config.proxy.username, config.proxy.password);
          });
          log("info", "Proxy auth set");
        }
      }

      // 3. 更新容器状态
      containerStates.set(containerId, {
        partition,
        destroyed: false,
        rebuildTime: Date.now(),
        savedData,
      });

      log("info", `Container ${containerId} webview rebuilt and configured`);
      return {
        success: true,
        partition,
        savedData: {
          cookiesCount: savedData.cookies.length,
          localStorageKeys: Object.keys(savedData.localStorage).length,
          sessionStorageKeys: Object.keys(savedData.sessionStorage).length,
          lastUrl: savedData.pageState.url,
        },
      };
    } catch (error) {
      log(
        "error",
        `Failed to rebuild container ${containerId}: ${error.message}`
      );
      return { success: false, error: error.message };
    }
  }
);

// 获取容器恢复数据
ipcMain.handle("get-container-restore-data", async (event, containerId) => {
  const containerState = containerStates.get(containerId);
  if (containerState && containerState.savedData) {
    return {
      success: true,
      data: containerState.savedData,
    };
  }
  return { success: false, error: "No restore data found" };
});

// 清理容器数据
ipcMain.handle("cleanup-container-data", async (event, containerId) => {
  try {
    const containerDataPath = getContainerDataPath(containerId);
    await fsp.rm(containerDataPath, { recursive: true, force: true });
    containerStates.delete(containerId);
    log("info", `Cleaned up data for container ${containerId}`);
    return { success: true };
  } catch (error) {
    log("error", `Failed to cleanup container data: ${error.message}`);
    return { success: false, error: error.message };
  }
});

ipcMain.on("app-lock", () => {
  if (!lockWindow) {
    createLockWindow();
    mainWindow.hide();
  }
});
ipcMain.handle('load-settings', () => {
  return settingsManager.loadSettingsFromDisk()
})
ipcMain.handle("save-settings", async (event, settings) => {
  const success = settingsManager.saveSettingsToDisk(settings);
  return success;
});

ipcMain.handle("verify-password", async (event, inputPassword) => {
  log('info',"[IPC] Verifying password...");
  console.log("[IPC] Verifying password...");
  try {
    const settings = settingsManager.loadSettingsFromDisk();
    const savedPassword = settings.security?.password || "";
    const passwordEncrypted = settings.security?.passwordEncrypted;

    let realPassword = savedPassword;

    // 如果启用了 passwordEncrypted，则进行解密
    if (passwordEncrypted) {
      realPassword = settingsManager.decrypt(savedPassword);
    }
    log("info", "Input password")
    log("info", inputPassword);
    log("info", "Real password")
    log("info", realPassword);
    
    if (inputPassword === realPassword) {
      

      if (!mainWindow) {
        createWindow(); // 确保主窗口存在
      } else {
        mainWindow.show();
      }
      lockWindow?.destroy();
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("[verify-password] Failed to verify password:", err);
    return false;
  }
});
// 全局异常处理
process.on("uncaughtException", (error) => {
  log("error", "Uncaught Exception:", error.message);
  log("error", "Stack trace:", error.stack);
});

process.on("unhandledRejection", (reason, promise) => {
  log("error", "Unhandled Rejection at:", promise);
  log("error", "Reason:", reason);
});
