<template>
  <div class="container-settings">
    <el-form ref="formRef" :model="settings" v-if="props.container" label-width="120px">
      <!-- 基本信息 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><User /></el-icon>
            基本信息
          </div>
        </template>
        
        <el-form-item label="容器名称">
          <el-input v-model="settings.name" placeholder="容器名称" />
        </el-form-item>
        
        <el-form-item label="平台">
          <div class="platform-display">
            <img :src="container.platform.icon" :alt="container.platform.name" />
            <span>{{ container.platform.name }}</span>
          </div>
        </el-form-item>
        
        <el-form-item label="容器状态">
          <el-tag :type="getStatusType(container.status)">
            {{ getStatusText(container.status) }}
          </el-tag>
        </el-form-item>
        
        <el-form-item label="创建时间">
          <span>{{ formatDate(container.createdAt) }}</span>
        </el-form-item>
      </el-card>
      
      <!-- 代理设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Link /></el-icon>
            代理设置
          </div>
        </template>
        
        <el-form-item label="启用代理">
          <el-switch v-model="settings.proxy.enabled" />
        </el-form-item>
        
        <template v-if="settings.proxy.enabled">
          <el-form-item label="代理类型">
            <el-select v-model="settings.proxy.type">
              <el-option label="HTTP" value="http" />
              <el-option label="HTTPS" value="https" />
              <el-option label="SOCKS4" value="socks4" />
              <el-option label="SOCKS5" value="socks5" />
            </el-select>
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="16">
              <el-form-item label="代理地址">
                <el-input v-model="settings.proxy.host" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="端口" label-width="auto">
                <el-input-number 
                  v-model="settings.proxy.port" 
                  :min="1" 
                  :max="65535"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="16">
            <el-col :span="16">
              <el-form-item label="用户名">
                <el-input v-model="settings.proxy.username" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="密码" label-width="auto">
                <el-input 
                  v-model="settings.proxy.password" 
                  type="password" 
                  show-password 
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-card>
      
      <!-- 浏览器指纹 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Monitor /></el-icon>
            浏览器指纹
          </div>
        </template>
        
        <el-form-item label="启用指纹伪装">
          <el-switch v-model="settings.fingerprint.enabled" />
        </el-form-item>
        
        <template v-if="settings.fingerprint.enabled">
          <el-form-item label="User Agent">
            <el-input 
              v-model="settings.fingerprint.userAgent" 
              type="textarea" 
              :rows="2"
            />
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="屏幕分辨率">
                <el-select v-model="settings.fingerprint.screenResolution">
                  <el-option label="1920x1080" value="1920x1080" />
                  <el-option label="1366x768" value="1366x768" />
                  <el-option label="1536x864" value="1536x864" />
                  <el-option label="2560x1440" value="2560x1440" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时区">
                <el-select v-model="settings.fingerprint.timezone">
                  <el-option label="Asia/Shanghai" value="Asia/Shanghai" />
                  <el-option label="America/New_York" value="America/New_York" />
                  <el-option label="Europe/London" value="Europe/London" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="语言设置">
            <el-select v-model="settings.fingerprint.acceptLanguages" multiple>
              <el-option label="中文 (zh-CN)" value="zh-CN" />
              <el-option label="英语 (en-US)" value="en-US" />
              <el-option label="日语 (ja-JP)" value="ja-JP" />
              <el-option label="韩语 (ko-KR)" value="ko-KR" />
            </el-select>
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="WebGL Vendor">
                <el-input 
                  v-model="settings.fingerprint.webglVendor" 
                  placeholder="如 Google Inc."
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="WebGL Renderer">
                <el-input 
                  v-model="settings.fingerprint.webglRenderer" 
                  placeholder="如 ANGLE (NVIDIA GeForce GTX 1080)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-card>
      
      <!-- 功能设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Tools /></el-icon>
            功能设置
          </div>
        </template>
        
        <el-form-item label="翻译功能">
          <el-switch v-model="settings.enableTranslation" />
        </el-form-item>
        
        <el-form-item label="自动回复">
          <el-switch v-model="settings.enableAutoReply" />
        </el-form-item>
        
        <template v-if="settings.enableAutoReply">
          <el-form-item label="回复内容">
            <el-input 
              v-model="settings.autoReplyMessage" 
              type="textarea" 
              :rows="3"
            />
          </el-form-item>
          
          <el-form-item label="回复延迟">
            <el-input-number 
              v-model="settings.autoReplyDelay" 
              :min="1" 
              :max="60"
            />
            <span style="margin-left: 8px;">秒</span>
          </el-form-item>
        </template>
        
        <el-form-item label="消息通知">
          <el-switch v-model="settings.enableNotification" />
        </el-form-item>
        
        <el-form-item label="消息记录">
          <el-switch v-model="settings.enableLogging" />
        </el-form-item>
      </el-card>
      
      <!-- 高级设置 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Setting /></el-icon>
            高级设置
          </div>
        </template>
        
        <el-form-item label="启用开发者工具">
          <el-switch v-model="settings.enableDevTools" />
        </el-form-item>
        
        <el-form-item label="禁用图片加载">
          <el-switch v-model="settings.disableImages" />
          <div class="form-item-description">
            禁用图片加载可以节省流量和提高加载速度
          </div>
        </el-form-item>
        
        <el-form-item label="禁用JavaScript">
          <el-switch v-model="settings.disableJavaScript" />
          <div class="form-item-description">
            注意：禁用JavaScript可能导致网页功能异常
          </div>
        </el-form-item>
        
        <el-form-item label="自定义CSS">
          <el-input 
            v-model="settings.customCSS" 
            type="textarea" 
            :rows="4"
            placeholder="输入自定义CSS代码来修改网页样式"
          />
        </el-form-item>
        
        <el-form-item label="自定义JavaScript">
          <el-input 
            v-model="settings.customJS" 
            type="textarea" 
            :rows="4"
            placeholder="输入自定义JavaScript代码"
          />
        </el-form-item>
      </el-card>
      
      <!-- 数据管理 -->
      <el-card class="settings-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><FolderOpened /></el-icon>
            数据管理
          </div>
        </template>
        
        <el-form-item label="清理Cookie">
          <el-button @click="clearCookies" type="warning" plain size="small">
            清理Cookie
          </el-button>
          <div class="form-item-description">
            清理此容器的所有Cookie数据
          </div>
        </el-form-item>
        
        <el-form-item label="清理缓存">
          <el-button @click="clearCache" type="warning" plain size="small">
            清理缓存
          </el-button>
          <div class="form-item-description">
            清理此容器的所有缓存文件
          </div>
        </el-form-item>
        
        <el-form-item label="导出数据">
          <el-button @click="exportData" type="success" plain size="small">
            导出数据
          </el-button>
          <div class="form-item-description">
            导出容器配置和数据
          </div>
        </el-form-item>
        
        <el-form-item label="重置容器">
          <el-button @click="resetContainer" type="danger" plain size="small">
            重置容器
          </el-button>
          <div class="form-item-description">
            清理所有数据并重置容器到初始状态
          </div>
        </el-form-item>
      </el-card>
      
      <div class="settings-actions">
        <el-button @click="cancel">取消</el-button>
        <el-button @click="resetToDefault" type="info">重置</el-button>
        <el-button @click="applySettings" type="primary" :loading="applying">
          应用设置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { 
  User, 
  Link, 
  Monitor, 
  Tools, 
  Setting,
  FolderOpened
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  container: {
    type: Object,
    required: true
  },
  showSettings:{
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['save', 'cancel'])

// 响应式数据
const formRef = ref()
const applying = ref(false)

const settings = reactive({
  name: '',
  id: props.container.id,
  proxy: {
    enabled: false,
    type: 'http',
    host: '',
    port: 8080,
    username: '',
    password: ''
  },
  fingerprint: {
    enabled: false,
    userAgent: '',
    screenResolution: '1920x1080',
    timezone: 'Asia/Shanghai',
    acceptLanguages: ['zh-CN'],
    webglVendor: '',
    webglRenderer: ''
  },
  enableTranslation: true,
  enableAutoReply: false,
  autoReplyMessage: '',
  autoReplyDelay: 3,
  enableNotification: true,
  enableLogging: true,
  enableDevTools: false,
  disableImages: false,
  disableJavaScript: false,
  customCSS: '',
  customJS: ''
})

// 计算属性
const getStatusType = (status) => {
  const typeMap = {
    'created': 'info',
    'loading': 'warning',
    'ready': 'success',
    'error': 'danger',
    'disconnected': 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'created': '已创建',
    'loading': '加载中',
    'ready': '就绪',
    'error': '错误',
    'disconnected': '断开连接'
  }
  return textMap[status] || '未知'
}

const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 方法
const applySettings = async () => {
  applying.value = true
  try {
    // 模拟应用设置的延迟
    // await new Promise(resolve => setTimeout(resolve, 1000))
    emit('save', { ...settings })
    console.log(settings)
    ElMessage.success('设置已应用')
  } catch (error) {
    ElMessage.error('应用设置失败')
  } finally {
    applying.value = false
  }
}

const cancel = () => {
  emit('cancel')
}

const resetToDefault = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置设置吗？所有自定义配置将被清除。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置到默认值
    Object.assign(settings, {
      name: props.container.name,
      id: props.container.id,
      proxy: {
        enabled: false,
        type: 'http',
        host: '',
        port: 8080,
        username: '',
        password: ''
      },
      fingerprint: {
        enabled: false,
        userAgent: '',
        screenResolution: '1920x1080',
        timezone: 'Asia/Shanghai',
        acceptLanguages: ['zh-CN'],
        webglVendor: '',
        webglRenderer: ''
      },
      enableTranslation: true,
      enableAutoReply: false,
      autoReplyMessage: '',
      autoReplyDelay: 3,
      enableNotification: true,
      enableLogging: true,
      enableDevTools: false,
      disableImages: false,
      disableJavaScript: false,
      customCSS: '',
      customJS: ''
    })
    
    ElMessage.success('设置已重置')
  } catch {
    // 用户取消
  }
}

