<template>
  <div class="about-page">
    <div class="about-container">
      <!-- 应用信息卡片 -->
      <el-card class="app-info-card" shadow="hover">
        <div class="app-header">
          <div class="app-icon">
            <img src="/icons/app-icon.png" alt="Multi Social Platform" />
          </div>
          <div class="app-details">
            <h1 class="app-title">Multi Social Platform</h1>
            <p class="app-subtitle">多平台社交管理器</p>
            <div class="app-version">
              <el-tag type="primary">v{{ appVersion }}</el-tag>
              <el-tag type="success" v-if="isLatestVersion">最新版本</el-tag>
              <el-tag type="warning" v-else>有新版本可用</el-tag>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="app-description">
          <p>
            Multi Social Platform 是一个基于 Electron 和 Vue.js 开发的多平台社交软件管理器。
            它允许您同时运行多个社交平台的实例，每个实例都有独立的代理设置、浏览器指纹伪装，
            并内置翻译和自动回复功能。
          </p>
        </div>
      </el-card>
      
      <!-- 功能特性 -->
      <el-card class="features-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Star /></el-icon>
            <span>主要特性</span>
          </div>
        </template>
        
        <div class="features-grid">
          <div class="feature-item" v-for="feature in features" :key="feature.id">
            <div class="feature-icon">
              <el-icon :size="24" :color="feature.color">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <div class="feature-content">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 系统信息 -->
      <el-card class="system-info-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Monitor /></el-icon>
            <span>系统信息</span>
          </div>
        </template>
        
        <div class="system-info-grid">
          <div class="info-item">
            <label>操作系统</label>
            <span>{{ systemInfo.os }}</span>
          </div>
          <div class="info-item">
            <label>应用架构</label>
            <span>{{ systemInfo.arch }}</span>
          </div>
          <div class="info-item">
            <label>Node.js 版本</label>
            <span>{{ systemInfo.nodeVersion }}</span>
          </div>
          <div class="info-item">
            <label>Electron 版本</label>
            <span>{{ systemInfo.electronVersion }}</span>
          </div>
          <div class="info-item">
            <label>Chrome 版本</label>
            <span>{{ systemInfo.chromeVersion }}</span>
          </div>
          <div class="info-item">
            <label>Vue.js 版本</label>
            <span>{{ systemInfo.vueVersion }}</span>
          </div>
        </div>
      </el-card>
      
      <!-- 统计信息 -->
      <el-card class="stats-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>使用统计</span>
          </div>
        </template>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ stats.totalContainers }}</div>
            <div class="stat-label">总容器数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.activeContainers }}</div>
            <div class="stat-label">活跃容器</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.totalPlatforms }}</div>
            <div class="stat-label">支持平台</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ stats.uptime }}</div>
            <div class="stat-label">运行时间</div>
          </div>
        </div>
      </el-card>
      
      <!-- 开发团队 -->
      <el-card class="team-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>开发团队</span>
          </div>
        </template>
        
        <div class="team-content">
          <div class="team-member">
            <el-avatar :size="60" src="/avatars/developer.jpg">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <div class="member-info">
              <h3>开发者</h3>
              <p>全栈开发工程师</p>
              <div class="member-links">
                <el-button link @click="openLink('https://github.com/developer')">
                  <el-icon><Link /></el-icon>
                  GitHub
                </el-button>
                <el-button link @click="openLink('mailto:developer@example.com')">
                  <el-icon><Message /></el-icon>
                  联系
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 技术栈 -->
      <el-card class="tech-stack-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>技术栈</span>
          </div>
        </template>
        
        <div class="tech-stack">
          <div class="tech-category" v-for="category in techStack" :key="category.name">
            <h4>{{ category.name }}</h4>
            <div class="tech-items">
              <el-tag 
                v-for="tech in category.items" 
                :key="tech.name"
                :type="tech.type"
                class="tech-tag"
              >
                {{ tech.name }} {{ tech.version }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 许可证和链接 -->
      <el-card class="license-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>许可证与链接</span>
          </div>
        </template>
        
        <div class="license-content">
          <div class="license-info">
            <p>
              <strong>开源许可证:</strong> MIT License
            </p>
            <p>
              <strong>版权所有:</strong> © 2024 Multi Social Platform
            </p>
          </div>
          
          <el-divider />
          
          <div class="useful-links">
            <h4>相关链接</h4>
            <div class="links-grid">
              <el-button @click="openLink('https://github.com/project/multi-social-platform')" plain>
                <el-icon><Link /></el-icon>
                项目主页
              </el-button>
              <el-button @click="openLink('https://github.com/project/multi-social-platform/issues')" plain>
                <el-icon><Warning /></el-icon>
                问题反馈
              </el-button>
              <el-button @click="openLink('https://github.com/project/multi-social-platform/releases')" plain>
                <el-icon><Download /></el-icon>
                版本发布
              </el-button>
              <el-button @click="openLink('https://docs.example.com')" plain>
                <el-icon><Document /></el-icon>
                使用文档
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
      
      <!-- 更新检查 -->
      <el-card class="update-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Refresh /></el-icon>
            <span>更新检查</span>
          </div>
        </template>
        
        <div class="update-content">
          <div class="update-status">
            <el-icon v-if="updateStatus === 'checking'" class="is-loading"><Loading /></el-icon>
            <el-icon v-else-if="updateStatus === 'available'" color="#E6A23C"><Warning /></el-icon>
            <el-icon v-else-if="updateStatus === 'error'" color="#F56C6C"><Close /></el-icon>
            <el-icon v-else color="#67C23A"><Select /></el-icon>
            
            <span class="update-text">{{ updateStatusText }}</span>
          </div>
          
          <div class="update-actions">
            <el-button @click="checkForUpdates" :loading="updateStatus === 'checking'">
              检查更新
            </el-button>
            <el-button 
              v-if="updateStatus === 'available'" 
              type="primary" 
              @click="downloadUpdate"
            >
              下载更新
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Star, 
  Monitor, 
  DataAnalysis, 
  User, 
  Setting, 
  Document, 
  Link, 
  Message, 
  UserFilled,
  Warning,
  Download,
  Refresh,
  Loading,
  Close,
  Select
} from '@element-plus/icons-vue'
import { getSystemInfo } from '@/utils/platform'

