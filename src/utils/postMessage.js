/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-07-25 15:26:58
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-07-25 15:27:12
 * @FilePath: \social_media\src\utils\postMessage.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/utils/postMessage.js
export function postToPreload(data) {
  window.postMessage(data, '*');
}