const clearCookies = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理此容器的所有Cookie吗？这将导致需要重新登录。',
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用清理Cookie的API
    ElMessage.success('Cookie已清理')
  } catch {
    // 用户取消
  }
}

const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清理此容器的所有缓存吗？',
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用清理缓存的API
    ElMessage.success('缓存已清理')
  } catch {
    // 用户取消
  }
}

const exportData = () => {
  const data = {
    container: props.container,
    settings: settings,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `container_${props.container.name}_${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据已导出')
}

const resetContainer = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置此容器吗？所有数据、登录状态和自定义设置都将被清除，此操作不可撤销！',
      '确认重置容器',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    // 这里应该调用重置容器的API
    ElMessage.success('容器已重置')
  } catch {
    // 用户取消
  }
}

watch(
  () => props.showSettings,
  (newshow) => {
    if (newshow) {
      const config = props.container.config || {}
      Object.assign(settings, JSON.parse(JSON.stringify(config)))
    }
  },
)

// 组件挂载时初始化设置
onMounted(() => {
  console.log('触发组件挂载')
  const config = props.container.config || {}
  Object.assign(settings, JSON.parse(JSON.stringify(config)))
  settings.name = props.container.name
})
</script>

<style scoped>
.container-settings {
  max-height: 70vh;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.platform-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.platform-display img {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.form-item-description {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  line-height: 1.4;
}

.settings-actions {
  padding: 20px 0;
  text-align: right;
  border-top: 1px solid #eee;
  margin-top: 20px;
  position: sticky;
  bottom: 0;
  background: white;
}

.settings-actions .el-button {
  margin-left: 10px;
}

/* 自定义滚动条 */
.container-settings::-webkit-scrollbar {
  width: 6px;
}

.container-settings::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.container-settings::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.container-settings::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>