// 响应式数据
const appVersion = ref('1.0.0')
const isLatestVersion = ref(true)
const updateStatus = ref('latest') // 'checking', 'available', 'latest', 'error'

// 应用功能特性
const features = [
  {
    id: 1,
    icon: 'Monitor',
    title: '多容器管理',
    description: '同时运行多个社交平台实例，每个实例独立隔离',
    color: '#409EFF'
  },
  {
    id: 2,
    icon: 'Lock',
    title: '隐私保护',
    description: '独立代理设置和浏览器指纹伪装，保护用户隐私',
    color: '#67C23A'
  },
  {
    id: 3,
    icon: 'ChatDotRound',
    title: '智能翻译',
    description: '内置多种翻译服务，支持实时文本翻译',
    color: '#E6A23C'
  },
  {
    id: 4,
    icon: 'Robot',
    title: '自动回复',
    description: '可配置的智能自动回复功能，提高沟通效率',
    color: '#F56C6C'
  },
  {
    id: 5,
    icon: 'Bell',
    title: '消息通知',
    description: '桌面通知和声音提醒，不错过重要消息',
    color: '#909399'
  },
  {
    id: 6,
    icon: 'Setting',
    title: '高度可定制',
    description: '丰富的配置选项，满足不同用户需求',
    color: '#606266'
  }
]

// 系统信息
const systemInfo = reactive({
  os: '获取中...',
  arch: '获取中...',
  nodeVersion: '获取中...',
  electronVersion: '获取中...',
  chromeVersion: '获取中...',
  vueVersion: '获取中...'
})

// 使用统计
const stats = reactive({
  totalContainers: 0,
  activeContainers: 0,
  totalPlatforms: 10,
  uptime: '0天'
})

// 技术栈
const techStack = [
  {
    name: '前端框架',
    items: [
      { name: 'Vue.js', version: '3.3.0', type: 'success' },
      { name: 'Element Plus', version: '2.3.0', type: 'primary' },
      { name: 'Vue Router', version: '4.2.0', type: 'info' }
    ]
  },
  {
    name: '桌面应用',
    items: [
      { name: 'Electron', version: '25.0.0', type: 'warning' },
      { name: 'Node.js', version: '18.0.0', type: 'success' }
    ]
  },
  {
    name: '构建工具',
    items: [
      { name: 'Vue CLI', version: '5.0.0', type: 'primary' },
      { name: 'Webpack', version: '5.0.0', type: 'info' }
    ]
  }
]

// 计算属性
const updateStatusText = computed(() => {
  switch (updateStatus.value) {
    case 'checking':
      return '正在检查更新...'
    case 'available':
      return '发现新版本可用'
    case 'latest':
      return '当前版本是最新的'
    case 'error':
      return '检查更新失败'
    default:
      return '未知状态'
  }
})

