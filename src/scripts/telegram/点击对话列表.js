/*
 * @Author: zss zjb520zll@gmail.com
 * @Date: 2025-09-29 18:07:21
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-10-23 18:04:15
 * @FilePath: /social_media/src/scripts/telegram/点击对话列表.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
(function () {
  // 保存上一次通知，避免重复处理
  let lastNotificationId = null;

  // 检查是否在指定聊天界面
  function isInChat(title) {
    try {
      const header = document.querySelector("#main>header.x1n2onr6");
      if (!header) return false;
      const headerTitle = header.querySelector("span.x1iyjqo2");
      return headerTitle && headerTitle.textContent.trim() === title;
    } catch (error) {
      console.error("检查聊天界面时出错:", error);
      return false;
    }
  }

  // 点击匹配的聊天项
  function clickChatItem(title) {
    try {
      const chatItems = document.querySelectorAll("div._ak72");
      for (const item of chatItems) {
        const titleElement = item.querySelector("span.x1iyjqo2[title]");
        if (titleElement && titleElement.getAttribute("title") === title) {
          const event = new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            button: 0,
          });
          item.dispatchEvent(event);
          return "成功点击聊天项: " + title;
        }
      }
      return "未找到匹配的聊天项: " + title;
    } catch (error) {
      return "点击聊天项时出错: " + error.message;
    }
  }

  // 监听 window.latestNotification 的变化
  let lastNotification = null;
  Object.defineProperty(window, "latestNotification", {
    set(value) {
      lastNotification = value;
      if (value && value.webNotificationId !== lastNotificationId) {
        lastNotificationId = value.webNotificationId;
        const { title } = value;
        if (!isInChat(title)) {
          console.log("不在目标聊天界面，尝试点击:", title);
          const result = clickChatItem(title);
          console.log(result);
        } else {
          console.log("已在目标聊天界面:", title);
        }
      }
    },
    get() {
      return lastNotification;
    },
  });

  console.log("通知监听器已启动");
})();
