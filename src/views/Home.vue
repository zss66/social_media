<template>
  <div class="home-container">
    <!-- 平台侧边栏 -->
    <PlatformSidebar
      :platforms="platforms"
      :active-containers="activeContainers"
      :active-tab="activeTab"
      @add-container="handleAddContainer"
      @select-container="handleSelectContainer"
      @remove-container="handleRemoveContainer"
      @reload-container="handleReloadContainer"
      @edit-container-settings="handleEditContainerSettings"
      class="sidebar"
    />

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 欢迎界面 -->
      <div v-if="activeContainers.length === 0" class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-icon">
            <el-icon size="64" color="#409EFF">
              <Monitor />
            </el-icon>
          </div>
          <h2>欢迎使用 Multi Social Platform</h2>
          <p>在左侧选择一个社交平台开始创建容器</p>

          <div class="quick-start">
            <h3>快速开始</h3>
            <div class="platform-grid">
              <div
                v-for="platform in popularPlatforms"
                :key="platform.id"
                class="platform-card"
                @click="handleAddContainer(platform)"
              >
                <img :src="'.' + platform.icon" :alt="platform.name" />
                <span>{{ platform.name }}</span>
              </div>
            </div>
          </div>

          <div class="feature-highlights">
            <div class="feature-item">
              <el-icon><Lock /></el-icon>
              <span>隐私保护</span>
            </div>
            <div class="feature-item">
              <el-icon><ChatDotRound /></el-icon>
              <span>智能翻译</span>
            </div>
            <div class="feature-item">
              <el-icon><DataLine /></el-icon>
              <span>自动回复</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 容器标签页 -->
      <div v-else class="container-tabs">
        <el-tabs
          v-model="activeTab"
          type="card"
          closable
          @tab-remove="handleTabRemove"
          @tab-click="handleTabClick"
        >
          <el-tab-pane
            v-for="container in activeContainers"
            :key="container.id"
            :label="container.name"
            :name="container.id"
          >
            <template #label>
              <div class="tab-label">
                <img
                  :src="container.platform.icon"
                  :alt="container.platform.name"
                  class="tab-icon"
                />
                <span>{{ container.name }}</span>
                <div
                  class="status-dot"
                  :class="container.status"
                  :title="getStatusText(container.status)"
                ></div>
              </div>
            </template>

            <ContainerView
              :container="container"
              :isreload="isreload"
              @focus-container="handleFocusContainer"
              @update-container="handleUpdateContainer"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 容器创建弹窗 -->
    <el-dialog
      v-model="showContainerConfig"
      :title="`创建 ${selectedPlatform?.name} 容器`"
      width="800px"
      :close-on-click-modal="false"
    >
      <ContainerConfig
        v-if="selectedPlatform"
        :platform="selectedPlatform"
        @confirm="handleConfirmContainer"
        @cancel="handlecancleContainer"
      />
    </el-dialog>

    <!-- 统计信息面板 -->
    <div class="stats-panel" v-if="showStats">
      <div class="stats-item">
        <div class="stats-number">{{ activeContainers.length }}</div>
        <div class="stats-label">活跃容器</div>
      </div>
      <div class="stats-item">
        <div class="stats-number">{{ platforms.length }}</div>
        <div class="stats-label">支持平台</div>
      </div>
      <div class="stats-item">
        <div class="stats-number">{{ readyContainers }}</div>
        <div class="stats-label">就绪容器</div>
      </div>
    </div>

    <!-- 浮动操作按钮 -->
    <div
      class="floating-actions"
      @mousedown="onMouseDown"
      :style="{ top: position.top + 'px', left: position.left + 'px' }"
    >
      <el-tooltip content="显示统计" placement="left">
        <el-button
          @click="showStats = !showStats"
          :icon="DataAnalysis"
          circle
          type="info"
        />
      </el-tooltip>

      <!-- <el-tooltip content="导入配置" placement="left">
        <el-button 
          @click="importContainers"
          :icon="Upload"
          circle
        />
      </el-tooltip>
      
      <el-tooltip content="导出配置" placement="left">
        <el-button 
          @click="exportContainers"
          :icon="Download"
          circle
        />
      </el-tooltip> -->
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
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  watch,
  onUnmounted,
  onActivated,
  onDeactivated,
} from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Monitor,
  Lock,
  ChatDotRound,
  DataLine,
  DataAnalysis,
  Upload,
  Download,
} from "@element-plus/icons-vue";
import PlatformSidebar from "@/components/PlatformSidebar.vue";
import ContainerView from "@/components/ContainerView.vue";
import ContainerConfig from "@/components/ContainerConfig.vue";
import ContainerSettings from "@/components/ContainerSettings.vue";

// 状态管理
const store = useStore();

