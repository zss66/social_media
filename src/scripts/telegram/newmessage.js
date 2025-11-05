export const telegramNewmessageScript = `
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const accountNum = urlParams.get("account") || "1";
  console.log("[telegram getlists] 当前账户编号:", accountNum);
  const dbName = "tweb-account-" + accountNum;
  const storeName = "dialogs";

  // 性能优化配置
  const config = {
    activeInterval: 200, // 活跃期间隔（检测到变化后）
    idleInterval: 1000, // 空闲期间隔（长时间无变化）
    transitionThreshold: 5, // 连续无变化次数后转入空闲期
    maxBatchSize: 100, // 单次处理的最大数据量
    useRAF: true, // 使用 requestAnimationFrame 优化
    enableDiff: true, // 启用增量对比（只对比变化的字段）
    trackMessageContent: true, // 追踪消息内容变化
  };

  let db = null;
  let previousData = null;
  let previousMap = null; // 使用 Map 加速查找
  let isActive = false;
  let noChangeCount = 0;
  let currentInterval = config.activeInterval;
  let pollingTimer = null;
  let changeCount = 0;
  let perfStats = {
    totalChecks: 0,
    totalChanges: 0,
    avgCheckTime: 0,
    totalCheckTime: 0,
  };

  const listeners = {
    add: [],
    update: [],
    delete: [],
    newMessage: [], // 新增：专门监听新消息
  };

  console.log("🚀 高性能轮询监听器初始化...");

  // 获取当前用户 peerId 从 localStorage
  let currentUserPeerId = null;
  function getCurrentUserPeerId() {
    try {
      const accountKey = 'account' + accountNum;
      const accountData = localStorage.getItem(accountKey);
      if (accountData) {
        const account = JSON.parse(accountData);
        return account.userId?.toString() || null;
      }
      console.warn("[telegram] 未找到 localStorage 中的账户数据:", accountKey);
      return null;
    } catch (error) {
      console.error("[telegram] 获取 peerId 失败:", error);
      return null;
    }
  }

  // ==================== 性能优化的数据处理 ====================

  // 生成对话唯一键（缓存结果）
  const keyCache = new WeakMap();
  function getDialogKey(dialog) {
    if (keyCache.has(dialog)) {
      return keyCache.get(dialog);
    }

    if (!dialog.peer) return null;

    const peerType = dialog.peer._;
    const peerId = dialog.peer.user_id || dialog.peer.chat_id || dialog.peer.channel_id;
    const key = peerType + '-' + peerId;

    keyCache.set(dialog, key);
    return key;
  }

  // 解析消息类型
  function getMessageType(topMessage) {
    if (!topMessage) return "unknown";

    // 文本消息
    if (topMessage.message && topMessage.message.trim()) {
      return "text";
    }

    // 媒体消息
    if (topMessage.media) {
      const mediaType = topMessage.media._;

      if (mediaType === "messageMediaPhoto") {
        return "photo";
      }

      if (mediaType === "messageMediaDocument" && topMessage.media.document) {
        const docType = topMessage.media.document.type;
        if (docType === "round") return "video_message"; // 圆形视频消息
        if (docType === "voice") return "voice";
        if (docType === "video") return "video";
        if (docType === "audio") return "audio";
        return "file";
      }

      return "media";
    }

    return "empty";
  }

  // 提取消息摘要（用于显示）
  async function getMessageSummary(topMessage) {
    if (!topMessage) return null;

    // 检查消息是否为自己发送
    if (!currentUserPeerId) {
      currentUserPeerId = getCurrentUserPeerId();
    }
    if (topMessage.fromId && topMessage.fromId.toString() === currentUserPeerId) {
      console.log("[telegram] 忽略自己发送的消息:", topMessage.message);
      return null; // 自己发送的消息直接返回 null，不触发后续处理
    }

    const type = getMessageType(topMessage);

    switch (type) {
      case "text":
        console.log("[telegram] 新消息:", topMessage.message);
        const peerId = topMessage.peerId;
        
        console.log('pluginConfig:', pluginConfig);
        if (
          pluginConfig?.knowledge?.enableRetrieval &&
          pluginConfig?.knowledge?.selectedKnowledgeBase 
        ) {
          window.TelegramContacts.openChatByPeerId(peerId);
          // TODO: 处理知识库相关逻辑
          if (Number(peerId) > 0) {
            const response = await window.electronAPI.sendKnowledgeBaseMessage(
              topMessage.message,
              pluginConfig?.knowledge
            );
            window?.replaceAndSend(response);
          }
          else{
            console.log('非私聊消息，暂时不启用AI回复功能:', topMessage.message);
          }
        }
        
        return topMessage.message.substring(0, 50);

      case "photo":
        return "[图片]";

      case "video_message":
        return "[视频消息]";

      case "voice":
        const voiceDuration = topMessage.media?.document?.duration || 0;
        return '[语音 ' + voiceDuration + 's]';

      case "video":
        return "[视频]";

      case "audio":
        return "[音频]";

      case "file":
        const fileName = topMessage.media?.document?.file_name || "文件";
        return '[文件: ' + fileName + ']';

      default:
        return "[消息]";
    }
  }

  // 提取消息的关键信息（用于变化检测）
  function extractMessageInfo(topMessage) {
    if (!topMessage) return null;

    return {
      id: topMessage.id || topMessage.mid,
      date: topMessage.date,
      message: topMessage.message || "",
      fromId: topMessage.from_id,
      type: getMessageType(topMessage),
      mediaType: topMessage.media?._,
      mediaId: topMessage.media?.document?.id || topMessage.media?.photo?.id,
      hasMedia: !!topMessage.media,
      pFlags: Object.keys(topMessage.pFlags || {})
        .sort()
        .join(","),
    };
  }

  // 只提取关键字段（包含完整的 topMessage 信息）
  function extractKeyFields(dialog) {
    const messageInfo = extractMessageInfo(dialog.topMessage);

    return {
      top_message: dialog.top_message,
      unread_count: dialog.unread_count || 0,
      read_inbox_max_id: dialog.read_inbox_max_id || 0,
      read_outbox_max_id: dialog.read_outbox_max_id || 0,
      pinned: dialog.pFlags?.pinned ? 1 : 0,
      folder_id: dialog.folder_id || 0,
      message_id: messageInfo?.id,
      message_date: messageInfo?.date,
      message_content: messageInfo?.message,
      message_type: messageInfo?.type,
      message_media_id: messageInfo?.mediaId,
      message_flags: messageInfo?.pFlags,
    };
  }

  // 快速对比（包含消息内容）
  function hasChanges(oldFields, newFields) {
    if (
      oldFields.top_message !== newFields.top_message ||
      oldFields.unread_count !== newFields.unread_count ||
      oldFields.read_inbox_max_id !== newFields.read_inbox_max_id ||
      oldFields.read_outbox_max_id !== newFields.read_outbox_max_id ||
      oldFields.pinned !== newFields.pinned ||
      oldFields.folder_id !== newFields.folder_id
    ) {
      return true;
    }

    if (config.trackMessageContent) {
      return (
        oldFields.message_id !== newFields.message_id ||
        oldFields.message_date !== newFields.message_date ||
        oldFields.message_content !== newFields.message_content ||
        oldFields.message_type !== newFields.message_type ||
        oldFields.message_media_id !== newFields.message_media_id ||
        oldFields.message_flags !== newFields.message_flags
      );
    }

    return false;
  }

  // 获取变化的字段
  function getChangedFields(oldFields, newFields) {
    const changes = {};
    const fields = [
      "top_message",
      "unread_count",
      "read_inbox_max_id",
      "read_outbox_max_id",
      "pinned",
      "folder_id",
      "message_id",
      "message_date",
      "message_content",
      "message_type",
      "message_media_id",
      "message_flags",
    ];

    for (const field of fields) {
      if (oldFields[field] !== newFields[field]) {
        changes[field] = { old: oldFields[field], new: newFields[field] };
      }
    }

    return changes;
  }

  // 判断是否为新消息
  function isNewMessage(changes) {
    return (
      changes.message_id && changes.message_id.old !== changes.message_id.new
    );
  }

  // ==================== 数据库操作 ====================

  async function openDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = (e) => {
        db = e.target.result;
        resolve(db);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAllData() {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ==================== 高性能变化检测 ====================

  async function checkChanges() {
    const startTime = performance.now();
    perfStats.totalChecks++;

    try {
      const currentData = await getAllData();

      if (!previousData) {
        previousData = currentData;
        previousMap = new Map();

        currentData.forEach((dialog) => {
          const key = getDialogKey(dialog);
          if (key) {
            previousMap.set(key, {
              fields: extractKeyFields(dialog),
              rawDialog: dialog,
            });
          }
        });

        console.log('📊 初始化: ' + currentData.length + ' 个对话');
        return false;
      }

      const currentMap = new Map();
      currentData.forEach((dialog) => {
        const key = getDialogKey(dialog);
        if (key) {
          currentMap.set(key, {
            fields: extractKeyFields(dialog),
            rawDialog: dialog,
          });
        }
      });

      let hasAnyChanges = false;

      for (const [key, currData] of currentMap) {
        const prevData = previousMap.get(key);
        const currFields = currData.fields;

        if (!prevData) {
          hasAnyChanges = true;
          changeCount++;
          perfStats.totalChanges++;

          triggerListeners("add", {
            key,
            fields: currFields,
            dialog: currData.rawDialog,
          });

          if (!config.quiet) {
            console.log('✅ 新对话 [' + key + '] #' + changeCount);
          }
        } else if (hasChanges(prevData.fields, currFields)) {
          hasAnyChanges = true;
          changeCount++;
          perfStats.totalChanges++;

          const changes = getChangedFields(prevData.fields, currFields);

          if (isNewMessage(changes)) {
            const topMessage = currData.rawDialog.topMessage;
            const messageType = getMessageType(topMessage);
            const messageSummary = await getMessageSummary(topMessage);

            if (messageSummary) {
              triggerListeners("newMessage", {
                key,
                message: topMessage,
                messageType,
                summary: messageSummary,
                dialog: currData.rawDialog,
                changes,
              });

              if (!config.quiet) {
                console.log(
                  '📨 新消息 [' + key + '] ' + messageType + ': ' + messageSummary + ' #' + changeCount
                );
              }
            }
          }

          triggerListeners("update", {
            key,
            fields: currFields,
            changes,
            dialog: currData.rawDialog,
          });

          if (!config.quiet && !isNewMessage(changes)) {
            console.log('🔄 更新 [' + key + '] #' + changeCount, changes);
          }
        }
      }

      for (const [key, prevData] of previousMap) {
        if (!currentMap.has(key)) {
          hasAnyChanges = true;
          changeCount++;
          perfStats.totalChanges++;

          triggerListeners("delete", {
            key,
            fields: prevData.fields,
            dialog: prevData.rawDialog,
          });

          if (!config.quiet) {
            console.log('❌ 删除 [' + key + '] #' + changeCount);
          }
        }
      }

      previousData = currentData;
      previousMap = currentMap;

      if (hasAnyChanges) {
        noChangeCount = 0;
        currentInterval = config.activeInterval;
        isActive = true;
      } else {
        noChangeCount++;
        if (noChangeCount >= config.transitionThreshold) {
          currentInterval = config.idleInterval;
          isActive = false;
        }
      }

      const checkTime = performance.now() - startTime;
      perfStats.totalCheckTime += checkTime;
      perfStats.avgCheckTime = perfStats.totalCheckTime / perfStats.totalChecks;

      return hasAnyChanges;
    } catch (error) {
      console.error("❌ 检测出错:", error);
      return false;
    }
  }

  // ==================== 触发监听器 ====================

  function triggerListeners(type, data) {
    const typeListeners = listeners[type];
    if (!typeListeners || typeListeners.length === 0) return;

    Promise.resolve().then(() => {
      typeListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('监听器执行出错 [' + type + ']:', error);
        }
      });
    });
  }

  // ==================== 轮询控制 ====================

  async function poll() {
    if (!isActive && !config.forceActive) {
      await checkChanges();
      pollingTimer = setTimeout(poll, currentInterval);
    } else {
      if (config.useRAF) {
        await checkChanges();
        requestAnimationFrame(() => {
          pollingTimer = setTimeout(poll, currentInterval);
        });
      } else {
        await checkChanges();
        pollingTimer = setTimeout(poll, currentInterval);
      }
    }
  }

  async function start() {
    if (pollingTimer) return;

    try {
      await openDB();
      console.log("✅ 连接成功");

      currentUserPeerId = getCurrentUserPeerId();
      console.log("当前用户 peerId:", currentUserPeerId);

      await checkChanges();
      poll();

      console.log("🔄 轮询已启动");
      console.log('   活跃间隔: ' + config.activeInterval + 'ms');
      console.log('   空闲间隔: ' + config.idleInterval + 'ms');
    } catch (error) {
      console.error("❌ 启动失败:", error);
    }
  }

  function stop() {
    if (pollingTimer) {
      clearTimeout(pollingTimer);
      pollingTimer = null;
    }
    if (db) {
      db.close();
      db = null;
    }
    previousData = null;
    previousMap = null;
    console.log("⏹️ 已停止");
  }

  // ==================== 全局 API ====================

  window.__dialogMonitor = {
    start,
    stop,

    restart() {
      stop();
      changeCount = 0;
      noChangeCount = 0;
      perfStats = {
        totalChecks: 0,
        totalChanges: 0,
        avgCheckTime: 0,
        totalCheckTime: 0,
      };
      setTimeout(start, 100);
    },

    config(options) {
      Object.assign(config, options);
      console.log("⚙️ 配置已更新");
      this.restart();
      return this;
    },

    on(event, callback) {
      if (listeners[event]) {
        listeners[event].push(callback);
        return this;
      }
      console.error("❌ 未知事件:", event);
      return this;
    },

    off(event, callback) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((cb) => cb !== callback);
      }
      return this;
    },

    async checkNow() {
      return await checkChanges();
    },

    async getAll() {
      if (!db) {
        await openDB();
      }
      return await getAllData();
    },

    stats() {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📊 性能统计");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("状态:", pollingTimer ? "✅ 运行中" : "❌ 已停止");
      console.log("模式:", isActive ? "⚡ 活跃" : "💤 空闲");
      console.log("当前间隔:", currentInterval + "ms");
      console.log("对话数:", previousData ? previousData.length : 0);
      console.log("");
      console.log("性能指标:");
      console.log("  检查次数:", perfStats.totalChecks);
      console.log("  变化次数:", perfStats.totalChanges);
      console.log("  平均耗时:", perfStats.avgCheckTime.toFixed(2) + "ms");
      console.log("  总耗时:", perfStats.totalCheckTime.toFixed(2) + "ms");
      console.log(
        "  变化率:",
        ((perfStats.totalChanges / perfStats.totalChecks) * 100 || 0).toFixed(1) + "%"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return perfStats;
    },

    performance: {
      ultraFast() {
        return window.__dialogMonitor.config({
          activeInterval: 100,
          idleInterval: 500,
          transitionThreshold: 3,
          useRAF: true,
        });
      },

      fast() {
        return window.__dialogMonitor.config({
          activeInterval: 200,
          idleInterval: 1000,
          transitionThreshold: 5,
          useRAF: true,
        });
      },

      balanced() {
        return window.__dialogMonitor.config({
          activeInterval: 300,
          idleInterval: 1500,
          transitionThreshold: 8,
          useRAF: false,
        });
      },

      eco() {
        return window.__dialogMonitor.config({
          activeInterval: 500,
          idleInterval: 3000,
          transitionThreshold: 10,
          useRAF: false,
        });
      },
    },

    quiet(enable = true) {
      config.quiet = enable;
      console.log(enable ? "🔇 静默模式已启用" : "🔊 静默模式已关闭");
      return this;
    },
  };

  // 自动启动
  start();

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 高性能消息监听器已启动！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("🎮 基础命令：");
  console.log("  __dialogMonitor.stop()         停止");
  console.log("  __dialogMonitor.restart()      重启");
  console.log("  __dialogMonitor.stats()        性能统计");
  console.log("  __dialogMonitor.quiet()        静默模式");
  console.log("");
  console.log("⚡ 性能模式：");
  console.log("  __dialogMonitor.performance.ultraFast()  极速 (100/500ms)");
  console.log("  __dialogMonitor.performance.fast()       快速 (200/1000ms) ⭐推荐");
  console.log("  __dialogMonitor.performance.balanced()   平衡 (300/1500ms)");
  console.log("  __dialogMonitor.performance.eco()        省电 (500/3000ms)");
  console.log("");
  console.log("📡 事件监听：");
  console.log("  // 监听所有更新");
  console.log('  __dialogMonitor.on("update", data => {');
  console.log("    console.log(data.key, data.changes);");
  console.log("  });");
  console.log("");
  console.log("  // 监听新消息（重点！）");
  console.log('  __dialogMonitor.on("newMessage", data => {');
  console.log("    console.log('新' + data.messageType + '消息:', data.summary);");
  console.log('    console.log("完整消息对象:", data.message);');
  console.log("  });");
  console.log("");
  console.log("💡 消息类型支持：");
  console.log("  ✅ 文本消息 (text)");
  console.log("  ✅ 图片消息 (photo)");
  console.log("  ✅ 视频消息 (video_message)");
  console.log("  ✅ 语音消息 (voice)");
  console.log("  ✅ 视频文件 (video)");
  console.log("  ✅ 音频文件 (audio)");
  console.log("  ✅ 普通文件 (file)");
  console.log("");
  console.log("🔧 性能优化特性：");
  console.log("  • 自适应间隔（有变化时快速，无变化时慢速）");
  console.log("  • 深度消息内容追踪");
  console.log("  • 智能消息类型识别");
  console.log("  • Map 缓存（O(1) 查找）");
  console.log("  • 微任务调度（避免阻塞）");
  console.log("  • WeakMap 缓存（自动内存管理）");
  console.log("");
})();
`;
