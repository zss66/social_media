/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-08-07 17:39:32
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-08-07 17:39:47
 * @FilePath: \social_media\common\default-settings.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// common/default-settings.js
const defaultSettings = {
  theme: 'light',
  language: 'zh-CN',
  autoStart: false,
  minimizeToTray: true,
  defaultProxy: {
    enabled: false,
    type: 'http',
    host: '',
    port: 8080,
    username: '',
    password: ''
  },
  translation: {
    service: 'google',
    defaultTargetLang: 'zh',
    apiKey: '',
    autoDetect: true
  },
  notification: {
    enabled: true,
    sound: true,
    showPreview: true,
    quietHours: []
  },
  security: {
    appLock: false,
    password: '',
    autoLockTime: 30,
    dataEncryption: false
  },
  advanced: {
    developerMode: false,
    hardwareAcceleration: true,
    maxContainers: 20,
    logLevel: 'info',
    autoUpdate: true
  }
}

module.exports = defaultSettings