// 响应式数据
const showSettings = ref(false);
const activeTab = ref("");
const showContainerConfig = ref(false);
const selectedPlatform = ref(null);
const showStats = ref(false);
const isreload = ref(false);
// 计算属性
const platforms = computed(() => store.getters["platforms/allPlatforms"]);
const activeContainers = computed(
  () => store.getters["containers/allContainers"] || []
);
const readyContainers = computed(
  () => activeContainers.value.filter((c) => c.status === "ready").length
);
// 计算属性
const container = computed(() => {
  const containerId = activeTab.value;
  return store.getters["containers/containerById"](containerId);
});
// 热门平台（用于快速开始）
const popularPlatforms = computed(() => {
  const popularIds = ["whatsapp", "telegram", "wechat", "discord"];
  return platforms.value.filter((p) => popularIds.includes(p.id));
}); // 方法
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
defineOptions({
  name: "Home",
});
// 🔥 新增：activated 钩子 - 组件被激活时调用（从缓存中恢复）
onActivated(() => {
  console.log("[Home] 组件已激活 - 从其他路由返回");

  // 可选：刷新容器状态（如果需要的话）
  // 注意：webview 不会重新加载，只是更新状态
  // store.dispatch('containers/refreshContainerStatus')

  // 可选：检查是否有需要更新的容器
  activeContainers.value.forEach((container) => {
    if (container.status === "loading") {
      console.log(`检测到容器 ${container.name} 处于加载状态`);
    }
  });
});

// 🔥 新增：deactivated 钩子 - 组件被停用时调用（切换到其他路由）
onDeactivated(() => {
  console.log("[Home] 组件已停用 - 切换到其他路由");

  // 可选：保存当前状态
  // localStorage.setItem('lastActiveTab', activeTab.value)

  // 注意：不要在这里销毁 webview 或重置状态
  // keep-alive 会保持组件实例，包括所有的 webview
});
const getStatusText = (status) => {
  const statusMap = {
    created: "已创建",
    loading: "加载中",
    ready: "就绪",
    error: "错误",
    disconnected: "已断开",
  };
  return statusMap[status] || "未知";
};

// 处理添加容器
const handleAddContainer = (platform) => {
  selectedPlatform.value = platform;
  showContainerConfig.value = true;
};
const handleReloadContainer = async (containerId) => {
  ElMessage.info("正在重新加载容器...");
  isreload.value = true;
  await store.dispatch("containers/reloadContainer", containerId);
  ElMessage.success("容器已重新加载");
};
const handleEditContainerSettings = async (containerId) => {
  showSettings.value = true;
};
const handleUpdateContainer = (containerId, updates) => {
  store.dispatch("containers/updateContainer", { id: containerId, updates });
};
const handleFocusContainer = (containerId) => {
  console.log(`[Parent] 聚焦到容器: ${containerId}`);

  // 切换到对应的标签
  activeTab.value = containerId;

  // 确保窗口可见和聚焦（如果需要的话）
  if (window.electronAPI?.focusWindow) {
    window.electronAPI.focusWindow();
  }
};
const handleSaveSettings = (settings) => {
  console.log("Saving container settings:", settings);
  if (container.value) {
    handleUpdateContainer(container.value.id, { config: settings });
    showSettings.value = false;
    ElMessage.success("容器设置已保存");
  }
};
const handlecancleSettings = () => {
  showSettings.value = false;
};
const handlecancleContainer = () => {
  showContainerConfig.value = false;
  selectedPlatform.value = null;
};
// 确认创建容器
const handleConfirmContainer = async (config) => {
  console.log("正在创建容器...");
  try {
    const containerData = {
      id: generateId(),
      platformId: selectedPlatform.value.id,
      name: config.name || `${selectedPlatform.value.name} - ${Date.now()}`,
      platform: selectedPlatform.value,
      config: config,
      url: selectedPlatform.value.url,
      status: "created",
      features: {
        translation: config.enableTranslation || false,
        autoReply: config.enableAutoReply || false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("传递的容器数据", containerData);
    await store.dispatch("containers/createContainer", containerData);
    console.log("容器数据传递完成");

    activeTab.value = containerData.id;
    handlecancleContainer();
  } catch (error) {
    ElMessage.error(`创建容器失败: ${error.message}`);
  }
};

// 选择容器
const handleSelectContainer = (containerId) => {
  activeTab.value = containerId;
};

// 移除容器
const handleRemoveContainer = async (containerId) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个容器吗？所有数据将被清除。",
      "确认删除",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await store.dispatch("containers/removeContainer", containerId);

    // 如果删除的是当前活跃标签，切换到其他标签
    if (activeTab.value === containerId) {
      const remainingContainers = activeContainers.value.filter(
        (c) => c.id !== containerId
      );
      activeTab.value =
        remainingContainers.length > 0 ? remainingContainers[0].id : "";
    }

    ElMessage.success("容器已删除");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(`删除容器失败: ${error.message}`);
    }
  }
};

// 处理标签页移除
const handleTabRemove = (containerId) => {
  handleRemoveContainer(containerId);
};

// 处理标签页点击
const handleTabClick = (tab) => {
  const container = activeContainers.value.find((c) => c.id === tab.props.name);
  if (container) {
    // 可以在这里添加标签页点击的逻辑
  }
};

