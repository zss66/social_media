/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-08-07 17:48:28
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-08-20 11:27:09
 * @FilePath: /social_media/public/services/settingsManager.cjs
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// main/utils/settingsManager.js
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { v4: uuidv4 } = require('uuid')

let settingsPath = null
const secret = uuidv4() // 应该从主进程传入或固定存储
const algorithm = 'aes-256-cbc'
const isDev = process.env.NODE_ENV === "development";

let defaultSettings
if (isDev) {
  // 开发环境引用源码路径
  defaultSettings = require(path.join(__dirname, '../../src/common/default-settings.js'))
} else {
  // 打包环境引用 asar 内路径
  defaultSettings = require(path.join(process.resourcesPath, 'default-settings.js'))
}
// 初始化 settings 存储路径
function init(userDataPath, filename = 'settings.dat') {
  settingsPath = path.join(userDataPath, filename)
}

// 加密
function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

// 解密
function decrypt(data) {
  const [ivHex, encryptedText] = data.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret), iv)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

function saveSettingsToDisk(settings) {
  if (!settingsPath) throw new Error('[settingsManager] Not initialized.')
  try {
    // 更新 defaultSettings 内存副本
    Object.assign(defaultSettings, settings)

    const data = JSON.stringify(defaultSettings, null, 2)

    if (defaultSettings.security?.dataEncryption) {
      const encrypted = encrypt(data)
      fs.writeFileSync(settingsPath, encrypted, 'utf-8')
    } else {
      fs.writeFileSync(settingsPath, data, 'utf-8')
    }

    console.log('[settingsManager] Settings saved.')
    return true
  } catch (error) {
    console.error('[settingsManager] Failed to save settings:', error)
    return false
  }
}

function loadSettingsFromDisk() {
  if (!settingsPath) throw new Error('[settingsManager] Not initialized.')
  if (!fs.existsSync(settingsPath)) {
    return defaultSettings
  }

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    // 尝试解析为 JSON（未加密）
    try {
      const parsed = JSON.parse(raw)
      return { ...defaultSettings, ...parsed }
    } catch {
      const decrypted = decrypt(raw)
      const parsed = JSON.parse(decrypted)
      return { ...defaultSettings, ...parsed }
    }
  } catch (err) {
    console.error('[loadSettingsFromDisk] Failed:', err)
    return defaultSettings
  }
}

module.exports = {
  init,
  loadSettingsFromDisk,
  saveSettingsToDisk,
  encrypt,
  decrypt
}
