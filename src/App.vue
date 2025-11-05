<!-- App.vue 中的知识库弹窗部分 - 修复版 -->

<template>
  <div id="app" class="app-container">
    <!-- 应用头部 -->
    <div class="app-header">
      <div class="title">Multi Social Platform</div>
      <div class="header-controls">
        <!-- ✅ 使用计算属性控制知识库弹窗 -->
        <el-button
          @click="handleOpenKnowledge"
          :icon="Reading"
          circle
          title="知识库 (Ctrl+K)"
        />
        <el-button
          @click="showAbout = true"
          :icon="InfoFilled"
          circle
          title="关于 (Ctrl+I)"
        />
        <el-button
          @click="showGlobalSettings = true"
          :icon="Setting"
          circle
          title="设置 (Ctrl+,)"
        />
        <el-button @click="minimizeApp" :icon="Minus" circle title="最小化" />
        <el-button
          @click="toggleFullscreen"
          :icon="FullScreen"
          circle
          title="全屏 (F11)"
        />
        <el-button
          @click="closeApp"
          :icon="Close"
          circle
          type="danger"
          title="关闭"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="app-body">
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <transition name="fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </keep-alive>
      </router-view>
    </div>

    <!-- 全局设置弹窗 -->
    <el-dialog
      v-model="showGlobalSettings"
      title="全局设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <GlobalSettings
        :showGlobalSettings="showGlobalSettings"
        @save="handleSaveGlobalSettings"
      />
    </el-dialog>

    <!-- ✅ 修复：知识库弹窗 - 移除 v-if 改用 v-show 或 keep-alive -->
    <el-dialog
      v-model="showKnowledgeDialog"
      width="90%"
      :close-on-click-modal="false"
      :show-close="false"
      class="custom-dialog knowledge-dialog"
      top="40px"
      :destroy-on-close="false"
    >
      <template #header="{ close }">
        <div class="custom-dialog-header">
          <span class="dialog-title">知识库管理</span>
          <div class="dialog-actions">
            <el-button
              :icon="Close"
              circle
              size="small"
              @click="handleCloseKnowledge"
              title="关闭 (Esc)"
            />
          </div>
        </div>
      </template>
      <!-- ✅ 关键修复：使用 v-show 而不是 v-if，保持组件实例 -->
      <Knowledge v-show="showKnowledgeDialog" />
    </el-dialog>

    <!-- 关于弹窗 -->
    <el-dialog
      v-model="showAbout"
      width="90%"
      :close-on-click-modal="false"
      :show-close="false"
      class="custom-dialog about-dialog"
      top="40px"
    >
      <template #header="{ close }">
        <div class="custom-dialog-header">
          <span class="dialog-title">关于应用</span>
          <div class="dialog-actions">
            <el-button
              :icon="Close"
              circle
              size="small"
              @click="close"
              title="关闭 (Esc)"
            />
          </div>
        </div>
      </template>
      <About v-if="showAbout" />
    </el-dialog>

    <!-- 全局加载组件 -->
    <Loading
      v-if="globalLoading"
      :fullscreen="true"
      :text="loadingText"
      :progress="loadingProgress"
      :show-progress="showLoadingProgress"
    />

    <!-- 全局错误提示 -->
    <div v-if="globalError" class="global-error">
      <el-alert
        :title="globalError.title || '系统错误'"
        :description="globalError.message"
        type="error"
        show-icon
        :closable="true"
        @close="clearGlobalError"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Setting,
  Minus,
  Close,
  FullScreen,
  Reading,
  InfoFilled,
} from "@element-plus/icons-vue";
import GlobalSettings from "@/components/GlobalSettings.vue";
import Loading from "@/components/Loading.vue";
import Knowledge from "@/views/Knowledge.vue";
import About from "@/views/About.vue";

const store = useStore();
const router = useRouter();

// ✅ 修改：本地控制弹窗状态
const showKnowledgeDialog = ref(false);
const showGlobalSettings = ref(false);
const showAbout = ref(false);

