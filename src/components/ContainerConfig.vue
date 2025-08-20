<template>
  <div class="container-config">
    <el-form 
      ref="formRef" 
      :model="config" 
      :rules="rules" 
      label-width="120px"
    >
      <!-- 基本信息 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><User /></el-icon>
            基本信息
          </div>
        </template>
        
        <el-form-item label="容器名称" prop="name">
          <el-input 
            v-model="config.name" 
            placeholder="为这个容器起个名字"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="平台信息">
          <div class="platform-info">
            <img :src="platform.icon" :alt="platform.name" class="platform-icon" />
            <div>
              <div class="platform-name">{{ platform.name }}</div>
              <div class="platform-url">{{ platform.url }}</div>
            </div>
          </div>
        </el-form-item>
      </el-card>
      
      <!-- 代理设置 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Link /></el-icon>
            代理设置
          </div>
        </template>
        
        <el-form-item label="启用代理">
          <el-switch v-model="config.proxy.enabled" />
        </el-form-item>
        
        <template v-if="config.proxy.enabled">
          <el-form-item label="代理类型" prop="proxy.type">
            <el-select v-model="config.proxy.type" placeholder="选择代理类型">
              <el-option label="HTTP" value="http" />
              <el-option label="HTTPS" value="https" />
              <el-option label="SOCKS4" value="socks4" />
              <el-option label="SOCKS5" value="socks5" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="代理地址" prop="proxy.host">
            <el-input v-model="config.proxy.host" placeholder="127.0.0.1" />
          </el-form-item>
          
          <el-form-item label="代理端口" prop="proxy.port">
            <el-input-number 
              v-model="config.proxy.port" 
              :min="1" 
              :max="65535"
              placeholder="8080"
            />
          </el-form-item>
          
          <el-form-item label="用户名">
            <el-input 
              v-model="config.proxy.username" 
              placeholder="如需认证请填写用户名"
              clearable
            />
          </el-form-item>
          
          <el-form-item label="密码">
            <el-input 
              v-model="config.proxy.password" 
              type="password" 
              placeholder="如需认证请填写密码"
              clearable
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button @click="testProxy" :loading="proxyTesting" size="small">
              测试代理连接
            </el-button>
          </el-form-item>
        </template>
      </el-card>
      
      <!-- 浏览器指纹设置 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Monitor /></el-icon>
            浏览器指纹
          </div>
        </template>
        
        <el-form-item label="启用指纹伪装">
          <el-switch v-model="config.fingerprint.enabled" />
        </el-form-item>
        
        <template v-if="config.fingerprint.enabled">
          <el-form-item label="预设模板">
            <el-select 
              v-model="config.fingerprint.template" 
              placeholder="选择预设模板"
              @change="applyFingerprintTemplate"
            >
              <el-option label="Windows Chrome" value="windows-chrome" />
              <el-option label="macOS Safari" value="macos-safari" />
              <el-option label="Linux Firefox" value="linux-firefox" />
              <el-option label="Android Chrome" value="android-chrome" />
              <el-option label="iOS Safari" value="ios-safari" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="User Agent">
            <el-input 
              v-model="config.fingerprint.userAgent" 
              type="textarea" 
              :rows="3"
              placeholder="浏览器User Agent字符串"
            />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="屏幕分辨率">
                <el-select v-model="config.fingerprint.screenResolution">
                  <el-option label="1920x1080" value="1920x1080" />
                  <el-option label="1366x768" value="1366x768" />
                  <el-option label="1536x864" value="1536x864" />
                  <el-option label="1440x900" value="1440x900" />
                  <el-option label="2560x1440" value="2560x1440" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="时区">
                <el-select v-model="config.fingerprint.timezone">
                  <el-option label="Asia/Shanghai" value="Asia/Shanghai" />
                  <el-option label="America/New_York" value="America/New_York" />
                  <el-option label="Europe/London" value="Europe/London" />
                  <el-option label="Asia/Tokyo" value="Asia/Tokyo" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="语言设置">
            <el-select v-model="config.fingerprint.language" multiple>
              <el-option label="中文 (zh-CN)" value="zh-CN" />
              <el-option label="英语 (en-US)" value="en-US" />
              <el-option label="日语 (ja-JP)" value="ja-JP" />
              <el-option label="韩语 (ko-KR)" value="ko-KR" />
            </el-select>
          </el-form-item>
        </template>
      </el-card>
      
      <!-- 功能设置 -->
      <el-card class="config-section" shadow="never">
        <template #header>
          <div class="section-header">
            <el-icon><Tools /></el-icon>
            功能设置
          </div>
        </template>
        
        <el-form-item label="启用翻译功能">
          <el-switch v-model="config.enableTranslation" />
        </el-form-item>
        
        <el-form-item label="启用自动回复">
          <el-switch v-model="config.enableAutoReply" />
        </el-form-item>
        
        <template v-if="config.enableAutoReply">
          <el-form-item label="自动回复内容">
            <el-input 
              v-model="config.autoReplyMessage" 
              type="textarea" 
              :rows="3"
              placeholder="设置自动回复的消息内容"
            />
          </el-form-item>
          
          <el-form-item label="回复延迟">
            <el-input-number 
              v-model="config.autoReplyDelay" 
              :min="1" 
              :max="60"
              placeholder="回复延迟时间（秒）"
            />
            <span class="input-suffix">秒</span>
          </el-form-item>
        </template>
        
        <el-form-item label="启用消息通知">
          <el-switch v-model="config.enableNotification" />
        </el-form-item>
        
        <el-form-item label="启用消息记录">
          <el-switch v-model="config.enableLogging" />
        </el-form-item>
      </el-card>
    </el-form>
    
    <div class="config-actions">
      <el-button @click="cancel">取消</el-button>
      <el-button @click="resetConfig" type="info">重置</el-button>
      <el-button @click="saveAsTemplate" type="success">保存为模板</el-button>
      <el-button @click="confirmConfig" type="primary" :loading="confirming">
        确认创建
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted,watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Link, Monitor, Tools } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  platform: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['confirm', 'cancel'])

