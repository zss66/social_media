(function () {
  'use strict';

  if (window.__WHATSAPP_MONITOR_INITIALIZED__) {
    console.warn('⚠️ 已运行中');
    return;
  }

  const config = {
    silentMode: false,
    verboseLog: true,
    captureMedia: true,
    startTimestamp: Date.now(),
  };

  window.whatsappMessages = [];
  window.whatsappMediaFiles = [];

  const MESSAGE_TYPES = {
    chat: '💬 文本消息',
    image: '🖼️ 图片',
    video: '🎬 视频',
    audio: '🎵 语音',
    ptt: '🎤 语音消息',
    document: '📄 文档',
    sticker: '😊 贴纸',
  };

  function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  }

  // 等待媒体加载完成再解密
  function waitForMediaReady(msg, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        if (
          msg.mediaData &&
          ['RESOLVED', 'COMPLETE'].includes(msg.mediaData.mediaStage)
        ) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('媒体加载超时'));
        }
      }, 500);
    });
  }

  async function handleNewMessage(msg) {
    if (!msg || !msg.id) return;

    try {
      const msgId = msg.id._serialized || msg.id.id;
      if (window.whatsappMessages.some(m => m.id === msgId)) return;

      const ts = msg.t * 1000;
      if (ts < config.startTimestamp) return;

      const messageData = {
        id: msgId,
        timestamp: new Date(ts).toISOString(),
        type: msg.type,
        from: msg.from?._serialized || msg.from,
        to: msg.to?._serialized || msg.to,
        isFromMe: msg.isFromMe || false,
        body: msg.body || '',
        caption: msg.caption || '',
        hasMedia: msg.hasMedia,
        mimetype: msg.mimetype,
        filename: msg.filename,
        chat: msg.chat?.id?._serialized,
        sender: msg.sender?._serialized || msg.author,
        isGroup: msg.isGroupMsg || false,
        mediaUrl: null,
        blobUrl: null,
      };

      // 处理媒体
      if (msg.hasMedia && config.captureMedia) {
        try {
          await waitForMediaReady(msg);

          const media = await msg.downloadMedia();
          if (media && media.data) {
            const blob = base64ToBlob(media.data, media.mimetype);
            const blobUrl = URL.createObjectURL(blob);

            messageData.blobUrl = blobUrl;
            messageData.mimetype = media.mimetype;
            messageData.filename = media.filename || `media_${Date.now()}`;
            messageData.size = media.filesize;

            window.whatsappMediaFiles.push({
              messageId: msgId,
              blobUrl,
              mimetype: media.mimetype,
              filename: messageData.filename,
              size: media.filesize,
              data: media.data,
            });

            if (config.verboseLog) {
              console.log(`💾 [${msg.type}] 媒体已解密 ✅`);
              console.log('🔗 Blob URL:', blobUrl);
            }

            // 图片/视频预览
            if (media.mimetype.startsWith('image/')) {
              const img = document.createElement('img');
              img.src = blobUrl;
              img.style.maxWidth = '180px';
              img.style.margin = '5px';
              img.style.borderRadius = '6px';
              document.body.appendChild(img);
            } else if (media.mimetype.startsWith('video/')) {
              const video = document.createElement('video');
              video.src = blobUrl;
              video.controls = true;
              video.style.maxWidth = '200px';
              video.style.margin = '5px';
              document.body.appendChild(video);
            }
          }
        } catch (err) {
          console.warn('⚠️ 媒体尚未准备好或解密失败:', err.message);
        }
      }

      window.whatsappMessages.push(messageData);
      getWhatsAppData().then((data) => {
        const chatdata=data.chats;
        const myinfo=data.currentAccount;
        if(messageData.from===myinfo.wsid){
            messageData.isFromMe=true;
            console.log(messageData);
        }else{
            if(messageData.type==="chat"){
                chatdata.forEach(chat=>{
                    if(chat.id===messageData.from){
                        if(chat.name!=="未知"){
                            clickChatItem(chat.name,messageData.body);
                        }else{
                            clickChatItem(messageData.from.replace(/\D/g, ''),messageData.body,false);
                        }
                    }
                });
            }
        }
      });
      if (!config.silentMode) {
        const direction = msg.isFromMe ? '发送' : '接收';
        console.log(
          `📨 [${direction}] ${MESSAGE_TYPES[msg.type] || msg.type}`,
          '\n🕒 时间:', messageData.timestamp,
          '\n🆔 ID:', messageData.id,
          '\n💬 内容:', messageData.body || '[媒体]',
          '\n📎 文件名:', messageData.filename || 'N/A',
          '\n🔗 Blob URL:', messageData.blobUrl || '无'
        );
      }

    } catch (error) {
      console.error('❌ 处理消息失败:', error);
    }
  }

  function getWhatsAppModules() {
    try {
      const modules = window.require('WAWebCollections');
      return modules.Msg || modules.MsgCollection;
    } catch (err) {
      console.error('❌ 无法加载 WhatsApp 模块:', err);
      return null;
    }
  }

  function hookMessageCollection() {
    const msgCollection = getWhatsAppModules();
    if (!msgCollection?.on) {
      console.error('❌ 无法Hook消息集合');
      return false;
    }

    const addHandler = msg => handleNewMessage(msg);
    msgCollection.on('add', addHandler);
    window.__whatsappEventHandlers__ = { addHandler };

    console.log('✅ WhatsApp 消息监听器已启动');
    return true;
  }

  // ======= 命令 =======
  window.getAllMessages = () => {
    console.table(window.whatsappMessages);
    return window.whatsappMessages;
  };

  window.getAllMedia = () => {
    console.table(window.whatsappMediaFiles);
    return window.whatsappMediaFiles;
  };

  window.downloadMedia = index => {
    const m = window.whatsappMediaFiles[index];
    if (!m) return console.error('❌ 索引无效');
    const a = document.createElement('a');
    a.href = m.blobUrl;
    a.download = m.filename || `media_${index}`;
    a.click();
  };

  window.stopWhatsAppMonitor = () => {
    const msgCollection = getWhatsAppModules();
    if (msgCollection?.off && window.__whatsappEventHandlers__?.addHandler) {
      msgCollection.off('add', window.__whatsappEventHandlers__.addHandler);
      window.__WHATSAPP_MONITOR_INITIALIZED__ = false;
      console.log('🛑 已停止监听');
    }
  };
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
  async function clickChatItem(title, messageBody,hasName=true) {
    try {
      const chatItems = document.querySelectorAll("div._ak72");
      for (const item of chatItems) {
        const titleElement = item.querySelector("span.x1iyjqo2[title]");
        let isName=false;
        if(hasName){
             isName= titleElement.getAttribute("title") === title
        }
        else{
            isName= titleElement.getAttribute("title").replace(/\D/g, '')  === title
        }
        if (titleElement && isName) {
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
  function initialize() {
    console.log('🚀 初始化 WhatsApp 消息监听器...');
    const timer = setInterval(() => {
      if (window.require && window.require('WAWebCollections')) {
        clearInterval(timer);
        hookMessageCollection();
        window.__WHATSAPP_MONITOR_INITIALIZED__ = true;
        console.log(`
✅ 启动成功！可用命令：
  getAllMessages()      查看所有消息
  getAllMedia()         查看媒体信息
  downloadMedia(n)      下载媒体文件
  stopWhatsAppMonitor() 停止监听
        `);
      }
    }, 1000);
  }

  initialize();
})();