// 计算属性
const globalLoading = computed(() => store.getters.isLoading);
const globalError = computed(() => store.getters.currentError);
const loadingText = computed(() => store.state.loadingText || "加载中...");
const loadingProgress = computed(() => store.state.loadingProgress || 0);
const showLoadingProgress = computed(
  () => store.state.showLoadingProgress || false
);

// ✅ 新增：处理知识库弹窗打开
const handleOpenKnowledge = () => {
  showKnowledgeDialog.value = true;
  // 可选：同步到 Vuex（如果其他地方需要知道弹窗状态）
  store.commit("knowledge/SET_SHOW_KNOWLEDGE_DIALOG", true);
};

// ✅ 新增：处理知识库弹窗关闭
const handleCloseKnowledge = () => {
  showKnowledgeDialog.value = false;
  store.commit("knowledge/SET_SHOW_KNOWLEDGE_DIALOG", false);
};

// ✅ 监听 Vuex 中的弹窗状态变化（从其他地方触发）
watch(
  () => store.getters["knowledge/showKnowledgeDialog"],
  (newVal) => {
    showKnowledgeDialog.value = newVal;
  }
);

// 方法
const handleSaveGlobalSettings = (settings) => {
  store.dispatch("settings/updateSettings", settings);
  showGlobalSettings.value = false;
  ElMessage.success("全局设置已保存");
};

const clearGlobalError = () => {
  store.dispatch("clearError");
};

const minimizeApp = () => {
  if (window.electronAPI) {
    window.electronAPI.minimize();
  }
};

