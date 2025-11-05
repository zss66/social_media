/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-07-22 10:57:07
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-09-18 16:10:10
 * @FilePath: /social_media/src/main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 移除: import { ElLoadingDirective } from 'element-plus';  // 多余导入

// 自定义样式
import './styles/index.css'

// 工具类
import { i18n } from './utils/i18n'
import { setupErrorHandler } from './utils/errorHandler'
import { setupPlatformDetection } from './utils/platform'

// 创建Vue应用实例
const app = createApp(App)

// 移除: app.directive('loading', ElLoadingDirective);  // 重复注册

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(store)
app.use(router)
app.use(ElementPlus, {
  // Element Plus 配置
  size: 'default',
  zIndex: 3000,
})
app.use(i18n)

// 设置错误处理
setupErrorHandler(app)

// 设置平台检测
setupPlatformDetection()

// 全局属性
app.config.globalProperties.$ELEMENT_SIZE = 'default'

// 移除: 整个自定义 app.directive('loading', { ... }) 块  // 自定义重复注册

// 开发环境配置
if (process.env.NODE_ENV === 'development') {
  app.config.performance = true
  app.config.devtools = true
}

// 挂载应用
app.mount('#app')

// 导出应用实例供其他模块使用
export default app