import { ElMessage } from 'element-plus'

const state = {
  containers: [],
  activeContainer: null,
  containerSessions: new Map()
}

const getters = {
  allContainers: state => state.containers,
  activeContainer: state => state.activeContainer,
  containerById: state => id => state.containers.find(c => c.id === id),
  containersByPlatform: state => platformId => 
    state.containers.filter(c => c.platformId === platformId),
  containerCount: state => state.containers.length,
  activeContainerCount: state => 
    state.containers.filter(c => c.status === 'ready').length,
  sleepingContainers: state => state.containers.filter(c => c.status === 'sleeping')
}

const mutations = {
  SET_CONTAINERS(state, containers) {
    state.containers = containers
  },

  ADD_CONTAINER(state, container) {
    container.createdAt = container.createdAt || new Date().toISOString()
    container.updatedAt = new Date().toISOString()
    state.containers.push(container)
  },

  UPDATE_CONTAINER(state, { id, updates }) {
  const index = state.containers.findIndex(c => c.id === id)
  if (index !== -1) {
    const container = state.containers[index]

    // 1. 合并 config
    if (updates.config) {
      container.config = {
        ...container.config,
        ...updates.config
      }

      // 2. 自动映射 features
      container.features = {
        translation: container.config.enableTranslation || false,
        autoReply: container.config.enableAutoReply || false
      }
    }

    // 3. 合并其他字段（排除 config 与 features）
    const { config, features, ...restUpdates } = updates
    Object.assign(container, restUpdates)

    container.updatedAt = new Date().toISOString()
  }
},

  REMOVE_CONTAINER(state, id) {
    const index = state.containers.findIndex(c => c.id === id)
    if (index !== -1) {
      state.containers.splice(index, 1)
    }

    if (state.activeContainer && state.activeContainer.id === id) {
      state.activeContainer = null
    }
  },

  SET_ACTIVE_CONTAINER(state, container) {
    state.activeContainer = container
  },

  SET_CONTAINER_STATUS(state, { id, status }) {
    const container = state.containers.find(c => c.id === id)
    if (container) {
      container.status = status
      container.updatedAt = new Date().toISOString()
    }
  },

  SET_CONTAINER_SESSION(state, { id, session }) {
    state.containerSessions.set(id, session)
  },

  REMOVE_CONTAINER_SESSION(state, id) {
    state.containerSessions.delete(id)
  },

  SLEEP_CONTAINER(state, id) {
    const container = state.containers.find(c => c.id === id)
    if (container) {
      container.status = 'sleeping'
      container.sleepAt = new Date().toISOString()
      container.updatedAt = new Date().toISOString()
    }
  },

  WAKE_CONTAINER(state, id) {
    const container = state.containers.find(c => c.id === id)
    if (container) {
      container.status = 'ready'
      container.sleepAt = null
      container.updatedAt = new Date().toISOString()
    }
  }
}