const toggleFullscreen = () => {
  if (window.electronAPI && window.electronAPI.toggleFullscreen) {
    window.electronAPI.toggleFullscreen();
  } else {
    const docElm = document.documentElement;
    if (!document.fullscreenElement) {
      docElm.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
};

const closeApp = () => {
  if (window.electronAPI) {
    window.electronAPI.close();
  } else {
    window.close();
  }
};

// 监听主题变化
watch(
  () => store.getters["settings/theme"],
  (newTheme) => {
    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  { immediate: true }
);

// 监听语言变化
watch(
  () => store.getters["settings/language"],
  (newLanguage) => {
    console.log("设置的语言标识", newLanguage);
    document.documentElement.setAttribute("lang", newLanguage);
  },
  { immediate: true }
);

// 全局键盘快捷键
const handleKeydown = (event) => {
  // Ctrl+K 打开知识库
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    handleOpenKnowledge();
  }

  // Ctrl+I 打开关于
  if ((event.ctrlKey || event.metaKey) && event.key === "i") {
    event.preventDefault();
    showAbout.value = true;
  }

  // Ctrl+, 打开设置
  if ((event.ctrlKey || event.metaKey) && event.key === ",") {
    event.preventDefault();
    showGlobalSettings.value = true;
  }

  // F11 全屏切换
  if (event.key === "F11") {
    event.preventDefault();
    if (window.electronAPI && window.electronAPI.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    }
  }

  // Esc 关闭弹窗
  if (event.key === "Escape") {
    showGlobalSettings.value = false;
    handleCloseKnowledge();
    showAbout.value = false;
  }
};

// 生命周期
onMounted(async () => {
  try {
    await store.dispatch("initializeApp");
    console.log("应用初始化完成");
  } catch (error) {
    console.error("应用初始化失败:", error);
    store.dispatch("showError", "应用初始化失败,请重启应用");
  }

  document.addEventListener("keydown", handleKeydown);
  document.title = "Multi Social Platform";

  const isFirstRun = !localStorage.getItem("app-initialized");
  if (isFirstRun) {
    localStorage.setItem("app-initialized", "true");
    ElMessage.success("欢迎使用 Multi Social Platform!");
  }
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// 监听应用焦点变化
window.addEventListener("focus", () => {});
window.addEventListener("blur", () => {});

// 监听在线状态
window.addEventListener("online", () => {
  ElMessage.success("网络连接已恢复");
});

window.addEventListener("offline", () => {
  ElMessage.warning("网络连接已断开");
});

// 自动锁定相关逻辑
let lockTimeout;
function getAutoLockTime() {
  return store.getters["settings/securitySettings"].autoLockTime;
}

function isAppLockEnabled() {
  return store.getters["settings/securitySettings"].appLock === true;
}

function getlockkey() {
  return store.getters["settings/securitySettings"].password;
}

async function resetLockTimer() {
  if (!isAppLockEnabled()) {
    clearTimeout(lockTimeout);
    return;
  }
  console.log("当前设置的密码为:" + getlockkey());
  clearTimeout(lockTimeout);
  const minutes = getAutoLockTime();
  console.log(`自动锁定将在 ${minutes} 分钟后触发`);
  lockTimeout = setTimeout(() => {
    window.electronAPI.triggerAppLock();
    ElMessage.warning("已锁定应用程序");
  }, minutes * 60 * 1000);
}

function bindLockEvents() {
  if (isAppLockEnabled()) {
    document.addEventListener("mousemove", resetLockTimer);
    document.addEventListener("keydown", resetLockTimer);
  } else {
    document.removeEventListener("mousemove", resetLockTimer);
    document.removeEventListener("keydown", resetLockTimer);
  }
}

store.watch(
  (state, getters) => getters["settings/securitySettings"].appLock,
  (newVal) => {
    bindLockEvents();
    if (newVal) {
      resetLockTimer();
    } else {
      clearTimeout(lockTimeout);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* 样式保持不变 */
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color-page);
  font-family: var(--font-family-primary);
}

.app-header {
  height: 40px;
  background: #333;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  -webkit-app-region: drag;
  z-index: 1000;
  border-bottom: 1px solid #404040;
}

[data-theme="dark"] .app-header {
  background: #1a1a1a;
  border-bottom-color: #2c2c2c;
}

.title {
  font-weight: 600;
  font-size: 14px;
  user-select: none;
}

.header-controls {
  display: flex;
  gap: 5px;
  -webkit-app-region: no-drag;
}

.header-controls .el-button {
  width: 28px;
  height: 28px;
  padding: 0;
}

.app-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 自定义弹窗样式 */
.custom-dialog {
  margin: 0 !important;
}

.custom-dialog:not(.is-fullscreen) :deep(.el-dialog) {
  margin-top: 0 !important;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

.custom-dialog:not(.is-fullscreen) :deep(.el-dialog__header) {
  padding: 12px 20px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.custom-dialog:not(.is-fullscreen) :deep(.el-dialog__body) {
  padding: 0;
  flex: 1;
  overflow-y: auto;
  max-height: calc(100vh - 40px - 54px);
}

.custom-dialog.is-fullscreen :deep(.el-dialog) {
  margin: 0 !important;
  height: calc(100vh - 40px);
  top: 40px;
  display: flex;
  flex-direction: column;
}

.custom-dialog.is-fullscreen :deep(.el-dialog__header) {
  padding: 12px 20px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

.custom-dialog.is-fullscreen :deep(.el-dialog__body) {
  padding: 0;
  flex: 1;
  overflow-y: auto;
  height: calc(100vh - 40px - 54px);
}

.custom-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dialog-actions .el-button {
  margin: 0;
}

:deep(.knowledge-dialog .el-dialog__body),
:deep(.about-dialog .el-dialog__body) {
  background: var(--el-bg-color);
}

[data-theme="dark"] .custom-dialog-header {
  color: #e0e0e0;
}

[data-theme="dark"] :deep(.el-dialog__header) {
  background: #1a1a1a;
  border-bottom-color: #2c2c2c;
}

[data-theme="dark"] :deep(.el-dialog__body) {
  background: #1a1a1a;
}

.global-error {
  position: fixed;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  min-width: 400px;
  max-width: 80vw;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .app-header {
    height: 48px;
    padding: 0 10px;
  }

  .title {
    font-size: 13px;
  }

  .header-controls .el-button {
    width: 32px;
    height: 32px;
  }

  .global-error {
    left: 10px;
    right: 10px;
    transform: none;
    min-width: auto;
    max-width: none;
  }

  .custom-dialog:not(.is-fullscreen) :deep(.el-dialog) {
    width: 95% !important;
  }
}
</style>
