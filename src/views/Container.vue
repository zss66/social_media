<template>
  <div class="container-page">
    <div v-if="container" class="container-wrapper">
      <!-- 容器头部 -->
      <div class="container-header">
        <div class="container-info">
          <img :src="container.platform.icon" :alt="container.platform.name" />
          <div>
            <h2>{{ container.name }}</h2>
            <p>{{ container.platform.name }}</p>
          </div>
        </div>
        
        <div class="container-actions">
          <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
          <el-button @click="reloadContainer" :icon="Refresh">重新加载</el-button>
          <el-button @click="showSettings = true" :icon="Setting">设置</el-button>
        </div>
      </div>
      
      <!-- 容器内容 -->
      <div class="container-content">
        <ContainerView 
          :container="container"
          @update-container="handleUpdateContainer"
        />
      </div>
    </div>
    
    <!-- 容器不存在 -->
    <div v-else class="container-not-found">
      <el-result 
        icon="warning" 
        title="容器不存在"
        sub-title="您访问的容器不存在或已被删除"
      >
        <template #extra>
          <el-button @click="goBack" type="primary">返回主页</el-button>
        </template>
      </el-result>
    </div>
    
    <!-- 设置弹窗 -->
    <el-dialog v-model="showSettings" title="容器设置" width="600px">
      <ContainerSettings 
        v-if="container"
        :container="container"
        @save="handleSaveSettings"
        @cancel="showSettings = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Setting } from '@element-plus/icons-vue'
import ContainerView from '@/components/ContainerView.vue'
import ContainerSettings from '@/components/ContainerSettings.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()

const showSettings = ref(false)

// 计算属性
const container = computed(() => {
  const containerId = route.params.id
  return store.getters['containers/containerById'](containerId)
})

// 方法
const goBack = () => {
  router.push('/')
}

const reloadContainer = () => {
  if (container.value) {
  
    store.dispatch('containers/reloadContainer', container.value.id)
    ElMessage.info('正在重新加载容器...')
  }
}

const handleUpdateContainer = (containerId, updates) => {
  store.dispatch('containers/updateContainer', { id: containerId, updates })
}

const handleSaveSettings = (settings) => {
  if (container.value) {
    handleUpdateContainer(container.value.id, { config: settings })
    showSettings.value = false
    ElMessage.success('容器设置已保存')
  }
}

// 生命周期
onMounted(() => {
  // 如果容器不存在，3秒后自动返回
  if (!container.value) {
    setTimeout(() => {
      if (!container.value) {
        goBack()
      }
    }, 3000)
  }
})
</script>

<style scoped>
.container-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.container-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.container-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: white;
  border-bottom: 1px solid var(--border-color-light);
}

[data-theme="dark"] .container-header {
  background: #2c2c2c;
  border-bottom-color: #404040;
}

.container-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.container-info img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.container-info h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.container-info p {
  margin: 0;
  font-size: 14px;
  color: var(--text-color-secondary);
}

.container-actions {
  display: flex;
  gap: 12px;
}

.container-content {
  flex: 1;
  overflow: hidden;
}

.container-not-found {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

@media (max-width: 768px) {
  .container-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .container-info {
    justify-content: center;
  }
  
  .container-actions {
    justify-content: center;
  }
}
</style>