const actions = {
  async loadContainers({ commit }) {
    try {
      const savedContainers = localStorage.getItem('app-containers')
      if (savedContainers) {
        const containers = JSON.parse(savedContainers)
        commit('SET_CONTAINERS', containers)
      }
    } catch (error) {
      console.error('Failed to load containers:', error)
      ElMessage.error('加载容器配置失败')
    }
  },

  async saveContainers({ state }) {
    try {
      localStorage.setItem('app-containers', JSON.stringify(state.containers))
    } catch (error) {
      console.error('Failed to save containers:', error)
      ElMessage.error('保存容器配置失败')
    }
  },

  async createContainer({ commit, dispatch }, containerConfig) {
    try {
      const id = `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const container = {
        id,
        ...containerConfig,
        status: 'created',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (window.electronAPI) {
        const containerConfigCopy = JSON.parse(JSON.stringify(container.config))
        const sessionResult = await window.electronAPI.createContainerSession(id, containerConfigCopy)
        if (!sessionResult.success) {
          throw new Error(sessionResult.error || '创建容器会话失败')
        }
      }

      commit('ADD_CONTAINER', container)
      await dispatch('saveContainers')

      ElMessage.success(`容器 "${container.name}" 创建成功`)
      return container
    } catch (error) {
      console.error('Failed to create container:', error)
      ElMessage.error(`创建容器失败: ${error.message}`)
      throw error
    }
  },

  async updateContainer({ commit, dispatch }, { id, updates }) {
    try {
      commit('UPDATE_CONTAINER', { id, updates })
      await dispatch('saveContainers')
      ElMessage.success('容器设置已更新')
    } catch (error) {
      console.error('Failed to update container:', error)
      ElMessage.error('更新容器失败')
    }
  },

  async removeContainer({ commit, dispatch, state }, id) {
    try {
      const container = state.containers.find(c => c.id === id)
      if (!container) throw new Error('容器不存在')

      commit('REMOVE_CONTAINER_SESSION', id)
      commit('REMOVE_CONTAINER', id)
      await dispatch('saveContainers')

      ElMessage.success(`容器 "${container.name}" 已删除`)
    } catch (error) {
      console.error('Failed to remove container:', error)
      ElMessage.error(`删除容器失败: ${error.message}`)
    }
  },

  setActiveContainer({ commit }, container) {
    commit('SET_ACTIVE_CONTAINER', container)
  },

  updateContainerStatus({ commit }, { id, status }) {
    commit('SET_CONTAINER_STATUS', { id, status })
  },

  async reloadContainer({ commit, state }, id) {
    try {
      const container = state.containers.find(c => c.id === id)
      if (!container) throw new Error('容器不存在')

      commit('SET_CONTAINER_STATUS', { id, status: 'loading' })
      await new Promise(resolve => setTimeout(resolve, 2000))
      commit('SET_CONTAINER_STATUS', { id, status: 'ready' })

      ElMessage.success('容器已重新加载')
    } catch (error) {
      console.error('Failed to reload container:', error)
      commit('SET_CONTAINER_STATUS', { id, status: 'error' })
      ElMessage.error('重新加载容器失败')
    }
  },

  async clearAllContainers({ commit, dispatch }) {
    try {
      commit('SET_CONTAINERS', [])
      commit('SET_ACTIVE_CONTAINER', null)
      await dispatch('saveContainers')

      ElMessage.success('所有容器已清空')
    } catch (error) {
      console.error('Failed to clear containers:', error)
      ElMessage.error('清空容器失败')
    }
  },

  async exportContainers({ state }) {
    try {
      const data = {
        containers: state.containers,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `containers_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      ElMessage.success('容器配置已导出')
    } catch (error) {
      console.error('Failed to export containers:', error)
      ElMessage.error('导出容器配置失败')
    }
  },

  async importContainers({ commit, dispatch }, file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (!data.containers || !Array.isArray(data.containers)) {
        throw new Error('无效的容器配置文件格式')
      }

      const importedContainers = data.containers.map(container => ({
        ...container,
        id: `container_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${container.name} (导入)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'created'
      }))

      for (const container of importedContainers) {
        commit('ADD_CONTAINER', container)
      }

      await dispatch('saveContainers')
      ElMessage.success(`成功导入 ${importedContainers.length} 个容器`)
    } catch (error) {
      console.error('Failed to import containers:', error)
      ElMessage.error(`导入容器配置失败: ${error.message}`)
    }
  },

async sleepContainer({ commit, state, dispatch }, id) {
    try {
      console.log(`Sleeping container ${state.containers}`)
      const container = state.containers.find(c => c.id === id)
      if (!container) throw new Error('容器不存在')

      // 销毁webview并保存状态
      if (window.electronAPI?.destroyContainerWebview) {
        const result = await window.electronAPI.destroyContainerWebview(id)
        if (!result.success) throw new Error(result.error || '销毁容器失败')
        
        console.log('Container destroyed:', result)
      }

      commit('SLEEP_CONTAINER', id)
      await dispatch('saveContainers')
      ElMessage.success(`容器 "${container.name}" 已休眠 (完全销毁)`)
    } catch (error) {
      console.error('休眠容器失败:', error)
      ElMessage.error(`休眠容器失败: ${error.message}`)
    }
  },

  async wakeContainer({ commit, state, dispatch }, id) {
    try {
      const container = state.containers.find(c => c.id === id)
      if (!container) throw new Error('容器不存在')

      // 获取容器配置
      const config =JSON.parse(JSON.stringify(container))

      // 重建webview并恢复状态
      if (window.electronAPI?.rebuildContainerWebview) {
        const result = await window.electronAPI.rebuildContainerWebview(id, config)
        if (!result.success) throw new Error(result.error || '重建容器失败')
        
        console.log('Container rebuilt:', result)
      }

      commit('WAKE_CONTAINER', id)
      await dispatch('saveContainers')
      ElMessage.success(`容器 "${container.name}" 已唤醒 (重建完成)`)
    } catch (error) {
      console.error('唤醒容器失败:', error)
      ElMessage.error(`唤醒容器失败: ${error.message}`)
    }
  },

  async deleteContainer({ commit, state, dispatch }, id) {
    try {
      const container = state.containers.find(c => c.id === id)
      if (!container) throw new Error('容器不存在')

      // 清理容器数据
      if (window.electronAPI?.cleanupContainerData) {
        await window.electronAPI.cleanupContainerData(id)
      }

      commit('DELETE_CONTAINER', id)
      await dispatch('saveContainers')
      ElMessage.success(`容器 "${container.name}" 已删除`)
    } catch (error) {
      console.error('删除容器失败:', error)
      ElMessage.error(`删除容器失败: ${error.message}`)
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
