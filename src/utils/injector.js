/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-07-25 16:33:26
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-09-26 09:18:40
 * @FilePath: /social_media/src/utils/injector.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-07-25 16:33:26
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-08-05 17:11:12
 * @FilePath: \social_media\src\utils\injector.js
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

  Object.entries(platformScripts).forEach(([feature, scriptCode]) => {
    const injectionCode = `
      window.pluginConfig = ${JSON.stringify(
        config
      )};  // 使用完整的 config 对象
      // 监听主程序传来的 config 更新消息
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'updatePluginConfig') {
          window.pluginConfig = Object.assign(window.pluginConfig || {}, event.data.payload);
          console.log('pluginConfig updated:', window.pluginConfig);
          if (typeof window.onPluginConfigUpdated === 'function') {
            window.onPluginConfigUpdated();
          }
        }
      });
      ${scriptCode}
    `;

    injectScript(webview, injectionCode, () => {
      console.log(`[${platform}] ${feature} 功能已注入`);
    });
  });
}

module.exports = { injectFeatures };
