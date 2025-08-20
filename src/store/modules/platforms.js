const defaultPlatforms = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: '/icons/whatsapp.png',
    url: 'https://web.whatsapp.com',
    type: 'web',
    category: 'messaging',
    description: 'WhatsApp网页版',
    features: ['translation', ],
    regions: ['global'],
    loginRequired: true
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '/icons/telegram.png',
    url: 'https://web.telegram.org/k/',
    type: 'web',
    category: 'messaging',
    description: 'Telegram网页版',
    features: ['translation', 'getlists', ],
    regions: ['global'],
    loginRequired: true
  },
  {
    id: 'wetalk',
    name: 'WeTalk',
    icon: '/icons/WeTalk.png',
    url: 'https://messages.wetalkapp.com/',
    type: 'web',
    category: 'messaging',
    description: 'WeTalk即时通讯',
    features: ['translation', ],
    regions: ['global'],
    loginRequired: true
  },
{
  id: 'line',
  name: 'LINE',
  icon: '/icons/line.png',
  url: 'chrome-extension://ophjlpahpchlmihnnnihgmmeilfjmjjc/index.html',  // 初始为空
  type: 'extension',
  category: 'messaging',
  description: 'LINE浏览器扩展',
  features: ['translation', ],
  regions: ['asia'],
  loginRequired: true
},
  // {
  //   id: 'discord',
  //   name: 'Discord',
  //   icon: '/icons/discord.png',
  //   url: 'https://discord.com/app',
  //   type: 'web',
  //   category: 'gaming',
  //   description: 'Discord网页版',
  //   features: ['translation', ],
  //   regions: ['global'],
  //   loginRequired: true
  // },
  // {
  //   id: 'slack',
  //   name: 'Slack',
  //   icon: '/icons/slack.png',
  //   url: 'https://slack.com/signin',
  //   type: 'web',
  //   category: 'business',
  //   description: 'Slack团队协作平台',
  //   features: ['translation', ],
  //   regions: ['global'],
  //   loginRequired: true
  // },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '/icons/facebook.png',
    url: 'https://www.facebook.com/',
    type: 'web',
    category: 'messaging',
    description: 'facebook网页版',
    features: ['translation', ],
    regions: ['global'],
    loginRequired: true
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '/icons/tiktok.png',
    url: 'https://www.tiktok.com/',
    type: 'web',
    category: 'messaging',
    description: 'tiktok网页版',
    features: ['translation', ],
    regions: ['global'],
    loginRequired: true
  },
  {
    id: 'messenger',
    name: 'Messenger',
    icon: '/icons/messenger.png',
    url: 'https://www.messenger.com',
    type: 'web',
    category: 'social',
    description: 'Facebook Messenger',
    features: ['translation',],
    regions: ['global'],
    loginRequired: true
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '/icons/instagram.png',
    url: 'https://www.instagram.com',
    type: 'web',
    category: 'social',
    description: 'Instagram Direct',
    features: ['translation', ],
    regions: ['global'],
    loginRequired: true
  }
]

const state = {
  platforms: [...defaultPlatforms],
  customPlatforms: [],
  platformCategories: [
    { id: 'messaging', name: '即时通讯', icon: 'ChatDotRound' },
    { id: 'social', name: '社交网络', icon: 'UserFilled' },
    { id: 'business', name: '商务办公', icon: 'Briefcase' },
    { id: 'gaming', name: '游戏娱乐', icon: 'VideoPlay' }
  ]
}

const getters = {
  allPlatforms: state => [...state.platforms, ...state.customPlatforms],
  
  platformById: state => id => {
    return [...state.platforms, ...state.customPlatforms].find(p => p.id === id)
  },
  
  platformsByCategory: state => category => {
    return [...state.platforms, ...state.customPlatforms]
      .filter(p => p.category === category)
  },
  
  platformsByType: state => type => {
    return [...state.platforms, ...state.customPlatforms]
      .filter(p => p.type === type)
  },
  
  platformsByRegion: state => region => {
    return [...state.platforms, ...state.customPlatforms]
      .filter(p => p.regions.includes(region) || p.regions.includes('global'))
  },
  
  platformCategories: state => state.platformCategories,
  
  customPlatforms: state => state.customPlatforms,
  
  defaultPlatforms: state => state.platforms
}