// 导入容器配置
const importContainers = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await store.dispatch("containers/importContainers", file);
        ElMessage.success("容器配置导入成功");
      } catch (error) {
        ElMessage.error(`导入失败: ${error.message}`);
      }
    }
  };
  input.click();
};

// 导出容器配置
const exportContainers = async () => {
  try {
    await store.dispatch("containers/exportContainers");
    ElMessage.success("容器配置已导出");
  } catch (error) {
    ElMessage.error(`导出失败: ${error.message}`);
  }
};

watch(
  activeContainers,
  (newContainers, oldContainers) => {
    // 处理 oldContainers 为 undefined 的情况
    const oldArray = oldContainers || [];

    if (newContainers.length > oldArray.length) {
      const newContainer = newContainers.find(
        (c) => !oldArray.some((oc) => oc.id === c.id)
      );
      if (newContainer) {
        activeTab.value = newContainer.id;
      }
    }
  },
  { immediate: true }
);

// 组件挂载时的逻辑
onMounted(async () => {
  // 加载平台和容器数据
  await store.dispatch("platforms/loadPlatforms");
  await store.dispatch("containers/loadContainers");
  console.log("activeContainers", activeContainers.value);
  console.log("platforms", platforms.value);
  // 如果有容器，设置第一个为活跃状态
  if (activeContainers.value.length > 0) {
    activeTab.value = activeContainers.value[0].id;
  }

  // 显示使用提示
  const hasShownTip = localStorage.getItem("home-tip-shown");
  if (!hasShownTip && activeContainers.value.length === 0) {
    setTimeout(() => {
      ElMessage.info("点击左侧平台图标创建您的第一个容器！");
      localStorage.setItem("home-tip-shown", "true");
    }, 1000);
  }
});
const position = reactive({ left: 200, top: 45 });
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

const onMouseDown = (e) => {
  isDragging = true;
  offsetX = e.clientX - position.left;
  offsetY = e.clientY - position.top;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (e) => {
  if (!isDragging) return;
  position.left = e.clientX - offsetX;
  position.top = e.clientY - offsetY;
};

const onMouseUp = () => {
  isDragging = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};

// 防止组件卸载后监听器未移除
onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
.home-container {
  height: 100%;
  display: flex;
  background: var(--bg-color);
  position: relative;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color-light);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 欢迎界面 */
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

[data-theme="dark"] .welcome-screen {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  margin-bottom: 24px;
}

.welcome-content h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 16px;
}

.welcome-content p {
  font-size: 16px;
  color: var(--text-color-regular);
  margin-bottom: 40px;
}

.quick-start {
  margin-bottom: 40px;
}

.quick-start h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin-bottom: 20px;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

[data-theme="dark"] .platform-card {
  background: #3c3c3c;
}

.platform-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.platform-card img {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  border-radius: 6px;
}

.platform-card span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-primary);
}

.feature-highlights {
  display: flex;
  justify-content: center;
  gap: 32px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.feature-item .el-icon {
  font-size: 24px;
  color: var(--color-primary);
}

.feature-item span {
  font-size: 14px;
  color: var(--text-color-regular);
}

/* 容器标签页 */
.container-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.container-tabs :deep(.el-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.container-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.container-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 4px;
}

.status-dot.created {
  background-color: #909399;
}

.status-dot.loading {
  background-color: #e6a23c;
  animation: pulse 1.5s infinite;
}

.status-dot.ready {
  background-color: #67c23a;
}

.status-dot.error {
  background-color: #f56c6c;
}

.status-dot.disconnected {
  background-color: #c0c4cc;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 统计面板 */
.stats-panel {
  position: fixed;
  top: 60px;
  right: 20px;
  display: flex;
  gap: 16px;
  z-index: 100;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.stats-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 80px;
}

[data-theme="dark"] .stats-item {
  background: #2c2c2c;
}

.stats-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.stats-label {
  font-size: 12px;
  color: var(--text-color-secondary);
}

/* 浮动操作按钮 */
.floating-actions {
  position: fixed;
  cursor: move;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
}

.floating-actions .el-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--border-color-light);
  }

  .welcome-screen {
    padding: 20px;
  }

  .welcome-content h2 {
    font-size: 24px;
  }

  .platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .feature-highlights {
    flex-direction: column;
    gap: 16px;
  }

  .stats-panel {
    position: static;
    margin: 16px;
    justify-content: center;
  }

  .floating-actions {
    bottom: 16px;
    right: 16px;
    flex-direction: row;
  }

  .floating-actions .el-button {
    width: 40px;
    height: 40px;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .platform-card {
    border: 2px solid var(--border-color-base);
  }

  .stats-item {
    border: 2px solid var(--border-color-base);
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .platform-card,
  .floating-actions .el-button {
    transition: none;
  }

  .platform-card:hover {
    transform: none;
  }

  .status-dot.loading {
    animation: none;
  }

  .stats-panel {
    animation: none;
  }
}
</style>
