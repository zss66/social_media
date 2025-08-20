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
      <div id="mainbox" ></div>
      <!-- 网页容器 -->
      <div class="webview-container" v-show="!isSleeping && !isRebuilding">
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

    <!-- 浮动工具栏 -->
    <div
      class="floating-toolbar"
      v-if="showWebview && container.features && !isSleeping"
    >
      <!-- 翻译工具 -->
      <div
        v-if="container.features.translation"
        class="feature-panel translation-panel"
      >
        <el-tooltip content="选择翻译语言">
          <el-button
            @click="translateSelectedText"
            :icon="ChatDotRound"
            type="primary"
            circle
            :loading="translating"
          />
        </el-tooltip>

        <el-dropdown @command="handleTranslationLanguage" trigger="click">
          <el-button size="small" type="text">
            {{ pluginConfig.targetLanguage }}
            <el-icon><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="en">英语</el-dropdown-item>
              <el-dropdown-item command="zh">中文</el-dropdown-item>
              <el-dropdown-item command="ja">日语</el-dropdown-item>
              <el-dropdown-item command="ko">韩语</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 自动回复工具 -->
      <div
        v-if="container.features.autoReply"
        class="feature-panel auto-reply-panel"
      >
        <el-tooltip
          :content="autoReplyEnabled ? '关闭自动回复' : '开启自动回复'"
        >
          <el-button
            @click="toggleAutoReply"
            :icon="ChatLineRound"
            :type="autoReplyEnabled ? 'success' : 'info'"
            circle
          />
        </el-tooltip>

        <el-badge
          v-if="autoReplyCount > 0"
          :value="autoReplyCount"
          class="reply-count-badge"
        />
      </div>

      <!-- 快捷消息 -->
      <!-- <div class="feature-panel quick-message-panel">
        <el-dropdown @command="sendQuickMessage" trigger="click">
          <div>
            <el-button :icon="ChatRound" type="warning" circle />
            <el-text type="primary">快捷回复</el-text>
          </div>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="hello">👋 你好</el-dropdown-item>
              <el-dropdown-item command="thanks">🙏 谢谢</el-dropdown-item>
              <el-dropdown-item command="ok">👍 好的</el-dropdown-item>
              <el-dropdown-item command="busy"
                >⏰ 我现在有点忙</el-dropdown-item
              >
              <el-dropdown-item command="later">🕐 稍后联系</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div> -->
    </div>

    <!-- 翻译结果弹窗 -->
    <el-dialog v-model="showTranslationResult" title="翻译结果" width="500px">
      <div class="translation-result">
        <div class="original-text">
          <h4>原文：</h4>
          <p>{{ selectedText }}</p>
        </div>
        <div class="translated-text">
          <h4>译文：</h4>
          <p>{{ translatedText }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTranslationResult = false">关闭</el-button>
        <el-button @click="copyTranslation" type="primary">复制译文</el-button>
      </template>
    </el-dialog>

    <!-- 容器设置弹窗 -->
    <el-dialog v-model="showSettings" title="容器设置" width="600px">
      <ContainerSettings :container="container" @save="handleSaveSettings" @cancel="handlecancleSettings" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch,reactive } from "vue";
import { ElMessage } from "element-plus";
import {
  CircleCheck,
  Refresh,
  Monitor,
  VideoPlay,
  VideoPause,
  Camera,
  Setting,
  ChatDotRound,
  ChatLineRound,
  ChatRound,
  ArrowDown,
  Delete,
  Loading,
} from "@element-plus/icons-vue";
import ContainerSettings from "./ContainerSettings.vue";
import { useStore } from "vuex";
import { injectFeatures } from "@/utils/injector.js";

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
const emit = defineEmits(["update-container", "update-isreload", "focus-container"]);

// 响应式数据
const webviewRef = ref();
const showWebview = ref(false);
const webviewKey = ref(0); // 用于强制重建webview DOM
const showSettings = ref(false);
const showTranslationResult = ref(false);
const translating = ref(false);
const selectedText = ref("");
const translatedText = ref("");
const canGoBack = ref(false)
const canGoForward = ref(false)
const autoReplyEnabled = ref(false);
const autoReplyCount = ref(0);

