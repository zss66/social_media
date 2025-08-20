const zhCN = {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    remove: '移除',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    submit: '提交',
    reset: '重置',
    clear: '清空',
    debug: '调试',
    refresh: '刷新',
    loading: '加载中...',
    success: '操作成功',
    error: '操作失败',
    warning: '警告',
    info: '提示',
    yes: '是',
    no: '否',
    enable: '启用',
    disable: '禁用',
    online: '在线',
    offline: '离线',
    connected: '已连接',
    disconnected: '已断开',
    unknown: '未知'
  },
  
  app: {
    title: '多平台社交管理器',
    subtitle: '统一管理多个社交平台账号',
    version: '版本',
    description: '一个基于 Electron 的多平台社交软件管理器'
  },
  
  sidebar: {
    platformList: '平台列表',
    quickActions: '快捷操作',
    importConfig: '导入配置',
    exportConfig: '导出配置',
    clearAll: '清空所有'
  },
  
  container: {
    create: '创建容器',
    name: '容器名称',
    status: '状态',
    actions: '操作',
    settings: '设置',
    reload: '重新加载',
    remove: '移除',
    created: '已创建',
    loading: '加载中',
    ready: '就绪',
    error: '错误',
    createdAt: '创建时间',
    updatedAt: '更新时间'
  },
  
  platform: {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    wechat: '微信',
    line: 'LINE',
    discord: 'Discord',
    slack: 'Slack',
    teams: 'Microsoft Teams',
    skype: 'Skype',
    messenger: 'Facebook Messenger',
    instagram: 'Instagram'
  },
  
  config: {
    basicInfo: '基本信息',
    proxySettings: '代理设置',
    browserFingerprint: '浏览器指纹',
    featureSettings: '功能设置',
    advancedSettings: '高级设置',
    dataManagement: '数据管理',
    
    containerName: '容器名称',
    platformInfo: '平台信息',
    enableProxy: '启用代理',
    proxyType: '代理类型',
    proxyAddress: '代理地址',
    proxyPort: '代理端口',
    username: '用户名',
    password: '密码',
    testConnection: '测试连接',
    
    enableFingerprint: '启用指纹伪装',
    presetTemplate: '预设模板',
    userAgent: 'User Agent',
    screenResolution: '屏幕分辨率',
    timezone: '时区',
    language: '语言设置',
    
    enableTranslation: '启用翻译功能',
    enableAutoReply: '启用自动回复',
    autoReplyMessage: '自动回复内容',
    replyDelay: '回复延迟',
    enableNotification: '启用消息通知',
    enableLogging: '启用消息记录',
    
    enableDevTools: '启用开发者工具',
    disableImages: '禁用图片加载',
    disableJavaScript: '禁用JavaScript',
    customCSS: '自定义CSS',
    customJS: '自定义JavaScript',
    
    clearCookies: '清理Cookie',
    clearCache: '清理缓存',
    exportData: '导出数据',
    resetContainer: '重置容器'
  },
  
  settings: {
    basicSettings: '基本设置',
    theme: '应用主题',
    lightTheme: '浅色主题',
    darkTheme: '深色主题',
    autoTheme: '跟随系统',
    language: '语言设置',
    autoStart: '开机自启动',
    autoStartDesc: '应用将在系统启动时自动运行',
    minimizeToTray: '最小化到托盘',
    minimizeToTrayDesc: '关闭窗口时最小化到系统托盘而不是退出',
    
    defaultProxy: '默认代理设置',
    defaultProxyDesc: '新创建的容器将默认使用此代理配置',
    
    translationSettings: '翻译设置',
    translationService: '翻译服务',
    defaultTargetLang: '默认目标语言',
    apiKey: 'API 密钥',
    apiKeyDesc: '用于调用翻译API，请确保密钥有效',
    autoDetectLanguage: '自动检测语言',
    
    notificationSettings: '通知设置',
    enableDesktopNotification: '启用桌面通知',
    notificationSound: '通知声音',
    showMessagePreview: '显示消息预览',
    showMessagePreviewDesc: '在通知中显示消息内容预览',
    quietHours: '免打扰时间',
    
    securitySettings: '安全设置',
    appLock: '启用应用锁',
    appLockDesc: '应用启动时需要输入密码',
    appPassword: '应用密码',
    autoLockTime: '自动锁定时间',
    dataEncryption: '数据加密',
    dataEncryptionDesc: '加密保存的配置和数据文件',
    clearBrowserData: '清理所有浏览数据',
    clearBrowserDataDesc: '清理所有容器的Cookie、缓存等数据',
    
    advancedSettings: '高级设置',
    developerMode: '开发者模式',
    developerModeDesc: '启用调试功能和开发者工具',
    hardwareAcceleration: '硬件加速',
    hardwareAccelerationDesc: '使用GPU加速渲染（重启后生效）',
    maxContainers: '最大容器数量',
    maxContainersDesc: '同时运行的容器数量限制',
    logLevel: '日志级别',
    autoUpdate: '自动更新',
    autoUpdateDesc: '自动检查并下载应用更新',
    
    restoreDefaults: '恢复默认设置',
    exportSettings: '导出设置',
    importSettings: '导入设置'
  },
  
  translation: {
    translate: '翻译',
    translating: '翻译中...',
    originalText: '原文',
    translatedText: '译文',
    copyTranslation: '复制译文',
    translationResult: '翻译结果',
    selectTextToTranslate: '请先选择要翻译的文本',
    translationFailed: '翻译失败',
    
    languages: {
      zh: '中文',
      en: '英语',
      ja: '日语',
      ko: '韩语',
      fr: '法语',
      de: '德语',
      es: '西班牙语',
      ru: '俄语'
    },
    
    services: {
      google: 'Google 翻译',
      baidu: '百度翻译',
      youdao: '有道翻译',
      tencent: '腾讯翻译'
    }
  },
  
  autoReply: {
    autoReply: '自动回复',
    enableAutoReply: '开启自动回复',
    disableAutoReply: '关闭自动回复',
    replyContent: '回复内容',
    replyDelay: '回复延迟',
    quickMessages: '快捷消息',
    autoReplied: '已自动回复',
    
    quickReplyOptions: {
      hello: '你好',
      thanks: '谢谢',
      ok: '好的',
      busy: '我现在有点忙，稍后联系',
      later: '稍后联系'
    }
  },
  
  notification: {
    newMessage: '新消息',
    containerCreated: '容器创建成功',
    containerRemoved: '容器已删除',
    settingsSaved: '设置已保存',
    dataExported: '数据已导出',
    dataImported: '数据已导入',
    proxyTestSuccess: '代理连接测试成功',
    proxyTestFailed: '代理连接测试失败',
    translationCopied: '译文已复制到剪贴板',
    screenshotSaved: '截图已保存'
  },
  
  error: {
    networkError: '网络连接失败，请检查网络设置',
    validationError: '输入数据有误，请检查后重试',
    permissionError: '权限不足，无法执行此操作',
    containerError: '容器操作失败，请重试',
    translationError: '翻译服务暂时不可用',
    proxyError: '代理连接失败，请检查代理设置',
    systemError: '系统内部错误，请重启应用',
    unknownError: '发生未知错误',
    
    containerNameRequired: '请输入容器名称',
    proxyAddressRequired: '请输入代理地址',
    proxyPortRequired: '请输入代理端口',
    invalidProxyPort: '代理端口必须在1-65535之间',
    invalidUrl: '请输入有效的URL地址',
    fileFormatError: '文件格式错误',
    
    confirmDeleteContainer: '确定要删除这个容器吗？',
    confirmResetContainer: '确定要重置此容器吗？所有数据、登录状态和自定义设置都将被清除，此操作不可撤销！',
    confirmClearAll: '确定要清空所有容器吗？此操作不可撤销！',
    confirmResetSettings: '确定要重置设置吗？所有自定义配置将被清除。',
    confirmClearCookies: '确定要清理此容器的所有Cookie吗？这将导致需要重新登录。',
    confirmClearCache: '确定要清理此容器的所有缓存吗？',
    confirmClearBrowserData: '确定要清理所有浏览数据吗？这将清除所有容器的登录状态、Cookie和缓存数据。'
  },
  
  time: {
    justNow: '刚刚',
    minutesAgo: '{n}分钟前',
    hoursAgo: '{n}小时前',
    daysAgo: '{n}天前',
    weeksAgo: '{n}周前',
    monthsAgo: '{n}个月前',
    yearsAgo: '{n}年前'
  }
}
export default zhCN