// 响应式数据
const formRef = ref()
const proxyTesting = ref(false)
const confirming = ref(false)

const config = reactive({
  name: '',
  id:props.platform.id,
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
    template: 'windows-chrome',
    userAgent: '',
    screenResolution: '1920x1080',
    timezone: 'Asia/Shanghai',
    language: ['zh-CN']
  },
  enableTranslation: true,
  enableAutoReply: false,
  autoReplyMessage: '您好，我现在不在线，稍后会回复您。',
  autoReplyDelay: 3,
  enableNotification: true,
  enableLogging: true
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入容器名称', trigger: 'blur' }
  ],
  'proxy.host': [
    { required: true, message: '请输入代理地址', trigger: 'blur' }
  ],
  'proxy.port': [
    { required: true, message: '请输入代理端口', trigger: 'blur' }
  ]
}

// 浏览器指纹模板
const fingerprintTemplates = {
  'windows-chrome': {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    screenResolution: '1920x1080',
    timezone: 'Asia/Shanghai',
    language: ['zh-CN', 'en-US']
  },
  'macos-safari': {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    screenResolution: '2560x1440',
    timezone: 'America/New_York',
    language: ['en-US']
  },
  'linux-firefox': {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    screenResolution: '1920x1080',
    timezone: 'Europe/London',
    language: ['en-US']
  },
  'android-chrome': {
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    screenResolution: '1080x2340',
    timezone: 'Asia/Shanghai',
    language: ['zh-CN']
  },
  'ios-safari': {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    screenResolution: '1170x2532',
    timezone: 'America/New_York',
    language: ['en-US']
  }
}

// 方法
const applyFingerprintTemplate = (template) => {
  if (template && fingerprintTemplates[template]) {
    const templateData = fingerprintTemplates[template]
    Object.assign(config.fingerprint, templateData)
  }
}

const testProxy = async () => {
  proxyTesting.value = true
  try {
    // 模拟代理测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('代理连接测试成功')
  } catch (error) {
    ElMessage.error('代理连接测试失败')
  } finally {
    proxyTesting.value = false
  }
}

const resetConfig = () => {
  // 重置配置到默认值
  Object.assign(config, {
    name: '',
    id:props.platform.id,
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
      template: 'windows-chrome',
      userAgent: '',
      screenResolution: '1920x1080',
      timezone: 'Asia/Shanghai',
      language: ['zh-CN']
    },
    enableTranslation: true,
    enableAutoReply: false,
    autoReplyMessage: '您好，我现在不在线，稍后会回复您。',
    autoReplyDelay: 3,
    enableNotification: true,
    enableLogging: true
  })
  
  // 应用默认指纹模板
  applyFingerprintTemplate('windows-chrome')
  
  ElMessage.info('配置已重置')
}

const saveAsTemplate = () => {
  const templates = JSON.parse(localStorage.getItem('containerTemplates') || '[]')
  const template = {
    id: Date.now(),
    name: config.name || '自定义模板',
    platformId: props.platform.id,
    config: { ...config },
    createdAt: new Date().toISOString()
  }
  
  templates.push(template)
  localStorage.setItem('containerTemplates', JSON.stringify(templates))
  
  ElMessage.success('模板保存成功')
}
const cancel = () => {
  emit('cancel')
}
const confirmConfig = async () => {
  try {
    await formRef.value.validate()
    confirming.value = true
    
    // 模拟创建过程
    console.log('正在创建容器...')
    
    emit('confirm', { ...config })
    console.log('创建容器的数据已经传输完成')

  } catch (error) {
    ElMessage.error('请检查表单配置')
  } finally {
    confirming.value = false
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 设置默认容器名称
  config.name = `${props.platform.name} - ${new Date().toLocaleString()}`
  
  // 应用默认指纹模板
  applyFingerprintTemplate('windows-chrome')
})
watch(
  () => props.platform,
  (newPlatform) => {
    if (newPlatform && newPlatform.name) {
      config.name = `${newPlatform.name} - ${new Date().toLocaleString()}`
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.container-config {
  max-height: 70vh;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
}

.platform-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
}

.platform-name {
  font-weight: 500;
  color: #333;
}

.platform-url {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.input-suffix {
  margin-left: 8px;
  color: #666;
  font-size: 14px;
}

.config-actions {
  padding: 20px 0;
  text-align: right;
  border-top: 1px solid #eee;
  margin-top: 20px;
}

.config-actions .el-button {
  margin-left: 10px;
}

/* 自定义滚动条 */
.container-config::-webkit-scrollbar {
  width: 6px;
}

.container-config::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.container-config::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.container-config::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>