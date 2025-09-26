<template>
  <div id="app" class="app-container">
    <!-- 应用头部 -->
    <div class="app-header">
      <div class="title">Multi Social Platform</div>
      <div class="header-controls">
  <el-button @click="showGlobalSettings = true" :icon="Setting" circle />
  <el-button @click="minimizeApp" :icon="Minus" circle />
  <el-button @click="toggleFullscreen" :icon="FullScreen" circle />
  <el-button @click="closeApp" :icon="Close" circle type="danger" />
</div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="app-body">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </div>
    
    <!-- 全局设置弹窗 -->
    <el-dialog v-model="showGlobalSettings" title="全局设置" width="600px">
      <GlobalSettings :showGlobalSettings="showGlobalSettings" @save="handleSaveGlobalSettings" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Setting, Minus, Close,FullScreen  } from '@element-plus/icons-vue'
import GlobalSettings from '@/components/GlobalSettings.vue'
import Loading from '@/components/Loading.vue'

// 组合式API
const store = useStore()
const router = useRouter()

// 响应式数据
const showGlobalSettings = ref(false)

// 计算属性
const globalLoading = computed(() => store.getters.isLoading)
const globalError = computed(() => store.getters.currentError)
const loadingText = computed(() => store.state.loadingText || '加载中...')
const loadingProgress = computed(() => store.state.loadingProgress || 0)
const showLoadingProgress = computed(() => store.state.showLoadingProgress || false)

// 方法
const handleSaveGlobalSettings = (settings) => {
  store.dispatch('settings/updateSettings', settings)
  showGlobalSettings.value = false
  ElMessage.success('全局设置已保存')
}

const clearGlobalError = () => {
  store.dispatch('clearError')
}

const minimizeApp = () => {
  if (window.electronAPI) {
    window.electronAPI.minimize()
  }
}
const toggleFullscreen = () => {
  if (window.electronAPI && window.electronAPI.toggleFullscreen) {
    window.electronAPI.toggleFullscreen()
  } else {
    const docElm = document.documentElement
    if (!document.fullscreenElement) {
      docElm.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }
}
const closeApp = () => {
  if (window.electronAPI) {
    window.electronAPI.close()
  } else {
    window.close()
  }
}

// 监听主题变化
watch(
  () => store.getters['settings/theme'],
  (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  { immediate: true }
)

// 监听语言变化
watch(
  () => store.getters['settings/language'],
  (newLanguage) => {
    console.log('设置的语言标识', newLanguage)
    // 这里可以实现语言切换逻辑
    document.documentElement.setAttribute('lang', newLanguage)
  },
  { immediate: true }
)

// 全局键盘快捷键
const handleKeydown = (event) => {
  // Ctrl+S 保存
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    // 触发当前页面的保存操作
  }
  
  // Ctrl+, 打开设置
  if ((event.ctrlKey || event.metaKey) && event.key === ',') {
    event.preventDefault()
    showGlobalSettings.value = true
  }
  
  // F11 全屏切换
  if (event.key === 'F11') {
    event.preventDefault()
    if (window.electronAPI && window.electronAPI.toggleFullscreen) {
      window.electronAPI.toggleFullscreen()
    }
  }
  
  // Esc 关闭弹窗
  if (event.key === 'Escape') {
    showGlobalSettings.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 初始化应用
  try {
    await store.dispatch('initializeApp')
    console.log('应用初始化完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
    store.dispatch('showError', '应用初始化失败，请重启应用')
  }
  
  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeydown)
  
  // 设置应用标题
  document.title = 'Multi Social Platform'
  
  // 如果是首次运行，显示欢迎信息
  const isFirstRun = !localStorage.getItem('app-initialized')
  if (isFirstRun) {
    localStorage.setItem('app-initialized', 'true')
    ElMessage.success('欢迎使用 Multi Social Platform！')
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 监听应用焦点变化
window.addEventListener('focus', () => {
  // 应用获得焦点时的逻辑
})

window.addEventListener('blur', () => {
  // 应用失去焦点时的逻辑
})

// 监听在线状态
window.addEventListener('online', () => {
  ElMessage.success('网络连接已恢复')
})

window.addEventListener('offline', () => {
  ElMessage.warning('网络连接已断开')
})
let lockTimeout
function getAutoLockTime() {
  return store.getters['settings/securitySettings'].autoLockTime
}

function isAppLockEnabled() {
  return store.getters['settings/securitySettings'].appLock === true
}
function getlockkey() {
  return store.getters['settings/securitySettings'].password
} 

async function resetLockTimer() {
  // 如果应用锁没开启，清除计时器直接返回
  if (!isAppLockEnabled()) {
    clearTimeout(lockTimeout)
    return
  }
  console.log('当前设置的密码为：' + getlockkey())
  clearTimeout(lockTimeout)
  const minutes = getAutoLockTime()
  console.log(`自动锁定将在 ${minutes} 分钟后触发`)
  lockTimeout = setTimeout(() => {
    window.electronAPI.triggerAppLock()
    ElMessage.warning('已锁定应用程序')
  }, minutes * 60 * 1000)
}

// 只有在应用锁启用时才监听事件，防止无效监听
function bindLockEvents() {
  if (isAppLockEnabled()) {
    document.addEventListener('mousemove', resetLockTimer)
    document.addEventListener('keydown', resetLockTimer)
  } else {
    document.removeEventListener('mousemove', resetLockTimer)
    document.removeEventListener('keydown', resetLockTimer)
  }
}

// 监听 appLock 设置变化，动态绑定或解绑事件
store.watch(
  (state, getters) => getters['settings/securitySettings'].appLock,
  (newVal) => {
    bindLockEvents()
    if (newVal) {
      resetLockTimer()
    } else {
      clearTimeout(lockTimeout)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
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

.global-error {
  position: fixed;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  min-width: 400px;
  max-width: 80vw;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
:deep(.el-scrollbar__wrap) {
  scrollbar-width: thin;
  scrollbar-color: var(--el-border-color-light) transparent;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb) {
  background-color: var(--el-border-color-light);
  border-radius: 3px;
}

:deep(.el-scrollbar__wrap::-webkit-scrollbar-thumb:hover) {
  background-color: var(--el-border-color);
}

/* 响应式设计 */
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
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .app-header {
    border: 2px solid currentColor;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>