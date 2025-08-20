import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import jaJP from './locales/ja-JP'
import koKR from './locales/ko-KR'




/**
 * 获取浏览器语言
 */
function getBrowserLanguage() {
  const language = navigator.language || navigator.userLanguage
  
  // 语言映射
  const languageMap = {
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-CN',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US',
    'ja': 'ja-JP',
    'ja-JP': 'ja-JP',
    'ko': 'ko-KR',
    'ko-KR': 'ko-KR'
  }
  
  return languageMap[language] || languageMap[language.split('-')[0]] || 'zh-CN'
}

/**
 * 获取保存的语言设置
 */
function getSavedLanguage() {
  try {
    return localStorage.getItem('app-language') || getBrowserLanguage()
  } catch {
    return getBrowserLanguage()
  }
}

/**
 * 创建 i18n 实例
 */
export const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getSavedLanguage(),
  fallbackLocale: 'zh-CN',
  messages:{
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP,
    'ko-KR': koKR
  },
  globalInjection: true,
  silentTranslationWarn: true
})

/**
 * 切换语言
 * @param {string} locale - 语言代码
 */
export function setLanguage(locale) {
  if (!messages[locale]) {
    console.warn(`Language ${locale} is not supported`)
    return false
  }
  
  i18n.global.locale.value = locale
  
  // 保存到本地存储
  try {
    localStorage.setItem('app-language', locale)
  } catch (error) {
    console.warn('Failed to save language setting:', error)
  }
  
  // 更新 HTML lang 属性
  document.documentElement.setAttribute('lang', locale)
  
  return true
}

/**
 * 获取当前语言
 */
export function getCurrentLanguage() {
  return i18n.global.locale.value
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  return [
    { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
    { code: 'en-US', name: '英语', nativeName: 'English' },
    { code: 'ja-JP', name: '日语', nativeName: '日本語' },
    { code: 'ko-KR', name: '韩语', nativeName: '한국어' }
  ]
}

/**
 * 获取翻译文本的辅助函数
 * @param {string} key - 翻译键
 * @param {object} params - 参数
 */
export function t(key, params = {}) {
  return i18n.global.t(key, params)
}

/**
 * 动态添加语言包
 * @param {string} locale - 语言代码
 * @param {object} messages - 语言包
 */
export function addLanguage(locale, messages) {
  i18n.global.setLocaleMessage(locale, messages)
}

/**
 * 检查是否支持某个语言
 * @param {string} locale - 语言代码
 */
export function isLanguageSupported(locale) {
  return messages.hasOwnProperty(locale)
}

/**
 * 格式化带参数的翻译文本
 * @param {string} template - 模板字符串
 * @param {object} params - 参数对象
 */
export function formatMessage(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match
  })
}

/**
 * 获取语言的文本方向
 * @param {string} locale - 语言代码
 */
export function getTextDirection(locale = getCurrentLanguage()) {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur']
  const langCode = locale.split('-')[0]
  return rtlLanguages.includes(langCode) ? 'rtl' : 'ltr'
}

/**
 * 语言变化监听器
 */
const languageChangeListeners = new Set()

/**
 * 监听语言变化
 * @param {Function} callback - 回调函数
 */
export function onLanguageChange(callback) {
  languageChangeListeners.add(callback)
  
  // 返回取消监听的函数
  return () => {
    languageChangeListeners.delete(callback)
  }
}

/**
 * 触发语言变化事件
 * @param {string} newLocale - 新语言
 * @param {string} oldLocale - 旧语言
 */
function emitLanguageChange(newLocale, oldLocale) {
  languageChangeListeners.forEach(callback => {
    try {
      callback(newLocale, oldLocale)
    } catch (error) {
      console.error('Language change listener error:', error)
    }
  })
}

// 监听语言变化
let currentLocale = getCurrentLanguage()
setInterval(() => {
  const newLocale = getCurrentLanguage()
  if (newLocale !== currentLocale) {
    emitLanguageChange(newLocale, currentLocale)
    currentLocale = newLocale
  }
}, 1000)

export default i18n