// 休眠重建相关状态
const isDestroying = ref(false);
const isRebuilding = ref(false);
const rebuildStep = ref("");
const rebuildProgress = ref(0);
const lastSleepData = ref(null);
const preloadpath = ref("");
const linepreloadpath = ref("");
// 计算属性
const isSleeping = computed(() => props.container?.status === "sleeping");

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
  targetLanguage: '英文', // 默认中文
  buttonText: '🌐 翻译',
  loadingText: '翻译中...',
})

function updateNavState() {
  const webview = webviewRef.value
  if (!webview) return
  canGoBack.value = webview.canGoBack()
  canGoForward.value = webview.canGoForward()
}

function goBack() {
  const webview = webviewRef.value
  if (webview && webview.canGoBack()) {
    webview.goBack()
  }
}

function goForward() {
  const webview = webviewRef.value
  if (webview && webview.canGoForward()) {
    webview.goForward()
  }
}

function reload() {
  const webview = webviewRef.value
  if (webview) {
    webview.reload()
  }
}

function onNavigate() {
  updateNavState()
}


function updatePluginConfig(webview, newConfig) {
  if (!webview) return;
  const configUpdateCode = `
    window.postMessage({ type: 'updatePluginConfig', payload: ${JSON.stringify(newConfig)} }, '*');
  `;
  webview.executeJavaScript(configUpdateCode).catch(console.error);
}
// 监听 pluginConfig 的变化，使用 deep: true
watch(pluginConfig, (newVal, oldVal) => {
  console.log('pluginConfig 改变了:', newVal)
  updatePluginConfig(webviewRef.value,newVal)
}, { deep: true })

// 监听容器状态变化
watch(
  () => props.container?.status,
  async (newStatus, oldStatus) => {
    
    // showTranslationResult.value=newTrans;
    // autoReplyEnabled.value = newReply;
    if (oldStatus === "ready" && newStatus === "loading" && props.isreload) {
      webviewRef.value.reload();
    }
    
    if (oldStatus === "sleeping" && newStatus === "active") {
      // 从休眠唤醒，需要重建webview
    
  
      await rebuildWebviewDOM();
    }
  },
  { immediate: true }
);


const handleWebviewError = (event) => {
  console.error("Webview load error:", event);
  ElMessage.error("加载容器失败，请检查网络连接或容器状态");
};
// webview DOM重建
const rebuildWebviewDOM = async () => {
  
  console.log("Rebuilding webview DOM...");
  isRebuilding.value = true;
  rebuildStep.value = "准备重建容器DOM...";
  rebuildProgress.value = 20;

  // 强制重建webview DOM元素
  webviewKey.value += 1;
  showWebview.value = false;

  await nextTick();

  rebuildStep.value = "创建新的浏览器实例...";
  rebuildProgress.value = 60;

  // showWebview.value = true;
};

// 休眠操作 - 销毁webview
const sleepContainer = async () => {
  if (!props.container?.id) return;

  console.log("[UI] Destroying container:", props.container.id);
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

    ElMessage.success("容器已销毁休眠，进程完全停止");
  } catch (error) {
    console.error("Sleep container failed:", error);
    ElMessage.error(`休眠失败: ${error.message}`);
    showWebview.value = true; // 失败时恢复显示
  } finally {
    isDestroying.value = false;
  }
};

// 唤醒操作 - 重建webview
const wakeContainer = async () => {
  if (!props.container?.id) return;

  console.log("[UI] Rebuilding container:", props.container.id);
  isRebuilding.value = true;
  rebuildStep.value = "准备唤醒容器...";
  rebuildProgress.value = 10;

  try {
    // 调用store唤醒容器
    await store.dispatch("containers/wakeContainer", props.container.id);

    rebuildStep.value = "容器配置已恢复...";
    rebuildProgress.value = 80;
    isRebuilding.value = true;
    showWebview.value = true
    ElMessage.success("容器已重建唤醒");
  } catch (error) {
    console.error("Wake container failed:", error);
    ElMessage.error(`唤醒失败: ${error.message}`);
  } finally {
    // 注意：isRebuilding 会在 handleWebviewLoaded 中设置为 false
  }
};

