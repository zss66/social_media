/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-07-25 16:33:26
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-11-04 16:07:36
 * @FilePath: /social_media/src/utils/injector.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const { PlatformScripts } = require("../scripts");
const { injectScript } = require("./scriptLoader");

function injectFeatures(webview, platform, _featuresConfig, config) {
  const platformScripts = PlatformScripts[platform];
  if (!platformScripts) {
    console.warn(`未找到平台配置: ${platform}`);
    return;
  }

  // 仅注入一次的监听逻辑
  const listenerCode = `
    window.pluginConfig = ${JSON.stringify(config)};
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'updatePluginConfig') {
        window.pluginConfig = Object.assign(window.pluginConfig || {}, event.data.payload);
        console.log('pluginConfig updated:', window.pluginConfig);
        if (typeof window.onPluginConfigUpdated === 'function') {
          window.onPluginConfigUpdated();
        }
      }
    });
  `;

  // 首次注入监听逻辑
  injectScript(webview, listenerCode, () => {
    console.log(`[${platform}] 插件配置监听已注入`);
  });

  // 注入每个功能的脚本
  Object.entries(platformScripts).forEach(([feature, scriptCode]) => {
    const injectionCode = `
      ${scriptCode}
    `;

    injectScript(webview, injectionCode, () => {
      console.log(`[${platform}] ${feature} 功能已注入`);
    });
  });
}

module.exports = { injectFeatures };