// 方法
const openLink = (url) => {
  if (window.electronAPI && window.electronAPI.openExternal) {
    window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

const checkForUpdates = async () => {
  updateStatus.value = 'checking'
  
  try {
    // 模拟检查更新
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 这里应该调用实际的更新检查API
    const hasUpdate = Math.random() > 0.7 // 模拟30%概率有更新
    
    if (hasUpdate) {
      updateStatus.value = 'available'
      isLatestVersion.value = false
      ElMessage.info('发现新版本，建议更新')
    } else {
      updateStatus.value = 'latest'
      isLatestVersion.value = true
      ElMessage.success('当前版本是最新的')
    }
  } catch (error) {
    updateStatus.value = 'error'
    ElMessage.error('检查更新失败')
  }
}

const downloadUpdate = () => {
  ElMessage.info('正在下载更新...')
  // 这里应该实现实际的更新下载逻辑
}

const loadSystemInfo = () => {
  try {
    const info = getSystemInfo()
    
    systemInfo.os = `${info.os.platform} ${info.os.version || ''}`
    systemInfo.arch = info.device.platform || 'Unknown'
    
    if (window.nodeAPI && window.nodeAPI.versions) {
      systemInfo.nodeVersion = window.nodeAPI.versions.node || 'Unknown'
      systemInfo.electronVersion = window.nodeAPI.versions.electron || 'Unknown'
      systemInfo.chromeVersion = window.nodeAPI.versions.chrome || 'Unknown'
    }
    
    systemInfo.vueVersion = '3.3.0' // 从package.json获取
  } catch (error) {
    console.error('Failed to load system info:', error)
  }
}

const loadStats = () => {
  try {
    // 从store或localStorage获取统计数据
    const containers = JSON.parse(localStorage.getItem('app-containers') || '[]')
    stats.totalContainers = containers.length
    stats.activeContainers = containers.filter(c => c.status === 'ready').length
    
    // 计算运行时间
    const startTime = localStorage.getItem('app-start-time')
    if (startTime) {
      const uptime = Date.now() - parseInt(startTime)
      const days = Math.floor(uptime / (1000 * 60 * 60 * 24))
      stats.uptime = `${days}天`
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// 生命周期
onMounted(() => {
  loadSystemInfo()
  loadStats()
  
  // 如果没有启动时间记录，设置一个
  if (!localStorage.getItem('app-start-time')) {
    localStorage.setItem('app-start-time', Date.now().toString())
  }
})
</script>

<style scoped>
.about-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

[data-theme="dark"] .about-page {
  background: #1a1a1a;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.el-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.el-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

[data-theme="dark"] .card-header {
  color: #e0e0e0;
}

/* 应用信息卡片 */
.app-info-card {
  grid-column: 1 / -1;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.app-icon img {
  width: 80px;
  height: 80px;
  border-radius: 12px;
}

.app-details {
  flex: 1;
}

.app-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

[data-theme="dark"] .app-title {
  color: #e0e0e0;
}

.app-subtitle {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #606266;
}

.app-version {
  display: flex;
  gap: 8px;
}

.app-description {
  margin-top: 16px;
  line-height: 1.6;
  color: #606266;
}

/* 功能特性卡片 */
.features-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.feature-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

[data-theme="dark"] .feature-item {
  background: #2c2c2c;
}

.feature-item:hover {
  background: #e9ecef;
}

[data-theme="dark"] .feature-item:hover {
  background: #3c3c3c;
}

.feature-icon {
  flex-shrink: 0;
}

.feature-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
}

[data-theme="dark"] .feature-content h3 {
  color: #e0e0e0;
}

.feature-content p {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}

/* 系统信息卡片 */
.system-info-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

[data-theme="dark"] .info-item {
  background: #2c2c2c;
}

.info-item label {
  font-weight: 500;
  color: #606266;
}

.info-item span {
  color: #303133;
  font-family: 'Monaco', 'Courier New', monospace;
}

[data-theme="dark"] .info-item span {
  color: #e0e0e0;
}

/* 统计信息卡片 */
.stats-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

[data-theme="dark"] .stat-item {
  background: #2c2c2c;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

/* 开发团队卡片 */
.team-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

[data-theme="dark"] .team-member {
  background: #2c2c2c;
}

.member-info h3 {
  margin: 0 0 4px 0;
  color: #303133;
}

[data-theme="dark"] .member-info h3 {
  color: #e0e0e0;
}

.member-info p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.member-links {
  display: flex;
  gap: 8px;
}

/* 技术栈卡片 */
.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tech-category h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

[data-theme="dark"] .tech-category h4 {
  color: #e0e0e0;
}

.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  font-size: 12px;
}

/* 许可证卡片 */
.license-content {
  line-height: 1.6;
}

.license-info p {
  margin: 8px 0;
  color: #606266;
}

.useful-links h4 {
  margin: 0 0 12px 0;
  color: #303133;
}

[data-theme="dark"] .useful-links h4 {
  color: #e0e0e0;
}

.links-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}

/* 更新卡片 */
.update-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-text {
  color: #606266;
}

.update-actions {
  display: flex;
  gap: 8px;
}

/* 响应式 */
@media (max-width: 768px) {
  .about-container {
    grid-template-columns: 1fr;
    padding: 0 10px;
  }
  
  .app-header {
    flex-direction: column;
    text-align: center;
  }
  
  .features-grid,
  .system-info-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>