<template>
  <div class="container-view">
    <!-- 容器工具栏 -->
    <div class="container-toolbar">
      <div class="toolbar-left">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>{{ container.platform.name }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ container.name }}</el-breadcrumb-item>
        </el-breadcrumb>

        <div class="status-indicator" :class="container.status">
          <el-icon><CircleCheck /></el-icon>
          {{ getStatusText(container.status) }}
        </div>
        <div style="margin: 0 5px; min-width: fit-content">
          <el-tooltip content="后退">
            <el-button
              :disabled="!canGoBack"
              @click="goBack"
              icon="ArrowLeft"
              circle
              size="small"
            />
          </el-tooltip>

          <el-tooltip content="前进">
            <el-button
              :disabled="!canGoForward"
              @click="goForward"
              icon="ArrowRight"
              circle
              size="small"
            />
          </el-tooltip>

          <el-tooltip content="刷新页面">
            <el-button
              @click="reload"
              icon="RefreshRight"
              circle
              size="small"
            />
          </el-tooltip>
        </div>
      </div>

      <div class="toolbar-right">
        <!-- 休眠/唤醒按钮 -->
        <el-tooltip :content="isSleeping ? '重建唤醒容器' : '销毁休眠容器'">
          <el-button
            v-if="!isSleeping"
            @click="sleepContainer"
            :icon="VideoPause"
            circle
            size="small"
            type="warning"
            :loading="isDestroying"
          />
          <el-button
            v-else
            @click="wakeContainer"
            :icon="VideoPlay"
            circle
            size="small"
            type="success"
            :loading="isRebuilding"
          />
        </el-tooltip>
        <el-tooltip content="代理配置验证">
          <el-button
            @click="proxyDiagnosticToolVisible = true"
            :icon="Connection"
            circle
            size="small"
            :disabled="isSleeping"
          />
        </el-tooltip>

        <el-tooltip content="刷新容器">
          <el-button
            @click="reloadContainer"
            :icon="Refresh"
            circle
            size="small"
            :disabled="isSleeping"
          />
        </el-tooltip>

        <el-tooltip content="开发者工具">
          <el-button
            @click="toggleDevTools"
            :icon="Monitor"
            circle
            size="small"
            :disabled="isSleeping"
          />
        </el-tooltip>

        <el-tooltip content="截图">
          <el-button
            @click="takeScreenshot"
            :icon="Camera"
            circle
            size="small"
            :disabled="isSleeping"
          />
        </el-tooltip>
        <el-tooltip content="工具侧边栏">
          <el-button
            @click="showSidebar = !showSidebar"
            :icon="showSidebar ? 'Close' : 'Menu'"
            circle
            size="small"
          />
        </el-tooltip>

        <el-tooltip content="设置">
          <el-button
            @click="showSettings = true"
            :icon="Setting"
            circle
            size="small"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container-content">
      <!-- 休眠状态覆盖层 -->
      <div v-if="isSleeping" class="sleep-overlay">
        <div class="sleep-content">
          <el-icon class="sleep-icon"><Delete /></el-icon>
          <h3>容器已销毁休眠</h3>
          <p class="sleep-info">
            进程已完全停止，零资源占用<br />
            登录状态和浏览数据已安全保存
          </p>
          <div class="sleep-stats" v-if="lastSleepData">
            <div class="stat-item">
              <span class="stat-label">已保存Cookies:</span>
              <span class="stat-value">{{
                lastSleepData.cookiesCount || 0
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">本地存储:</span>
              <span class="stat-value"
                >{{ lastSleepData.localStorageKeys || 0 }} 项</span
              >
            </div>
            <div class="stat-item">
              <span class="stat-label">会话存储:</span>
              <span class="stat-value"
                >{{ lastSleepData.sessionStorageKeys || 0 }} 项</span
              >
            </div>
          </div>
          <el-button
            @click="wakeContainer"
            type="primary"
            size="large"
            :loading="isRebuilding"
          >
            {{ isRebuilding ? "重建中..." : "重建唤醒" }}
          </el-button>
        </div>
      </div>

      <!-- 重建进度覆盖层 -->
      <div v-if="isRebuilding && !isSleeping" class="rebuild-overlay">
        <div class="rebuild-content">
          <el-icon class="rebuild-icon rotating"><Loading /></el-icon>
          <h3>正在重建容器</h3>
          <p class="rebuild-step">{{ rebuildStep }}</p>
          <el-progress
            :percentage="rebuildProgress"
            :stroke-width="8"
            style="width: 300px"
          />
        </div>
      </div>
      <!-- 网页容器 -->
      <div class="webview-container" v-show="!isSleeping && !isRebuilding">
        <!-- 加载失败的内容展示 -->
        <div class="webviewError" v-if="isWebviewError">
          <img src="/assets/images/webError.png" />
          加载容器失败，请检查网络连接或容器状态
        </div>
        <!-- webview区域 -->
        <div
          style="
            display: flex;
            height: 100%;
            overflow: hidden;
            align-items: stretch;
          "
        >
          <!-- 添加 overflow: hidden; 防止横向溢出 -->
          <webview
            v-if="showWebview"
            ref="webviewRef"
            :id="`webview_${container.id}`"
            :key="webviewKey"
            :src="`${container.url}?platform=${container.platformId}&containerId=${container.id}`"
            :useragent="container.config.fingerprint.userAgent"
            :partition="`persist:container_${container.id}`"
            :preload="preloadpath"
            allowpopups
            webpreferences="webSecurity=false,nodeintegration=true allowRunningInsecureContent, contextIsolation=false"
            @did-navigate="onNavigate"
            @did-navigate-in-page="onNavigate"
            @dom-ready="handleWebviewReady"
            @did-finish-load="handleWebviewLoaded"
            @new-window="handleNewWindow"
            @did-fail-load="handleWebviewError"
            @destroyed="onWebviewDestroyed"
            @console-message="handleConsoleMessage"
            style="flex: 1; height: 100%"
          />
          <Tool_sidebar
            v-if="showWebview && showSidebar"
            :default-settings="pluginConfig"
            @sendtext="handleSendText"
            @save="handleSaveSidebarSettings"
            @close="showSidebar = false"
            style="flex-shrink: 0"
          />
        </div>

        <!-- 加载状态 -->
        <div
          v-if="!showWebview && !isSleeping && !isRebuilding"
          class="loading-container"
        >
          <el-loading-directive
            text="正在加载容器..."
            spinner="el-icon-loading"
            background="rgba(0, 0, 0, 0.8)"
          />
        </div>
      </div>

      <!-- 容器设置弹窗 -->
      <el-dialog v-model="showSettings" title="容器设置" width="600px">
        <ContainerSettings
          :showSettings="showSettings"
          :container="container"
          @save="handleSaveSettings"
          @cancel="handlecancleSettings"
        />
      </el-dialog>
      <el-dialog
        v-model="proxyDiagnosticToolVisible"
        title="代理诊断工具"
        width="600px"
        @close="handleCloseProxyDiagnosticTool"
      >
        <ProxyDiagnosticTool :container="container" />
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  reactive,
} from "vue";
import { debounce, cloneDeep } from "lodash-es"; // 🔥 新增：import debounce（需 yarn add lodash-es 或类似）
import { ElMessage } from "element-plus";
import {
  CircleCheck,
  Refresh,
  Monitor,
  VideoPlay,
  VideoPause,
  Camera,
  Setting,
  Connection,
  Delete,
  Loading,
} from "@element-plus/icons-vue";
import ContainerSettings from "./ContainerSettings.vue";
import ProxyDiagnosticTool from "./ProxyDiagnosticTool.vue";
import { useStore } from "vuex";
import { injectFeatures } from "@/utils/injector.js";
import Tool_sidebar from "./Tool_sidebar.vue";

const store = useStore();

// Props
const props = defineProps({
  container: {
    type: Object,
    required: true,
  },
  isreload: {
    type: Boolean,
  },
});

// Emits
const emit = defineEmits([
  "update-container",
  "update-isreload",
  "focus-container",
]);

// 响应式数据
const webviewRef = ref();
const showWebview = ref(false);
const webviewKey = ref(0); // 用于强制重建webview DOM
const showSettings = ref(false);
const showTranslationResult = ref(false);
const translating = ref(false);
const selectedText = ref("");
const translatedText = ref("");
const canGoBack = ref(false);
const canGoForward = ref(false);
const autoReplyEnabled = ref(false);
const autoReplyCount = ref(0);
const isWebviewError = ref(false); //是否加载失败？
const showSidebar = ref(false);
// 休眠重建相关状态
const isDestroying = ref(false);
const isRebuilding = ref(false);
const rebuildStep = ref("");
const rebuildProgress = ref(0);
const lastSleepData = ref(null);
const preloadpath = ref("");
const linepreloadpath = ref("");
const proxyDiagnosticToolVisible = ref(false); // 计算属性
const isSleeping = computed(() => props.container?.status === "sleeping");

// 🔥 新增：操作互斥状态（防止快速点击重叠）
const isOperating = ref(false);

// 🔥 新增：获取 preload 路径的独立函数（可复用，确保每次重建刷新）
const fetchPreloadPath = async () => {
  try {
    const result = await window.electronAPI?.getPreloadPath();
    if (result) {
      let path = result.preloadPath || "";
      if (path) {
        // 确保 Windows 路径用 /，并加 file://
        path = path.replace(/\\/g, "/");
        if (!path.startsWith("file://")) {
          path = `file://${path}`;
        }
        preloadpath.value = path;
        console.log("[UI] Preload path updated:", preloadpath.value); // 调试日志
      }
      linepreloadpath.value = result.linepreloadPath || "";
    }
  } catch (error) {
    console.error("[UI] Fetch preload path failed:", error);
    preloadpath.value = ""; // Fallback 为空，避免无效路径
  }
};

const getStatusText = (status) => {
  const statusMap = {
    created: "已创建",
    loading: "加载中",
    ready: "就绪",
    sleeping: "已休眠",
    error: "错误",
    disconnected: "断开连接",
  };
  return statusMap[status] || "未知";
};
const pluginConfig = reactive({
  // 新增：翻译设置（从 Tool_sidebar 映射）
  translation: {
    independentConfig: true,
    buttonText: "🌐 翻译",
    loadingText: "翻译中...",

    autoTranslateReceive: false,
    autoTranslateSend: true,
    channel: "google",
    targetLanguage: "en",
    sourceLanguage: "zh-CN",
    preview: false,
    autoVoice: false,
  },

  // 新增：代理设置
  proxy: {
    enabled: false,
    type: "http",
    host: "127.0.0.1",
    port: 8080,
  },

  // 新增：群发设置
  broadcast: {
    enabled: false,
    interval: 5,
    content: "",
  },

  // 新增：快速回复设置
  quickReply: {
    categories: [
      { name: "常用问候", editing: false, replies: [{ text: "你好！" }] },
      // ... 更多默认
    ],
    selectedCategory: 0,
  },

  // 新增：个人画像设置
  profile: {
    basic_info: { name: "", gender: "" /* ... 其他字段 */ },
    interests: ["编程"],
    behavior: { dialogue_style: "casual" /* ... */ },
    needs_and_painpoints: ["提高效率"],
    dynamic_tags: [
      { tag: "技术爱好者", category: "interest", confidence: 0.9 },
    ],
  },

  // 新增：系统设置（analytics 是只读，不需配置）
  settings: {
    autoStart: false,
    minimizeToTray: true,
    notification: true,
    theme: "auto",
  },
});

function updateNavState() {
  const webview = webviewRef.value;
  if (!webview) return;
  canGoBack.value = webview.canGoBack();
  canGoForward.value = webview.canGoForward();
}

function goBack() {
  const webview = webviewRef.value;
  if (webview && webview.canGoBack()) {
    webview.goBack();
  }
}

function goForward() {
  const webview = webviewRef.value;
  if (webview && webview.canGoForward()) {
    webview.goForward();
  }
}

function reload() {
  const webview = webviewRef.value;
  isWebviewError.value = false;
  if (webview) {
    webview.reload();
  }
}

function onNavigate() {
  updateNavState();
}
const getFunctionTitle = (func) => {
  const titleMap = {
    translation: "翻译",
    proxy: "代理",
    broadcast: "群发",
    quickReply: "快速回复",
    profile: "个人画像",
    settings: "系统",
  };
  return titleMap[func] || "未知";
};
function updatePluginConfig(webview, newConfig) {
  if (!webview) return;
  const configUpdateCode = `
    window.postMessage({ 
      type: 'updatePluginConfig',  // 新消息类型，扩展原有
      payload: ${JSON.stringify(newConfig)} 
    }, '*');
  `;
  webview.executeJavaScript(configUpdateCode).catch(console.error);
}
// 监听 pluginConfig 的变化，使用 deep: true
watch(
  pluginConfig,
  (newVal) => {
    console.log("pluginConfig 变化:", newVal);
    updatePluginConfig(webviewRef.value, newVal);
  },
  { deep: true }
);

// 🔥 优化：监听容器状态变化 - 移除 sleeping -> active 自动重建（移到 wakeContainer 顺序处理，避免 race）
watch(
  () => props.container?.status,
  async (newStatus, oldStatus) => {
    if (oldStatus === "ready" && newStatus === "loading" && props.isreload) {
      webviewRef.value?.reload();
    }
    // 🔥 移除：if (oldStatus === "sleeping" && newStatus === "active") { await rebuildWebviewDOM(); }
    // 现在由 wakeContainer 串行处理
  },
  { immediate: true, flush: "post" } // 🔥 优化：post 确保更新后执行
);

const handleCloseProxyDiagnosticTool = () => {
  proxyDiagnosticToolVisible.value = false;
};
const handleWebviewError = (event) => {
  console.log("Webview load error event:", event);

  // 忽略非主框架的加载失败
  if (!event.isMainFrame) {
    console.log("忽略子资源加载失败:", event.validatedURL);
    return;
  }

  // 忽略 Telegram ping 请求的失败
  if (
    event.validatedURL &&
    (event.validatedURL.includes("/k/ping/") ||
      event.validatedURL.includes("/ping/") ||
      event.validatedURL.includes(".nocache"))
  ) {
    console.log("忽略 Telegram ping 请求失败:", event.validatedURL);
    return;
  }

  // 忽略一些常见的非关键错误
  const ignoredErrorCodes = [-3, -2]; // -3: 通常是网络超时, -2: 是文件未找到但不影响主要功能
  if (ignoredErrorCodes.includes(event.errorCode)) {
    console.log("忽略非关键错误:", event.errorCode, event.validatedURL);
    return;
  }

  // 只有主框架的严重错误才设置错误状态
  const criticalErrorCodes = [-6, -105, -106, -102, -118]; // 网络相关的严重错误
  if (criticalErrorCodes.includes(event.errorCode)) {
    isWebviewError.value = true;
    console.error("严重的页面加载错误:", event);
    ElMessage.error(
      `加载容器失败: ${event.errorDescription || "网络连接错误"}`
    );
  } else {
    // 其他错误只记录日志，不影响UI
    console.warn("页面加载警告:", {
      errorCode: event.errorCode,
      url: event.validatedURL,
      description: event.errorDescription,
    });
  }
};

// 🔥 优化：webview DOM重建 - 添加路径验证和延迟，确保稳定
const rebuildWebviewDOM = async () => {
  console.log("[UI] Starting rebuildWebviewDOM"); // 调试
  isRebuilding.value = true;
  rebuildStep.value = "准备重建容器DOM...";
  rebuildProgress.value = 20;

  // 强制重建webview DOM元素
  webviewKey.value += 1;
  showWebview.value = false;

  await nextTick();

  rebuildStep.value = "创建新的浏览器实例...";
  rebuildProgress.value = 60;

  // 🔥 新增：重建后验证 preload 路径（防护）
  if (!preloadpath.value || !preloadpath.value.startsWith("file://")) {
    console.warn("[UI] Invalid preload path, refetching...");
    await fetchPreloadPath();
  }
  console.log("[UI] Final preload path for rebuild:", preloadpath.value); // 调试

  // 🔥 新增：短暂延迟，确保 DOM 稳定（避免 Electron 加载中断）
  await new Promise((resolve) => setTimeout(resolve, 200)); // 优化：增至 200ms
};

// 🔥 优化：休眠操作 - 添加互斥检查和日志
const sleepContainer = async () => {
  if (!props.container?.id || isOperating.value || isRebuilding.value) {
    console.warn("[UI] Sleep skipped: operating or rebuilding"); // 调试
    return;
  }

  console.log("[UI] Sleep started"); // 调试
  isOperating.value = true;
  isDestroying.value = true;

  try {
    // 先隐藏webview
    showWebview.value = false;

    // 调用store销毁容器
    await store.dispatch("containers/sleepContainer", props.container.id);

    // 获取销毁时保存的数据信息
    if (window.electronAPI?.getContainerRestoreData) {
      try {
        const restoreData = await window.electronAPI.getContainerRestoreData(
          props.container.id
        );
        if (restoreData?.success) {
          lastSleepData.value = {
            cookiesCount: restoreData.data.cookies?.length || 0,
            localStorageKeys: Object.keys(restoreData.data.localStorage || {})
              .length,
            sessionStorageKeys: Object.keys(
              restoreData.data.sessionStorage || {}
            ).length,
            lastUrl: restoreData.data.pageState?.url,
          };
        }
      } catch (error) {
        console.warn("Failed to get sleep data info:", error);
      }
    }
  } catch (error) {
    console.error("Sleep container failed:", error);
    ElMessage.error(`休眠失败: ${error.message}`);
    showWebview.value = true; // 失败时恢复显示
  } finally {
    isDestroying.value = false;
    isOperating.value = false;
    console.log("[UI] Sleep stopped"); // 调试
  }
};

// 🔥 优化：唤醒操作 - 添加互斥、超时重置和日志（串行执行，避免 race）
const wakeContainer = async () => {
  if (!props.container?.id || isOperating.value || isDestroying.value) {
    console.warn("[UI] Wake skipped: operating or destroying"); // 调试
    return;
  }

  console.log("[UI] Wake started"); // 调试
  isOperating.value = true;
  isRebuilding.value = true;
  rebuildStep.value = "准备唤醒容器...";
  rebuildProgress.value = 10;

  // 🔥 新增：超时重置（10s 后强制停止，防止卡死）
  const timeoutId = setTimeout(() => {
    if (isRebuilding.value) {
      console.warn("[UI] Wake timeout, forcing reset");
      isRebuilding.value = false;
      isOperating.value = false;
      rebuildStep.value = "";
      rebuildProgress.value = 0;
      ElMessage.error("重建超时，请重试");
    }
  }, 10000);

  try {
    // 1. 先唤醒（主进程重建 session、恢复数据）
    await store.dispatch("containers/wakeContainer", props.container.id);

    rebuildStep.value = "容器配置已恢复...";
    rebuildProgress.value = 60;

    // 🔥 新增：重建前重新获取 preload 路径（确保最新）
    await fetchPreloadPath();

    // 2. 强制重建 webview DOM
    await rebuildWebviewDOM();

    // 3. 等待 DOM 更新后显示（确保 preload 注入）
    await nextTick();
    showWebview.value = true;
    console.log("[UI] showWebview set to true after rebuild"); // 调试

    rebuildStep.value = "正在加载 Webview...";
    rebuildProgress.value = 80;

    // 4. 加载完成后关闭覆盖层（在 handleWebviewLoaded 中处理）
  } catch (error) {
    console.error("Wake container failed:", error);
    ElMessage.error(`唤醒失败: ${error.message}`);
    isRebuilding.value = false;
    rebuildStep.value = "";
    rebuildProgress.value = 0;
  } finally {
    clearTimeout(timeoutId); // 清理超时
    isOperating.value = false;
    // 注意：isRebuilding 在 handleWebviewLoaded 中设 false（或超时已设）
    console.log("[UI] Wake stopped"); // 调试
  }
};

// 🔥 优化：防抖版本（模板中按钮 @click 用这些）
const debouncedSleep = debounce(sleepContainer, 500); // 500ms 防抖
const debouncedWake = debounce(wakeContainer, 500); // 500ms 防抖

// 🔥 优化：webview 事件处理 - 添加 ref 检查和日志
const handleWebviewReady = async () => {
  if (!webviewRef.value) return; // 🔥 新增：防护检查
  console.log("Webview DOM 加载完成"); // 调试
  console.log("Webview ref:", webviewRef.value);
  updateNavState();
  emit("update-container", props.container.id, { status: "ready" });

  // 注册webview到主进程
  if (props.container?.id) {
    try {
      const webContentsId = webviewRef.value.getWebContentsId();
      if (window.electronAPI?.registerContainerWebview) {
        await window.electronAPI.registerContainerWebview(
          props.container.id,
          webContentsId
        );
        console.log(
          `[UI] Registered webview for container ${props.container.id}`
        ); // 调试
      }
    } catch (error) {
      console.error("Register webview failed:", error);
    }
  }

  // 🔥 优化：恢复数据（移到 ready 后，确保稳定）
  await restoreWebviewData();

  // 注入自定义脚本
  setTimeout(() => {
    if (webviewRef.value) {
      // 🔥 防护：检查 ref
      injectFeatures(
        webviewRef.value,
        props.container.platform.id, // 比如 'whatsapp'
        props.container.features || ["translation"],
        pluginConfig
      );
      console.log("容器插件注入完成", props.container.platform.id);
    }
  }, 1000);
};

const handleWebviewLoaded = () => {
  if (!webviewRef.value) return; // 🔥 新增：防护检查
  console.log("Webview loaded");
  showWebview.value = true;

  // 重建完成
  if (isRebuilding.value) {
    rebuildStep.value = "重建完成";
    rebuildProgress.value = 100;

    setTimeout(() => {
      isRebuilding.value = false;
      rebuildStep.value = "";
      rebuildProgress.value = 0;
    }, 500);
  }
};

// 🔥 优化：恢复webview数据 - 添加日志和错误处理
const restoreWebviewData = async () => {
  if (!webviewRef.value || !props.container?.id) {
    console.warn("[UI] Skip restore: no webview or container ID");
    return false;
  }

  try {
    // 1. 从主进程获取恢复数据
    const restoreData = await window.electronAPI?.getContainerRestoreData(
      props.container.id
    );
    if (!restoreData?.success) {
      console.warn("No restore data available");
      return false;
    }

    const {
      localStorage: localData,
      sessionStorage: sessionData,
      pageState,
    } = restoreData.data;

    console.log("[UI] Starting data restore..."); // 调试

    // 2. 注入恢复脚本并等待完成
    const restoreScript = `
      new Promise((resolve) => {
        try {
          // 恢复localStorage
          const localData = ${JSON.stringify(localData || {})};
          for (const [key, value] of Object.entries(localData)) {
            try {
              localStorage.setItem(key, value);
            } catch (e) {
              console.warn('Failed to restore localStorage:', key, e);
            }
          }
          
          // 恢复sessionStorage
          const sessionData = ${JSON.stringify(sessionData || {})};
          for (const [key, value] of Object.entries(sessionData)) {
            try {
              sessionStorage.setItem(key, value);
            } catch (e) {
              console.warn('Failed to restore sessionStorage:', key, e);
            }
          }
          
          console.log('Storage restoration completed');
          resolve(true);
        } catch (e) {
          console.error('Restoration failed:', e);
          resolve(false);
        }
      });
    `;

    // 等待脚本执行完成
    const success = await webviewRef.value.executeJavaScript(
      restoreScript,
      true
    );
    if (!success) {
      console.warn("Storage restoration script reported failure");
    }

    // 3. 恢复滚动位置 (非阻塞)
    if (pageState?.scrollX !== undefined || pageState?.scrollY !== undefined) {
      webviewRef.value
        .executeJavaScript(
          `
        window.scrollTo(${pageState.scrollX || 0}, ${pageState.scrollY || 0});
      `
        )
        .catch(console.warn);
    }

    console.log("[UI] Data restore completed"); // 调试
    return true;
  } catch (error) {
    console.error("Restore failed:", error);
    return false;
  }
};

const onWebviewDestroyed = async () => {
  console.log("Webview destroyed");
  if (props.container?.id && window.electronAPI?.unregisterContainerWebview) {
    try {
      await window.electronAPI.unregisterContainerWebview(props.container.id);
      console.log(
        `[UI] Unregistered webview for container ${props.container.id}`
      );
    } catch (error) {
      console.error("Unregister failed:", error);
    }
  }
};

const handleConsoleMessage = (event) => {
  console.log("Webview console:", event.message);
};

// 其他原有方法保持不变
const reloadContainer = () => {
  isWebviewError.value = false;
  if (webviewRef.value && !isSleeping.value) {
    emit("update-container", props.container.id, { status: "loading" });
    webviewRef.value.reload();
  }
};

const toggleDevTools = () => {
  if (webviewRef.value && !isSleeping.value) {
    if (webviewRef.value.isDevToolsOpened()) {
      webviewRef.value.closeDevTools();
    } else {
      webviewRef.value.openDevTools();
    }
  }
};

const takeScreenshot = async () => {
  if (isSleeping.value) {
    ElMessage.warning("容器休眠中，无法截图");
    return;
  }

  try {
    if (webviewRef.value) {
      const nativeImage = await webviewRef.value.capturePage();
      const dataURL = nativeImage.toDataURL();

      const link = document.createElement("a");
      link.download = `screenshot_${props.container.name}_${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      ElMessage.success("截图已保存");
    }
  } catch (error) {
    ElMessage.error("截图失败");
  }
};

const handleSaveSettings = (settings) => {
  console.log("Saving container settings:", settings);
  emit("update-container", props.container.id, { config: settings });
  showSettings.value = false;
  ElMessage.success("设置已保存");
};
const handlecancleSettings = () => {
  showSettings.value = false;
};

const handleNewWindow = (event) => {
  console.log("New window requested:", event.url);
  // 可以在这里处理新窗口打开逻辑
};

// 🔥 新增：处理通知点击的方法
const handleNotificationClick = (data) => {
  console.log("[Container] Processing notification click:", data);

  const { metadata } = data;
  if (!metadata) return;

  // 检查是否是当前容器的通知
  if (metadata.containerId === props.container.id) {
    console.log(`[Container] 聚焦到容器: ${props.container.name}`);

    // 1. 如果容器在休眠状态，先唤醒
    if (isSleeping.value) {
      console.log("[Container] 容器在休眠中，正在唤醒...");
      debouncedWake(); // 🔥 用防抖版本
      return; // 唤醒后会自动显示webview
    }

    // 2. 确保webview可见
    if (!showWebview.value) {
      showWebview.value = true;
    }

    // 3. 聚焦到webview（延迟执行确保DOM已更新）
    nextTick(() => {
      if (webviewRef.value) {
        try {
          // 聚焦webview
          webviewRef.value.focus();
          console.log("[Container] Webview 已聚焦");

          // 可选：滚动到相关消息（如果平台支持）
          scrollToMessage(metadata);
        } catch (error) {
          console.error("[Container] 聚焦webview失败:", error);
        }
      }
    });

    // 4. 发出事件给父组件，让它切换到当前标签
    emit("focus-container", props.container.id);
  } else {
    console.log(
      `[Container] 通知不属于当前容器 (${metadata.containerId} !== ${props.container.id})`
    );
  }
};

// 🔥 新增：滚动到相关消息（可选功能）
const scrollToMessage = (metadata) => {
  if (!webviewRef.value || !metadata.tag) return;

  // 尝试根据通知tag找到相关消息并滚动（这个逻辑需要根据具体平台调整）
  const scrollScript = `
    TelegramContacts.openChatByNickname('${metadata.title}')
  `;

  webviewRef.value.executeJavaScript(scrollScript).catch(console.warn);
};

// 🔥 可选：watch preloadpath 变化（调试用）
watch(preloadpath, (newPath) => {
  console.log("[UI] Preload path changed:", newPath);
  if (newPath && !newPath.startsWith("file://")) {
    console.error("[UI] Preload path not file:// format!");
  }
});
const handleSendText = (text) => {
  if (isSleeping.value) {
    ElMessage.warning("容器休眠中，无法发送消息");
    return;
  }
  if (webviewRef.value && text) {
   webviewRef.value.contentWindow.postMessage(
      {
        type: "sendText",
        payload: text,
      },
      "*"
    );
    ElMessage.success("消息已发送");
  }
};
// 新增：处理侧边栏保存事件
const handleSaveSidebarSettings = (settings) => {
  console.log("接收到侧边栏设置:", JSON.stringify(settings, null, 2));

  const activeFunc = settings.activeFunction || "translation";
  console.log("Active function:", activeFunc);

  if (activeFunc in pluginConfig && settings[activeFunc]) {
    // 只合并对应模块的字段
    Object.assign(pluginConfig[activeFunc], cloneDeep(settings[activeFunc]));
    console.log(`更新后的 ${activeFunc} 设置:`, pluginConfig[activeFunc]);
  } else {
    console.error(
      `无效的 activeFunc 或 settings[${activeFunc}] 不存在:`,
      settings
    );
    ElMessage.error("设置数据无效");
    return;
  }
  const newConfig = cloneDeep(pluginConfig);
  // 更新父组件，确保深拷贝
  emit("update-container", props.container.id, {
    pluginConfig: newConfig,
  });

  updatePluginConfig(webviewRef.value, newConfig); // 更新 webview
  ElMessage.success(`${getFunctionTitle(activeFunc)} 设置已保存并应用到容器`);
};
// 生命周期
onMounted(async () => {
  // 🔥 新增：监听通知事件
  let notificationClickUnsubscribe = null;
  let notificationInterceptUnsubscribe = null;

  if (window.electronAPI) {
    // 监听通知点击事件
    notificationClickUnsubscribe = window.electronAPI.onNotificationClick(
      (data) => {
        console.log("[Container] 通知被点击:", data);
        handleNotificationClick(data);
      }
    );

    // 监听通知拦截事件（可选，用于调试）
    notificationInterceptUnsubscribe =
      window.electronAPI.onNotificationIntercepted((data) => {
        console.log("[Container] 通知被拦截:", data);
        // 可以在这里添加UI提示，比如显示未读消息数量
        if (data.containerId === props.container.id) {
          // 这是当前容器的通知
          console.log(
            `[Container] 当前容器 ${props.container.name} 收到新消息: ${data.title}`
          );
        }
      });
  }

  // 🔥 在 onUnmounted 中清理监听器
  onUnmounted(() => {
    if (notificationClickUnsubscribe) notificationClickUnsubscribe();
    if (notificationInterceptUnsubscribe) notificationInterceptUnsubscribe();
    onWebviewDestroyed(); // 🔥 优化：手动清理
  });

  // 其余现有代码...
  await fetchPreloadPath(); // 🔥 用独立函数替换原逻辑

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
  const randomNumber = getRandomInt(1, 100);
  console.log("当前加载的容器:", props.container);
  await window.electronAPI?.loadPlugin(
    JSON.parse(JSON.stringify(props.container))
  );

  console.log("加载插件完成");
  if (props.container?.pluginConfig) {
    Object.assign(pluginConfig, cloneDeep(props.container.pluginConfig));
  }

  // 如果容器不是休眠状态，则开始加载
  if (!isSleeping.value) {
    emit("update-container", props.container.id, { status: "loading" });

    setTimeout(() => {
      if (!showWebview.value && !isSleeping.value) {
        showWebview.value = true;
        emit("update-container", props.container.id, { status: "ready" });
      }
    }, 3000);
  }
});

onUnmounted(() => {
  onWebviewDestroyed(); // 🔥 已在上方处理
});
</script>

<style scoped>
.container-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.container-toolbar {
  height: 50px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}
.sleep-overlay,
.rebuild-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #f4f4f8, #e6e8ed);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.sleep-content,
.rebuild-content {
  text-align: center;
  background: white;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  width: 380px;
  animation: fadeIn 0.4s ease;
}

.sleep-icon,
.rebuild-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 20px;
}

.sleep-info {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  margin: 12px 0 20px;
}

.sleep-stats {
  margin-bottom: 20px;
  text-align: left;
  font-size: 14px;
  color: #333;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin: 6px 0;
}

.rebuild-step {
  font-size: 16px;
  color: #444;
  margin: 12px 0 20px;
}

.el-button {
  border-radius: 8px;
  padding: 10px 20px;
}

.rotating {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.nav-buttons {
  margin-bottom: 8px;
}
.nav-buttons button {
  margin-right: 8px;
  padding: 6px 12px;
}
.status-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f0f0f0;
}

.status-indicator.ready {
  background: #f0f9e8;
  color: #52c41a;
}

.status-indicator.loading {
  background: #fff7e6;
  color: #fa8c16;
}

.status-indicator.error {
  background: #fff2f0;
  color: #f5222d;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.container-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.webview-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.webview-container webview {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.floating-toolbar {
  position: absolute;
  top: 50px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.feature-panel {
  background: white;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.translation-panel,
.auto-reply-panel,
.quick-message-panel {
  min-width: 60px;
}

.reply-count-badge {
  margin-left: -8px;
  margin-top: -8px;
}

.translation-result {
  padding: 20px 0;
}

.translation-result h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.translation-result p {
  margin: 0 0 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  line-height: 1.6;
  color: #555;
}

.original-text p {
  border-left: 3px solid #409eff;
}

.translated-text p {
  border-left: 3px solid #67c23a;
}
.webviewError {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-direction: column;
}
</style>
