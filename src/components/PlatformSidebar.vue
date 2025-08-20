<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>平台列表</h3>
    </div>
    
    <div class="platform-list">
      <div 
        v-for="platform in platforms" 
        :key="platform.id"
        class="platform-item"
      >
        <div class="platform-info">
          <img :src="platform.icon" :alt="platform.name" class="platform-icon" />
          <span class="platform-name">{{ platform.name }}</span>
          <el-badge 
            :value="getContainerCount(platform.id)" 
            :hidden="getContainerCount(platform.id) === 0"
            class="container-badge"
          />
        </div>
        
        <div class="platform-actions">
          <el-button 
            @click="$emit('add-container', platform)"
            size="small"
            type="primary"
            :icon="Plus"
            circle
          />
        </div>
        
        <!-- 该平台的容器列表 -->
        <div 
          v-if="getPlatformContainers(platform.id).length > 0" 
          class="container-list"
        >
          <div 
            v-for="container in getPlatformContainers(platform.id)"
            :key="container.id"
            class="container-item"
            :class="{ active: isActiveContainer(container.id) }"
            @click="$emit('select-container', container.id)"
          >
            <div class="container-info">
              <div class="container-name">{{ container.name }}</div>
              <div class="container-status" :class="container.status">
                <el-icon><CircleCheck /></el-icon>
                {{ getStatusText(container.status) }}
              </div>
            </div>
            
            <div class="container-actions">
              <el-dropdown @command="handleContainerAction" trigger="click">
                <el-button size="small" :icon="MoreFilled" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'reload', id: container.id }">
                      重新加载
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'settings', id: container.id }">
                      设置
                    </el-dropdown-item>
                    <el-dropdown-item 
                      :command="{ action: 'remove', id: container.id }"
                      divided
                    >
                      移除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <el-button @click="showQuickActions = !showQuickActions" size="small" block>
        快捷操作
      </el-button>
      
      <div v-if="showQuickActions" class="quick-actions">
        <el-button @click="importContainers" size="small" block>导入配置</el-button>
        <el-button @click="exportContainers" size="small" block>导出配置</el-button>
        <el-button @click="clearAllContainers" size="small" type="danger" block>
          清空所有
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  CircleCheck, 
  MoreFilled 
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  platforms: {
    type: Array,
    required: true
  },
  activeContainers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'add-container',
  'select-container', 
  'remove-container',
  'reload-container',           // 新增
  'edit-container-settings'     // 新增
])

// 响应式数据
const showQuickActions = ref(false)

// 计算属性
const getPlatformContainers = (platformId) => {
  return props.activeContainers.filter(container => container.platformId === platformId)
}

const getContainerCount = (platformId) => {
  return getPlatformContainers(platformId).length
}

const isActiveContainer = (containerId) => {
  // 这里需要从父组件获取当前活跃的容器ID
  return false // 临时返回false，实际应该从props或store获取
}

// 方法
const getStatusText = (status) => {
  const statusMap = {
    'created': '已创建',
    'loading': '加载中',
    'ready': '就绪',
    'sleeping': '已休眠',
    'error': '错误',
    'disconnected': '断开连接'
  }
  return statusMap[status] || '未知'
}

const handleContainerAction = (command) => {
  const { action, id } = command
  
  switch (action) {
    case 'reload':
      handleReloadContainer(id)
      break
    case 'settings':
      handleContainerSettings(id)
      break
    case 'remove':
      handleRemoveContainer(id)
      break
  }
}

const handleReloadContainer = (containerId) => {
  ElMessage.info('重新加载容器...')
  emit('reload-container', containerId)
  // 发送重新加载事件给父组件
}

const handleContainerSettings = (containerId) => {
  ElMessage.info('打开容器设置...')
  emit('edit-container-settings', containerId)

  // 打开容器设置弹窗
}

const handleRemoveContainer = async (containerId) => {
  try {
    await ElMessageBox.confirm(
      '确定要移除这个容器吗？',
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('remove-container', containerId)
  } catch {
    // 用户取消了操作
  }
}

const importContainers = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const containers = JSON.parse(e.target.result)
          // 导入容器配置
          ElMessage.success('配置导入成功')
        } catch (error) {
          ElMessage.error('配置文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const exportContainers = () => {
  const data = JSON.stringify(props.activeContainers, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `containers_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置导出成功')
}

const clearAllContainers = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有容器吗？此操作不可撤销！',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 移除所有容器
    props.activeContainers.forEach(container => {
      emit('remove-container', container.id)
    })
    
    ElMessage.success('所有容器已清空')
  } catch {
    // 用户取消了操作
  }
}
</script>

<style scoped>
.sidebar {
  width: 300px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #34495e;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #34495e;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.platform-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.platform-item {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.platform-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.platform-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.platform-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.platform-name {
  flex: 1;
  font-weight: 500;
}

.container-badge {
  margin-left: auto;
}

.platform-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.container-list {
  border-left: 2px solid #3498db;
  margin-left: 12px;
  padding-left: 10px;
}

.container-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin: 5px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.container-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.container-item.active {
  background: #3498db;
}

.container-info {
  flex: 1;
}

.container-name {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.container-status {
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
}

.container-status.ready {
  color: #2ecc71;
}

.container-status.loading {
  color: #f39c12;
}

.container-status.error {
  color: #e74c3c;
}

.container-status.created {
  color: #95a5a6;
}

.container-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.container-item:hover .container-actions {
  opacity: 1;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid #34495e;
}

.quick-actions {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 自定义滚动条 */
.platform-list::-webkit-scrollbar {
  width: 6px;
}

.platform-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.platform-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.platform-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>