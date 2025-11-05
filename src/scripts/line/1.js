// LINE 消息解密与自动响应监听器 - 完整版
// 功能：解密消息 + 获取用户信息 + 自动点击聊天项 + 桌面通知
// 使用方法：在浏览器控制台中运行此代码

(function () {
  "use strict";

  // 存储数据
  window.lineDecryptHistory = window.lineDecryptHistory || [];
  window.lineVoiceMessages = window.lineVoiceMessages || [];

  // 用户信息缓存
  const userCache = {
    myProfile: null,
    contacts: {},
    lastUpdate: 0,
  };

  // 配置选项
  const config = {
    // 消息过滤
    onlyNewMessages: true,
    startTime: Date.now(),
    timeWindowSeconds: 0,

    // 显示选项
    silentMode: false,
    verboseLog: false,

    // 通知选项
    enableNotifications: true,

    // 自动操作
    autoClickChat: true,
  };

  // 配置函数
  window.lineDecryptConfig = function (options) {
    Object.assign(config, options);
    console.log("✅ 配置已更新:", config);

    if (config.enableNotifications && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // 内容类型映射
  const CONTENT_TYPES = {
    0: "TEXT",
    1: "IMAGE",
    2: "VIDEO",
    3: "AUDIO",
    7: "STICKER",
    14: "FILE",
    15: "LOCATION",
  };

  // ============ 用户信息管理 ============

  // 获取用户显示名称
  function getDisplayName(mid) {
    if (!mid) return "未知用户";

    if (userCache.myProfile && mid === userCache.myProfile.mid) {
      return userCache.myProfile.displayName + " (我)";
    }

    const contact = userCache.contacts[mid];
    if (contact?.displayName) {
      return contact.displayName;
    }

    return mid.slice(0, 12) + "...";
  }

  // 检查是否是自己发送的消息
  function isMyMessage(from) {
    return userCache.myProfile && from === userCache.myProfile.mid;
  }

  // 处理用户资料响应
  function processProfile(data) {
    if (data && data.mid) {
      userCache.myProfile = {
        mid: data.mid,
        displayName: data.displayName,
        regionCode: data.regionCode,
      };

      if (!config.silentMode) {
        console.log("✅ 捕获到个人资料:", data.displayName, data.mid);
      }
    }
  }

  // 处理联系人列表响应
  function processContacts(data) {
    if (data && data.contacts) {
      for (const [mid, contactData] of Object.entries(data.contacts)) {
        if (contactData.contact) {
          userCache.contacts[mid] = contactData.contact;
        }
      }

      if (!config.silentMode) {
        console.log(`✅ 捕获到 ${Object.keys(data.contacts).length} 个联系人`);
      }
    }
  }

  // ============ 自动点击聊天项 ============

  // 自动点击匹配的聊天列表项
  function autoClickChatItem(senderId) {
    console.log("触发点击动作");
    console.log(senderId);
    if (!senderId || !config.autoClickChat) return false;

    try {
      // 查询所有可能的聊天列表项
      const chatItems = document.querySelectorAll(
        "div.chatlistItem-module__chatlist_item__MOwxh[data-mid], " +
          "div.friendlistItem-module__item__1tuZn[data-mid]"
      );
      // 查找匹配的元素
      let matchedElement = null;
      for (const item of chatItems) {
        const dataMid = item.getAttribute("data-mid");
        if (dataMid === senderId) {
          matchedElement = item;
          break;
        }
      }
      // 点击匹配的元素
      if (matchedElement) {
        matchedElement
          .querySelector('button[aria-label="Go chatroom"]')
          .click();
        if (config.verboseLog) {
          console.log("✅ 已自动点击聊天项:", senderId);
        }
        return true;
      } else {
        if (config.verboseLog) {
          console.log("⚠️  未找到匹配的聊天项:", senderId);
        }
        return false;
      }
    } catch (error) {
      if (config.verboseLog) {
        console.error("❌ 自动点击聊天项失败:", error);
      }
      return false;
    }
  }

  // ============ 桌面通知 ============

  // 发送桌面通知
  async function sendNotification(message) {
    if (!config.enableNotifications) return;
    if (Notification.permission !== "granted") return;
    if (isMyMessage(message.from)) return;

    const senderName = getDisplayName(message.from);
    const contentType = CONTENT_TYPES[message.contentType] || "UNKNOWN";

    let body = "";

    switch (message.contentType) {
      case 0: // TEXT
        body = message.text || "[空文本消息]";
        if (
          message.text &&
          pluginConfig?.knowledge?.enableRetrieval &&
          pluginConfig?.knowledge?.selectedKnowledgeBase
        ) {
          console.log("触发知识库检索，消息内容:", message.text);
          autoClickChatItem(message.from);
          // 你的知识库处理代码
          const response = await window.electronAPI.sendKnowledgeBaseMessage(
            message.text,
            pluginConfig?.knowledge
          );
          window?.replaceAndSend(response);
        }

        break;
      case 1: // IMAGE
        body = "[图片消息]";
        break;
      case 2: // VIDEO
        body = "[视频消息]";
        break;
      case 3: // AUDIO
        const duration = message.contentMetadata?.DURATION;
        body = duration
          ? `[语音消息 ${Math.round(duration / 1000)}秒]`
          : "[语音消息]";
        break;
      case 7: // STICKER
        body = "[贴图消息]";
        break;
      case 14: // FILE
        const fileName = message.contentMetadata?.FILE_NAME;
        body = fileName ? `[文件] ${fileName}` : "[文件消息]";
        break;
      case 15: // LOCATION
        body = "[位置消息]";
        break;
      default:
        body = `[${contentType}消息]`;
    }

    try {
      new Notification(`LINE-${senderName} 发来新消息`, {
        body: body,
        tag: message.id,
        requireInteraction: false,
      });
    } catch (error) {
      if (config.verboseLog) {
        console.error("❌ 发送通知失败:", error);
      }
    }
  }

  // ============ 消息处理 ============

  // 检查是否应该记录消息
  function checkShouldRecord(message, isBatch) {
    if (config.onlyNewMessages) {
      const messageTime = parseInt(message.createdTime);
      if (messageTime < config.startTime) {
        return false;
      }
    }

    if (config.timeWindowSeconds > 0) {
      const messageTime = parseInt(message.createdTime);
      const now = Date.now();
      const windowMs = config.timeWindowSeconds * 1000;

      if (now - messageTime > windowMs) {
        return false;
      }
    }

    return true;
  }

  // 处理解密后的消息
  function handleDecryptedMessage(message, decryptedMessage) {
    const contentType =
      CONTENT_TYPES[message.contentType] || message.contentType;
    const senderName = getDisplayName(message.from);

    // 保存到历史记录
    const record = {
      timestamp: new Date().toISOString(),
      messageId: message.id,
      from: message.from,
      fromName: senderName,
      to: message.to,
      contentType: message.contentType,
      contentTypeName: contentType,
      text: decryptedMessage.text,
      contentMetadata: decryptedMessage.contentMetadata,
      createdTime: message.createdTime,
      isMyMessage: isMyMessage(message.from),
      success: true,
    };

    window.lineDecryptHistory.push(record);

    // 控制台输出
    if (!config.silentMode) {
      console.log(`📩 [解密消息] ${senderName} - ${contentType}`, {
        id: message.id,
        time: new Date(parseInt(message.createdTime)).toLocaleString(),
      });

      if (message.contentType === 0 && decryptedMessage.text) {
        console.log(`✅ [文本] ${senderName}: ${decryptedMessage.text}`);
      } else if (message.contentType === 3) {
        console.log(`✅ [语音] ${senderName}:`, {
          duration: decryptedMessage.contentMetadata?.DURATION + "ms",
          fileSize: decryptedMessage.contentMetadata?.FILE_SIZE + " bytes",
        });
      } else {
        console.log(`✅ [${contentType}] ${senderName}`);
      }
    }
    console.log(message);
    // 发送桌面通知（只对他人消息）
    if (!isMyMessage(message.from)) {
      sendNotification({
        id: message.id,
        from: message.from,
        contentType: message.contentType,
        text: decryptedMessage.text,
        contentMetadata: decryptedMessage.contentMetadata,
      });

      // 自动点击聊天项
    }
  }

  // ============ Hook LINE 解密器 ============

  function hookLineDecryptor() {
    const cryptoClass =
      window._CryptoClass || window._global?.frames?.top?._CryptoClass;

    if (!cryptoClass) {
      console.log("❌ 未找到 _CryptoClass");
      return false;
    }

    console.log("🎣 开始 Hook LINE 解密器...");

    let batchDecryptInProgress = false;

    // Hook decryptMessage
    const originalDecryptMessage = cryptoClass.decryptMessage;
    cryptoClass.decryptMessage = async function (message) {
      try {
        const decryptedMessage = await originalDecryptMessage.call(
          this,
          message
        );

        const shouldRecord = checkShouldRecord(message, batchDecryptInProgress);

        if (shouldRecord) {
          handleDecryptedMessage(message, decryptedMessage);
        } else if (config.verboseLog) {
          const contentType =
            CONTENT_TYPES[message.contentType] || message.contentType;
          console.log(`⏭️  [跳过] ${contentType} - 历史消息`);
        }

        return decryptedMessage;
      } catch (error) {
        if (!config.silentMode) {
          console.error("❌ 解密失败:", error);
        }

        window.lineDecryptHistory.push({
          timestamp: new Date().toISOString(),
          messageId: message.id,
          error: error.message,
          success: false,
        });

        throw error;
      }
    };

    // Hook decryptMessageList
    const originalDecryptMessageList = cryptoClass.decryptMessageList;
    cryptoClass.decryptMessageList = async function (messages) {
      batchDecryptInProgress = true;

      if (!config.silentMode) {
        console.log(`📦 [批量解密] ${messages.length} 条消息`);
      }

      const decryptedMessages = await originalDecryptMessageList.call(
        this,
        messages
      );

      batchDecryptInProgress = false;

      if (!config.silentMode) {
        console.log("✅ 批量解密完成");
      }

      return decryptedMessages;
    };

    console.log("✅ 解密器 Hook 完成");
    return true;
  }

  // ============ Hook WebCrypto（语音解密）============

  function hookWebCryptoForVoice() {
    console.log("🎣 Hook WebCrypto（语音解密）...");

    const originalDecrypt = window.crypto.subtle.decrypt;

    window.crypto.subtle.decrypt = async function (algorithm, key, data) {
      const result = await originalDecrypt.apply(this, arguments);

      if (result.byteLength > 10000 && result.byteLength < 500000) {
        const decryptedData = new Uint8Array(result);

        if (
          decryptedData[4] === 0x66 &&
          decryptedData[5] === 0x74 &&
          decryptedData[6] === 0x79 &&
          decryptedData[7] === 0x70
        ) {
          if (!config.silentMode) {
            console.log("🎵 捕获语音解密:", {
              size: result.byteLength + " bytes",
              algorithm: algorithm.name,
            });
          }

          const voiceData = {
            timestamp: new Date().toISOString(),
            data: decryptedData.slice(0),
            size: result.byteLength,
            algorithm: algorithm.name,
          };

          window.lineVoiceMessages.push(voiceData);

          const index = window.lineVoiceMessages.length - 1;
          if (!config.silentMode) {
            console.log(`💾 已保存语音 [${index}]`);
            console.log(`💡 播放: playVoice(${index})`);
          }
        }
      }

      return result;
    };

    console.log("✅ WebCrypto Hook 完成");
  }

  // ============ Hook Fetch/XHR（获取用户数据）============

  function hookXHR() {
    window.handleXHRResponse = async function (xhr) {
      try {
        const url = xhr._url;

        if (url && url.includes("line-apps.com")) {
          const contentType = xhr.getResponseHeader("content-type");

          if (contentType && contentType.includes("application/json")) {
            const data = JSON.parse(xhr.responseText);

            if (config.verboseLog) {
              console.log("📡 [XHR响应]", url);
            }

            if (data.code === 0 && data.data) {
              if (url.includes("getProfile")) {
                processProfile(data.data);
              } else if (url.includes("getContacts")) {
                processContacts(data.data);

                // Hook 解密器
                const decryptorHooked = hookLineDecryptor();

                // Hook WebCrypto（语音）
                hookWebCryptoForVoice();

                if (!decryptorHooked) {
                  console.warn("⚠️  解密器 Hook 失败，只能使用网络监听功能");
                }
              }
            }
          }
        }
      } catch (error) {
        if (config.verboseLog) {
          console.error("⚠️  XHR监听器处理错误:", error);
        }
      }
    };

    console.log("✅ XHR 响应处理器已注册");
  }

  // ============ 语音消息功能 ============

  window.playVoice = function (index) {
    if (!window.lineVoiceMessages[index]) {
      console.error(`❌ 语音 [${index}] 不存在`);
      console.log(`💡 可用语音: 0-${window.lineVoiceMessages.length - 1}`);
      return;
    }

    const voice = window.lineVoiceMessages[index];
    const blob = new Blob([voice.data], { type: "audio/m4a" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.controls = true;
    audio.style.cssText =
      "position: fixed; bottom: 20px; right: 20px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);";

    document.body.appendChild(audio);

    console.log(`▶️  播放语音 [${index}]`);
    console.log(`📊 大小: ${voice.size} bytes`);

    audio.play().catch((err) => {
      console.log("⚠️  自动播放被阻止，请手动点击播放按钮");
    });

    audio.addEventListener("ended", () => {
      setTimeout(() => {
        audio.remove();
        URL.revokeObjectURL(url);
      }, 1000);
    });

    return audio;
  };

  window.downloadVoice = function (index, filename) {
    if (!window.lineVoiceMessages[index]) {
      console.error(`❌ 语音 [${index}] 不存在`);
      return;
    }

    const voice = window.lineVoiceMessages[index];

    if (!filename) {
      const date = new Date(voice.timestamp);
      const dateStr = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      filename = `line_voice_${dateStr}.m4a`;
    }

    const blob = new Blob([voice.data], { type: "audio/m4a" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    console.log(`💾 下载语音 [${index}]: ${filename}`);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  window.listVoices = function () {
    if (window.lineVoiceMessages.length === 0) {
      console.log("📭 还没有捕获到语音消息");
      return;
    }

    console.log(`🎵 捕获的语音消息 (${window.lineVoiceMessages.length} 条):\n`);

    window.lineVoiceMessages.forEach((voice, index) => {
      const sizeMB = (voice.size / 1024).toFixed(2);
      const time = new Date(voice.timestamp).toLocaleString();
      console.log(`[${index}] ${time} - ${sizeMB} KB`);
    });
  };

  // ============ 消息查看功能 ============

  window.listMessages = function (limit = 10) {
    if (window.lineDecryptHistory.length === 0) {
      console.log("📭 还没有解密历史");
      return;
    }

    console.log(`📜 最近 ${limit} 条消息:\n`);

    const recent = window.lineDecryptHistory.slice(-limit).reverse();

    recent.forEach((record) => {
      const time = new Date(record.timestamp).toLocaleTimeString();
      const type = record.contentTypeName || "UNKNOWN";
      const sender = record.fromName || "未知";
      const fromMe = record.isMyMessage ? "→" : "←";

      if (record.success) {
        if (record.text) {
          console.log(
            `[${time}] ${fromMe} ${sender} (${type}): ${record.text}`
          );
        } else {
          console.log(`[${time}] ${fromMe} ${sender} (${type})`);
        }
      } else {
        console.log(`[${time}] ❌ 失败: ${record.error}`);
      }
    });

    console.log(`\n💡 总共解密: ${window.lineDecryptHistory.length} 条消息`);
  };

  window.showUserInfo = function () {
    console.log("👤 用户信息:\n");

    if (userCache.myProfile) {
      console.log("我的资料:");
      console.log("  姓名:", userCache.myProfile.displayName);
      console.log("  MID:", userCache.myProfile.mid);
      if (userCache.myProfile.regionCode) {
        console.log("  地区:", userCache.myProfile.regionCode);
      }
    } else {
      console.log("⚠️  尚未捕获到个人资料");
    }

    console.log(`\n联系人数量: ${Object.keys(userCache.contacts).length}`);
  };

  window.clearDecryptHistory = function () {
    window.lineDecryptHistory = [];
    window.lineVoiceMessages = [];
    console.log("✅ 历史记录已清空");
  };

  // ============ 帮助信息 ============

  window.lineDecryptHelp = function () {
    console.log("📖 LINE 消息解密与自动响应监听器 - 使用说明\n");
    console.log("📝 消息查看:");
    console.log("  listMessages(数量)         - 查看最近的消息（默认10条）");
    console.log("  window.lineDecryptHistory  - 完整的解密历史数组");
    console.log("");
    console.log("🎵 语音消息:");
    console.log("  listVoices()        - 列出所有捕获的语音");
    console.log("  playVoice(索引)     - 播放指定语音");
    console.log("  downloadVoice(索引) - 下载指定语音");
    console.log("");
    console.log("👤 用户信息:");
    console.log("  showUserInfo()      - 显示当前用户和联系人信息");
    console.log("");
    console.log("⚙️  配置选项:");
    console.log("  lineDecryptConfig({...}) - 修改配置");
    console.log(
      "    onlyNewMessages: true        - 只记录新消息（默认：true）"
    );
    console.log("    timeWindowSeconds: 0         - 时间窗口（秒，0=不限制）");
    console.log("    silentMode: false            - 静默模式（默认：false）");
    console.log("    verboseLog: false            - 详细日志（默认：false）");
    console.log("    enableNotifications: true    - 桌面通知（默认：true）");

    console.log(
      "    autoClickChat: true          - 自动点击聊天项（默认：true）"
    );
    console.log("");
    console.log("🔧 其他:");
    console.log("  clearDecryptHistory() - 清空所有历史");
    console.log("  lineDecryptHelp()     - 显示此帮助");
  };

  // ============ 初始化 ============

  function initialize() {
    console.log("🚀 正在启动 LINE 消息解密与自动响应监听器...\n");

    // Hook 网络请求（用户数据）
    hookFetch();
    hookXHR();

    // 请求通知权限
    if (config.enableNotifications && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("✅ 已获得通知权限");
        }
      });
    }

    console.log("\n✅ 监听器已全部启动！\n");
    console.log("⚙️  当前配置:");
    console.log("  - 只记录新消息: " + config.onlyNewMessages);
    console.log("  - 桌面通知: " + config.enableNotifications);
    console.log("  - 自动点击聊天: " + config.autoClickChat);
    console.log("");
    console.log("💡 输入 lineDecryptHelp() 查看完整使用说明");
    console.log(
      "💡 现在可以正常使用 LINE，新消息会自动解密、通知并点击对应聊天\n"
    );
  }

  // 启动
  initialize();
})();
