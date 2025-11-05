export const newWhatsAppMessage = `
(function () {
  // 保存上一次通知，避免重复处理
  let lastNotificationId = null;

  // 检查消息类型是否为纯文本
  function isTextMessage(messageBody) {
    if (!messageBody || typeof messageBody !== 'string') {
      return false;
    }
    
    const body = messageBody.trim();
    
    // 定义非文本消息的特征前缀
    const nonTextPrefixes = [
      '📷 照片',
      '🎤 语音消息',
      '📆 已邀请你参加活动',
      '📊', // 投票
      '👤 联系人',
      '📄', // 文件
      '👾 GIF',
      '💟贴图'
    ];
    
    // 检查是否匹配任何非文本消息前缀
    for (const prefix of nonTextPrefixes) {
      if (body.startsWith(prefix)) {
        return false;
      }
    }
    
    return true;
  }

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
  async function clickChatItem(title, messageBody) {
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
          console.log('pluginConfig:', pluginConfig);
          
          // 只有在消息为纯文本且配置了知识库时才触发
          if (
            isTextMessage(messageBody) &&
            pluginConfig?.knowledge?.enableRetrieval &&
            pluginConfig?.knowledge?.selectedKnowledgeBase
          ) {
            console.log('触发知识库检索，消息内容:', messageBody);
            const response = await window.electronAPI.sendKnowledgeBaseMessage(
              messageBody,
              pluginConfig?.knowledge
            );
            window?.replaceAndSend(response);
          } else if (!isTextMessage(messageBody)) {
            console.log('非文本消息，跳过知识库检索:', messageBody);
          }
          
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
        const { title, body } = value;
        document.hasFocus = () =>true
        console.log("收到新通知:", title, "消息内容:", body);
        const result = clickChatItem(title, body);
        document.hasFocus = () =>false
        console.log(result);
      }
    },
    get() {
      return lastNotification;
    },
  });
})();
`;