const mutations = {
  SET_PLATFORMS(state, platforms) {
    state.platforms = platforms
  },
  
  ADD_CUSTOM_PLATFORM(state, platform) {
    platform.id = platform.id || `custom_${Date.now()}`
    platform.custom = true
    state.customPlatforms.push(platform)
  },
  
  UPDATE_CUSTOM_PLATFORM(state, { id, updates }) {
    const index = state.customPlatforms.findIndex(p => p.id === id)
    if (index !== -1) {
      Object.assign(state.customPlatforms[index], updates)
    }
  },
  
  REMOVE_CUSTOM_PLATFORM(state, id) {
    const index = state.customPlatforms.findIndex(p => p.id === id)
    if (index !== -1) {
      state.customPlatforms.splice(index, 1)
    }
  },
  
  SET_CUSTOM_PLATFORMS(state, platforms) {
    state.customPlatforms = platforms
  }
}

const actions = {
  async loadPlatforms({ commit }) {
    try {
      // 加载自定义平台
      const savedCustomPlatforms = localStorage.getItem('custom-platforms')
      if (savedCustomPlatforms) {
        const customPlatforms = JSON.parse(savedCustomPlatforms)
        commit('SET_CUSTOM_PLATFORMS', customPlatforms)
      }
    } catch (error) {
      console.error('Failed to load platforms:', error)
    }
  },
  
  async saveCustomPlatforms({ state }) {
    try {
      localStorage.setItem('custom-platforms', JSON.stringify(state.customPlatforms))
    } catch (error) {
      console.error('Failed to save custom platforms:', error)
      throw error
    }
  },
  
  async addCustomPlatform({ commit, dispatch }, platform) {
    try {
      // 验证平台数据
      if (!platform.name || !platform.url) {
        throw new Error('平台名称和URL不能为空')
      }
      
      // 设置默认值
      const newPlatform = {
        name: platform.name,
        url: platform.url,
        type: platform.type || 'web',
        category: platform.category || 'messaging',
        description: platform.description || '',
        icon: platform.icon || '/icons/default.png',
        features: platform.features || ['messaging'],
        regions: platform.regions || ['global'],
        loginRequired: platform.loginRequired !== false,
        custom: true,
        createdAt: new Date().toISOString()
      }
      
      commit('ADD_CUSTOM_PLATFORM', newPlatform)
      await dispatch('saveCustomPlatforms')
      
      return newPlatform
    } catch (error) {
      console.error('Failed to add custom platform:', error)
      throw error
    }
  },
  
  async updateCustomPlatform({ commit, dispatch }, { id, updates }) {
    try {
      commit('UPDATE_CUSTOM_PLATFORM', { id, updates })
      await dispatch('saveCustomPlatforms')
    } catch (error) {
      console.error('Failed to update custom platform:', error)
      throw error
    }
  },
  
  async removeCustomPlatform({ commit, dispatch }, id) {
    try {
      commit('REMOVE_CUSTOM_PLATFORM', id)
      await dispatch('saveCustomPlatforms')
    } catch (error) {
      console.error('Failed to remove custom platform:', error)
      throw error
    }
  },
  
  async testPlatformUrl({ }, url) {
    try {
      // 测试URL是否可访问
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors'
      })
      return true
    } catch (error) {
      // 由于CORS限制，这里可能会失败，但这不一定意味着URL无效
      console.warn('Platform URL test failed (may be due to CORS):', error)
      return true // 假设URL有效
    }
  },
  
  async importPlatforms({ commit, dispatch }, file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!data.platforms || !Array.isArray(data.platforms)) {
        throw new Error('无效的平台配置文件格式')
      }
      
      for (const platform of data.platforms) {
        await dispatch('addCustomPlatform', platform)
      }
      
      return data.platforms.length
    } catch (error) {
      console.error('Failed to import platforms:', error)
      throw error
    }
  },
  
  async exportCustomPlatforms({ state }) {
    try {
      const data = {
        platforms: state.customPlatforms,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom_platforms_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export custom platforms:', error)
      throw error
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