// webview 事件处理
const handleWebviewReady = async () => {
  console.log("Webview DOM 加载完成");
  console.log(webviewRef.value);
  updateNavState()
  emit("update-container", props.container.id, { status: "ready" });

  // 注册webview到主进程
  if (webviewRef.value && props.container?.id) {
    try {
      const webContentsId = webviewRef.value.getWebContentsId();
      if (window.electronAPI?.registerContainerWebview) {
        await window.electronAPI.registerContainerWebview(
          props.container.id,
          webContentsId
        );
        console.log(
          `[UI] Registered webview for container ${props.container.id}`
        );
      }
    } catch (error) {
      console.error("Failed to register webview:", error);
    }
  }

  // 如果是重建过程，执行恢复流程
  if (isRebuilding.value) {
    rebuildStep.value = "恢复浏览器数据...";
    rebuildProgress.value = 90;

    try {
      await restoreWebviewData();
      rebuildProgress.value = 95;

      // 注入自定义脚本
      await nextTick();
      const result = await window.electronAPI?.getPreloadPath();
if (result) {
  preloadpath.value = result.preloadPath || '';
  linepreloadpath.value = result.linepreloadPath || '';
}
      injectFeatures(
        webviewRef.value,
        props.container.platform.id, // 比如 'whatsapp'
        props.container.features || ["translation"],
        pluginConfig
      );

      rebuildProgress.value = 100;
      rebuildStep.value = "重建完成";

      // 延迟关闭重建状态，确保所有操作完成
      setTimeout(() => {
        isRebuilding.value = false;
        rebuildStep.value = "";
        rebuildProgress.value = 0;
      }, 500);
    } catch (error) {
      console.error("Rebuild failed:", error);
      isRebuilding.value = false;
      ElMessage.error("容器重建失败");
    }
  }
  emit("webviewRef", webviewRef.value);
  // 注入自定义脚本
  setTimeout(() => {
    injectFeatures(
      webviewRef.value,
      props.container.platform.id, // 比如 'whatsapp'
      props.container.features || ["translation"],
     pluginConfig
    );
    console.log("container", props.container);
  }, 1000);
};


const handleWebviewLoaded = () => {
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

// 恢复webview数据
const restoreWebviewData = async () => {
  if (!webviewRef.value || !props.container?.id) return false;

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

    return true;
  } catch (error) {
    console.error("Restore failed:", error);
    return false;
  }
};

const onWebviewDestroyed = async () => {
  console.log("Webview destroyed");
  if (props.container?.id && window.electronAPI?.unregisterContainerWebview) {
    await window.electronAPI.unregisterContainerWebview(props.container.id);
    console.log(
      `[UI] Unregistered webview for container ${props.container.id}`
    );
  }
};

const handleConsoleMessage = (event) => {
  console.log('Webview console:', event.message)
};

// 注入自定义脚本

// 其他原有方法保持不变
const reloadContainer = () => {
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

const translateSelectedText = async () => {
  if (!selectedText.value) {
    ElMessage.warning("请先选择要翻译的文本");
    return;
  }

  translating.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    translatedText.value = `[模拟翻译] ${selectedText.value}`;
    showTranslationResult.value = true;
  } catch (error) {
    ElMessage.error("翻译失败");
  } finally {
    translating.value = false;
  }
};

const handleTranslationLanguage = (lang) => {
  const langMap = {
    en: "英语",
    zh: "中文",
    ja: "日语",
    ko: "韩语",
  };
  pluginConfig.targetLanguage = langMap[lang];
  ElMessage.info(`翻译语言已切换为${langMap[lang]}`);
};

const copyTranslation = () => {
  navigator.clipboard.writeText(translatedText.value);
  ElMessage.success("译文已复制到剪贴板");
};

const toggleAutoReply = () => {
  autoReplyEnabled.value = !autoReplyEnabled.value;
  const status = autoReplyEnabled.value ? "开启" : "关闭";
  ElMessage.info(`自动回复已${status}`);
};

