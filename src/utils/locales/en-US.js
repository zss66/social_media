const enUS = {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    debug: 'Debug',
    refresh: 'Refresh',
    loading: 'Loading...',
    success: 'Operation successful',
    error: 'Operation failed',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    enable: 'Enable',
    disable: 'Disable',
    online: 'Online',
    offline: 'Offline',
    connected: 'Connected',
    disconnected: 'Disconnected',
    unknown: 'Unknown'
  },

  app: {
    title: 'Multi-Platform Social Manager',
    subtitle: 'Unified management of multiple social platform accounts',
    version: 'Version',
    description: 'An Electron-based multi-platform social software manager'
  },

  sidebar: {
    platformList: 'Platform List',
    quickActions: 'Quick Actions',
    importConfig: 'Import Configuration',
    exportConfig: 'Export Configuration',
    clearAll: 'Clear All'
  },

  container: {
    create: 'Create Container',
    name: 'Container Name',
    status: 'Status',
    actions: 'Actions',
    settings: 'Settings',
    reload: 'Reload',
    remove: 'Remove',
    created: 'Created',
    loading: 'Loading',
    ready: 'Ready',
    error: 'Error',
    createdAt: 'Created At',
    updatedAt: 'Updated At'
  },

  platform: {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    wechat: 'WeChat',
    line: 'LINE',
    discord: 'Discord',
    slack: 'Slack',
    teams: 'Microsoft Teams',
    skype: 'Skype',
    messenger: 'Facebook Messenger',
    instagram: 'Instagram'
  },

  config: {
    basicInfo: 'Basic Information',
    proxySettings: 'Proxy Settings',
    browserFingerprint: 'Browser Fingerprint',
    featureSettings: 'Feature Settings',
    advancedSettings: 'Advanced Settings',
    dataManagement: 'Data Management',

    containerName: 'Container Name',
    platformInfo: 'Platform Information',
    enableProxy: 'Enable Proxy',
    proxyType: 'Proxy Type',
    proxyAddress: 'Proxy Address',
    proxyPort: 'Proxy Port',
    username: 'Username',
    password: 'Password',
    testConnection: 'Test Connection',

    enableFingerprint: 'Enable Fingerprint Spoofing',
    presetTemplate: 'Preset Template',
    userAgent: 'User Agent',
    screenResolution: 'Screen Resolution',
    timezone: 'Timezone',
    language: 'Language Setting',

    enableTranslation: 'Enable Translation',
    enableAutoReply: 'Enable Auto Reply',
    autoReplyMessage: 'Auto Reply Content',
    replyDelay: 'Reply Delay',
    enableNotification: 'Enable Message Notification',
    enableLogging: 'Enable Message Logging',

    enableDevTools: 'Enable Developer Tools',
    disableImages: 'Disable Image Loading',
    disableJavaScript: 'Disable JavaScript',
    customCSS: 'Custom CSS',
    customJS: 'Custom JavaScript',

    clearCookies: 'Clear Cookies',
    clearCache: 'Clear Cache',
    exportData: 'Export Data',
    resetContainer: 'Reset Container'
  },

  settings: {
    basicSettings: 'Basic Settings',
    theme: 'App Theme',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    autoTheme: 'Follow System',
    language: 'Language Settings',
    autoStart: 'Auto Start',
    autoStartDesc: 'The app will start automatically with the system',
    minimizeToTray: 'Minimize to Tray',
    minimizeToTrayDesc: 'Minimize to system tray instead of exiting when closing the window',

    defaultProxy: 'Default Proxy Settings',
    defaultProxyDesc: 'New containers will use this proxy configuration by default',

    translationSettings: 'Translation Settings',
    translationService: 'Translation Service',
    defaultTargetLang: 'Default Target Language',
    apiKey: 'API Key',
    apiKeyDesc: 'Used to call the translation API, please ensure the key is valid',
    autoDetectLanguage: 'Auto Detect Language',

    notificationSettings: 'Notification Settings',
    enableDesktopNotification: 'Enable Desktop Notification',
    notificationSound: 'Notification Sound',
    showMessagePreview: 'Show Message Preview',
    showMessagePreviewDesc: 'Show message content preview in notifications',
    quietHours: 'Do Not Disturb Time',

    securitySettings: 'Security Settings',
    appLock: 'Enable App Lock',
    appLockDesc: 'Require password when launching the app',
    appPassword: 'App Password',
    autoLockTime: 'Auto Lock Time',
    dataEncryption: 'Data Encryption',
    dataEncryptionDesc: 'Encrypt saved configuration and data files',
    clearBrowserData: 'Clear All Browser Data',
    clearBrowserDataDesc: 'Clear cookies, cache and other data of all containers',

    advancedSettings: 'Advanced Settings',
    developerMode: 'Developer Mode',
    developerModeDesc: 'Enable debugging features and developer tools',
    hardwareAcceleration: 'Hardware Acceleration',
    hardwareAccelerationDesc: 'Use GPU to accelerate rendering (effective after restart)',
    maxContainers: 'Maximum Containers',
    maxContainersDesc: 'Limit on the number of concurrently running containers',
    logLevel: 'Log Level',
    autoUpdate: 'Auto Update',
    autoUpdateDesc: 'Automatically check for and download app updates',

    restoreDefaults: 'Restore Defaults',
    exportSettings: 'Export Settings',
    importSettings: 'Import Settings'
  },

  translation: {
    translate: 'Translate',
    translating: 'Translating...',
    originalText: 'Original Text',
    translatedText: 'Translated Text',
    copyTranslation: 'Copy Translation',
    translationResult: 'Translation Result',
    selectTextToTranslate: 'Please select text to translate first',
    translationFailed: 'Translation failed',

    languages: {
      zh: 'Chinese',
      en: 'English',
      ja: 'Japanese',
      ko: 'Korean',
      fr: 'French',
      de: 'German',
      es: 'Spanish',
      ru: 'Russian'
    },

    services: {
      google: 'Google Translate',
      baidu: 'Baidu Translate',
      youdao: 'Youdao Translate',
      tencent: 'Tencent Translate'
    }
  },

  autoReply: {
    autoReply: 'Auto Reply',
    enableAutoReply: 'Enable Auto Reply',
    disableAutoReply: 'Disable Auto Reply',
    replyContent: 'Reply Content',
    replyDelay: 'Reply Delay',
    quickMessages: 'Quick Messages',
    autoReplied: 'Auto Replied',

    quickReplyOptions: {
      hello: 'Hello',
      thanks: 'Thanks',
      ok: 'OK',
      busy: 'I am a bit busy right now, will contact later',
      later: 'Will contact later'
    }
  },

  notification: {
    newMessage: 'New Message',
    containerCreated: 'Container Created Successfully',
    containerRemoved: 'Container Removed',
    settingsSaved: 'Settings Saved',
    dataExported: 'Data Exported',
    dataImported: 'Data Imported',
    proxyTestSuccess: 'Proxy connection test succeeded',
    proxyTestFailed: 'Proxy connection test failed',
    translationCopied: 'Translation copied to clipboard',
    screenshotSaved: 'Screenshot saved'
  },

  error: {
    networkError: 'Network connection failed, please check your network settings',
    validationError: 'Input data is invalid, please check and try again',
    permissionError: 'Insufficient permissions to perform this action',
    containerError: 'Container operation failed, please try again',
    translationError: 'Translation service is temporarily unavailable',
    proxyError: 'Proxy connection failed, please check proxy settings',
    systemError: 'Internal system error, please restart the app',
    unknownError: 'An unknown error occurred',

    containerNameRequired: 'Please enter the container name',
    proxyAddressRequired: 'Please enter the proxy address',
    proxyPortRequired: 'Please enter the proxy port',
    invalidProxyPort: 'Proxy port must be between 1 and 65535',
    invalidUrl: 'Please enter a valid URL',
    fileFormatError: 'File format error',

    confirmDeleteContainer: 'Are you sure you want to delete this container?',
    confirmResetContainer: 'Are you sure you want to reset this container? All data, login states, and custom settings will be cleared. This action cannot be undone!',
    confirmClearAll: 'Are you sure you want to clear all containers? This action cannot be undone!',
    confirmResetSettings: 'Are you sure you want to reset the settings? All custom configurations will be cleared.',
    confirmClearCookies: 'Are you sure you want to clear all cookies of this container? This will require you to log in again.',
    confirmClearCache: 'Are you sure you want to clear all cache of this container?',
    confirmClearBrowserData: 'Are you sure you want to clear all browser data? This will clear the login status, cookies, and cache data of all containers.'
  },

  time: {
    justNow: 'Just now',
    minutesAgo: '{n} minutes ago',
    hoursAgo: '{n} hours ago',
    daysAgo: '{n} days ago',
    weeksAgo: '{n} weeks ago',
    monthsAgo: '{n} months ago',
    yearsAgo: '{n} years ago'
  }
}

export default enUS;
