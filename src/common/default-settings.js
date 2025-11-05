/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-08-07 17:39:32
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-08-07 17:39:47
 * @FilePath: \social_media\common\default-settings.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

// ✅ 更新：翻译设置使用与工具栏一致的参数结构
const defaultSettings = {
  // 基本设置
  theme: "light",
  language: "zh-CN",
  autoStart: false,
  minimizeToTray: true,

  // 默认代理设置
  defaultProxy: {
    enabled: false,
    type: "http",
    host: "",
    port: 8080,
    username: "",
    password: "",
  },

  // ✅ 翻译设置 - 与工具栏参数对齐
  translation: {
    // 基础开关
    autoTranslateReceive: true,
    autoTranslateSend: true,

    // 按钮个性化
    buttonText: "🌐点击翻译",
    loadingText: "翻译中...",

    // 翻译服务配置
    channel: "google", // 翻译通道：google/baidu/tencent/youdao
    targetLanguage: "zh", // 目标语言
    sourceLanguage: "zh-CN", // 源语种
    apiKey: "", // API密钥（部分服务需要）
    autoDetect: true, // 自动检测语言

    // 高级功能
    preview: false, // 翻译预览
    autoVoice: false, // 语音自动翻译

    // 缓存管理
    maxCacheSize: 500, // 最大缓存条数
    cacheExpireMs: 30 * 24 * 60 * 60 * 1000, // 缓存有效期（30天）
    hideButtonAfterTranslate: true, // 翻译后隐藏按钮
  },

  // 通知设置
  notification: {
    enabled: true,
    sound: true,
    showPreview: true,
    quietHours: [],
  },

  // 安全设置
  security: {
    appLock: false,
    password: "",
    autoLockTime: 30,
    dataEncryption: false,
  },

  // 高级设置
  advanced: {
    developerMode: false,
    hardwareAcceleration: true,
    maxContainers: 20,
    logLevel: "info",
    autoUpdate: true,
  },
};

module.exports = defaultSettings;