const sendQuickMessage = (command) => {
  if (isSleeping.value) {
    ElMessage.warning("容器休眠中，无法发送消息");
    return;
  }

  const messages = {
    hello: "你好",
    thanks: "谢谢",
    ok: "好的",
    busy: "我现在有点忙，稍后联系",
    later: "稍后联系",
  };

  const message = messages[command];
  if (message && webviewRef.value) {
    const sendScript = `
      (function() {
        const inputSelectors = [
          '[data-testid="conversation-compose-box-input"]',
          '.input-container textarea',
          '#main footer [contenteditable="true"]',
          '[contenteditable="true"]'
        ];
        
        let input = null;
        for (const selector of inputSelectors) {
          input = document.querySelector(selector);
          if (input) break;
        }
        
        if (input) {
          input.focus();
          input.textContent = '${message}';
          
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
          
          setTimeout(() => {
            const sendSelectors = [
              '[data-testid="send-button"]',
              '.send-button',
              '[aria-label*="发送"]',
              'button[type="submit"]'
            ];
            
            for (const selector of sendSelectors) {
              const sendBtn = document.querySelector(selector);
              if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
                break;
              }
            }
          }, 100);
        }
      })();
    `;

    webviewRef.value.executeJavaScript(sendScript);
    ElMessage.success(`已发送快捷消息: ${message}`);
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

// 监听webview消息
const handleWebviewMessage = (event) => {
  const { data } = event;

  if (data.type === "translate") {
    selectedText.value = data.text;
    translateSelectedText();
  } else if (data.type === "newMessage" && autoReplyEnabled.value) {
    setTimeout(() => {
      if (props.container.config?.autoReplyMessage) {
        sendQuickMessage("custom");
        autoReplyCount.value++;
      }
    }, (props.container.config?.autoReplyDelay || 3) * 1000);
  }
};
// 🔥 新增：处理通知点击的方法
const handleNotificationClick = (data) => {
  console.log('[Container] Processing notification click:', data);
  
  const { metadata } = data;
  if (!metadata) return;
  
  // 检查是否是当前容器的通知
  if (metadata.containerId === props.container.id) {
    console.log(`[Container] 聚焦到容器: ${props.container.name}`);
    
    // 1. 如果容器在休眠状态，先唤醒
    if (isSleeping.value) {
      console.log('[Container] 容器在休眠中，正在唤醒...');
      wakeContainer();
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
          console.log('[Container] Webview 已聚焦');
          
          // 可选：滚动到相关消息（如果平台支持）
          scrollToMessage(metadata);
          
        } catch (error) {
          console.error('[Container] 聚焦webview失败:', error);
        }
      }
    });
    
    // 4. 发出事件给父组件，让它切换到当前标签
    emit('focus-container', props.container.id);
    
  } else {
    console.log(`[Container] 通知不属于当前容器 (${metadata.containerId} !== ${props.container.id})`);
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
// 生命周期
onMounted(async () => {
  window.addEventListener("message", handleWebviewMessage);
   // 🔥 新增：监听通知事件
  let notificationClickUnsubscribe = null;
  let notificationInterceptUnsubscribe = null;
  
  if (window.electronAPI) {
    // 监听通知点击事件
    notificationClickUnsubscribe = window.electronAPI.onNotificationClick((data) => {
      console.log('[Container] 通知被点击:', data);
      handleNotificationClick(data);
    });
    
    // 监听通知拦截事件（可选，用于调试）
    notificationInterceptUnsubscribe = window.electronAPI.onNotificationIntercepted((data) => {
      console.log('[Container] 通知被拦截:', data);
      // 可以在这里添加UI提示，比如显示未读消息数量
      if (data.containerId === props.container.id) {
        // 这是当前容器的通知
        console.log(`[Container] 当前容器 ${props.container.name} 收到新消息: ${data.title}`);
      }
    });
  }
  
  // 🔥 在 onUnmounted 中清理监听器
  onUnmounted(() => {
    window.removeEventListener("message", handleWebviewMessage);
    if (notificationClickUnsubscribe) notificationClickUnsubscribe();
    if (notificationInterceptUnsubscribe) notificationInterceptUnsubscribe();
  });
  
  // 其余现有代码...
 
 const result = await window.electronAPI?.getPreloadPath();
if (result) {
  preloadpath.value = result.preloadPath || '';
  linepreloadpath.value = result.linepreloadPath || '';
}
  if (preloadpath.value) {
    preloadpath.value = `file://${preloadpath.value.replace(/\\/g, "/")}`; // 强制转换格式
  }
  console.log("修正后的 preloadpath:", preloadpath.value); // 应该输出 file:///C:/path/to/preload.js
   function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
} 
 const randomNumber = getRandomInt(1, 100);
  console.log("当前加载的容器:", props.container);
  await window.electronAPI?.loadPlugin(JSON.parse(JSON.stringify(props.container)));
  
  // await window.electronAPI?.loadPlugin(JSON.parse(JSON.stringify(props.container.platformId)));
  console.log("加载插件完成");
 
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
  window.removeEventListener("message", handleWebviewMessage);
  onWebviewDestroyed();
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
  gap: 15px;
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
</style>
