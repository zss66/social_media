export const newTikTokMessage = `
(function () {
  "use strict";

  console.log(
    "%c[WS Preload] 🚀 WebSocket 监听器已注入",
    "color: #00ff00; font-size: 14px; font-weight: bold;"
  );

  const state = {
    wsCount: 0,
    messages: [],
    callbacks: [],
    recentMessages: new Set(),
  };

  // ===== 消息解析器 =====
  function parseBytes(bytes) {
    if (bytes.length < 100) return null;

    const strings = [];
    let str = "";
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] >= 32 && bytes[i] <= 126) {
        str += String.fromCharCode(bytes[i]);
      } else {
        if (str.length >= 3) strings.push(str);
        str = "";
      }
    }
    if (str.length >= 3) strings.push(str);

    let fullText = "";
    try {
      fullText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    } catch (e) {}

    let messageText = null;
    let messageType = null;
    let mediaType = null;
    let senderId = null;

    // 检测媒体类型
    const hasImage = strings.some(
      (s) =>
        s.includes("image_width") ||
        s.includes("image_height") ||
        s.includes("decrypt_key")
    );
    const hasVideo = strings.some((s) => s.includes("video"));
    const hasAudio = strings.some((s) => s.includes("audio"));
    const hasSticker = strings.some((s) => s.includes("sticker"));
    const hasVoice =
      strings.some((s) => s.includes("voice")) ||
      fullText.includes("voice message");
     let receiverId = null;
    // 提取发送者 ID
    const pbMatch = fullText.match(/pb\\s*[:=]?\\s*([0-9]+):([0-9]+):(\\d{10,20}):(\\d{10,20})/);
if (pbMatch) {
  senderId = pbMatch[3];
  receiverId = pbMatch[4];
} else {
  const legacyMatch = fullText.match(/(?:\\+0:1:|30:1:)(\\d{10,20}):(\\d{10,20})/);
  if (legacyMatch) {
    senderId = legacyMatch[1];
    receiverId = legacyMatch[2];
  }
}

// 回退匹配：仅在未匹配时尝试数字串
if (!senderId) {
  const idCandidates = [...fullText.matchAll(/\\d{16,}/g)].map(m => m[0]);
  const plausible = idCandidates.filter(id => !id.startsWith("1180") && !id.startsWith("1762"));
  if (plausible.length) senderId = plausible[0];
}

    // 确定媒体类型
    if (hasVoice) {
      mediaType = "voice";
      messageText =
        fullText.match(/Sent a voice message (\\d+:\\d+)/i)?.[0] || "[语音消息]";
    } else if (hasSticker) {
      mediaType = "sticker";
      messageText = "[贴纸]";
    } else if (hasImage) {
      mediaType = "image";
      messageText = "[图片]";
    } else if (hasVideo) {
      mediaType = "video";
      messageText = "[视频]";
    } else if (hasAudio) {
      mediaType = "audio";
      messageText = "[音频]";
    }

    // 提取文本消息
    const patterns = [
      /\\{"aweType":(\\d+),"text":"([^"]*?)"\\}/g,
      /\\{[^}]*aweType[^}]*:(\\d+)[^}]*text[^}]*:"([^"]*?)"\\}/g,
    ];

    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match) {
        const jsonStr = match[0];
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.text) {
            messageText = parsed.text;
            messageType = parsed.aweType;
            break;
          }
        } catch (e) {
          const textMatch = jsonStr.match(/"text":"([^"]*)"/);
          const typeMatch = jsonStr.match(/"aweType":(\\d+)/);
          if (textMatch) {
            messageText = textMatch[1];
            messageType = typeMatch ? parseInt(typeMatch[1]) : null;
            break;
          }
        }
      }
    }

    if (!messageText || messageText.trim().length < 1) {
      return null;
    }

    let summary = messageText.trim();
    if (mediaType) {
      summary = \`[\${mediaType.toUpperCase()}] \${summary}\`;
    }

    return {
      timestamp: Date.now(),
      size: bytes.length,
      strings,
      messageText,
      messageType,
      mediaType,
      senderId,
      summary,
      fullText,
      rawBytes: bytes,
    };
  }

  // ===== 去重检查 =====
  function isDuplicate(parsed) {
    const hash = \`\${parsed.messageText}_\${Math.floor(parsed.timestamp / 5000)}\`;
    if (state.recentMessages.has(hash)) {
      return true;
    }
    state.recentMessages.add(hash);

    // 清理过期消息
    if (state.recentMessages.size > 100) {
      const now = Date.now();
      for (let key of state.recentMessages) {
        const ts = parseInt(key.split("_")[1]) * 5000;
        if (now - ts > 30000) {
          state.recentMessages.delete(key);
        }
      }
    }
    return false;
  }

  // ===== 消息处理 =====
  async function handleMessage(parsed) {
    if (isDuplicate(parsed)) {
      console.log("[WS Preload] ℹ️ 跳过重复消息:", parsed.summary);
      return;
    }

    // 过滤噪声
    if 
      (!parsed.strings) 
   {
      console.log(parsed);
      console.log("[WS Preload] ℹ️ 过滤噪声消息:", parsed.summary);
      return;
    }

    console.log(
      "%c[WS Preload] 📨 收到消息: " + parsed.summary,
      "color: #00ffff; font-weight: bold;"
    );

    state.messages.push(parsed);

    // 触发所有回调
    state.callbacks.forEach((cb) => {
      try {
        cb(parsed);
      } catch (e) {
        console.error("[WS Preload] 回调执行失败:", e);
      }
    });
  }

  // ===== WebSocket 代理 =====
  const NativeWebSocket = window.WebSocket;

  function ProxyWebSocket(url, protocols) {
    const ws = protocols
      ? new NativeWebSocket(url, protocols)
      : new NativeWebSocket(url);

    const isTikTok = url.includes("tiktok") || url.includes("im-ws");

    if (isTikTok) {
      state.wsCount++;
      console.log(
        \`%c[WS Preload] ✅ TikTok WebSocket #\${state.wsCount} 已拦截\`,
        "color: #00ff00; font-weight: bold;"
      );

      ws.addEventListener("open", () => {
        console.log("%c[WS Preload] 🟢 连接成功", "color: #00ff00;");
      });

      ws.addEventListener("close", () => {
        console.log("%c[WS Preload] 🔴 连接断开", "color: #ff0000;");
      });

      ws.addEventListener("error", (e) => {
        console.log("%c[WS Preload] ⚠️ 错误", "color: #ff9900;", e);
      });

      // 拦截消息
      const originalOnMessage = ws.onmessage;
      ws.onmessage = async (event) => {
        if (originalOnMessage) originalOnMessage(event);
        try {
          let parsed = null;

          if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            parsed = parseBytes(bytes);
          } else if (event.data instanceof ArrayBuffer) {
            const bytes = new Uint8Array(event.data);
            parsed = parseBytes(bytes);
          } else if (typeof event.data === "string" && event.data.trim()) {
            parsed = {
              timestamp: Date.now(),
              size: event.data.length,
              messageText: event.data.trim(),
              summary: event.data.trim(),
              fullText: event.data.trim(),
              messageType: null,
              mediaType: null,
              senderId: null,
            };
          }

          if (parsed) {
            await handleMessage(parsed);
          }
        } catch (e) {
          console.error("[WS Preload] 消息处理异常:", e);
        }

        
      };
    }

    return ws;
  }

  // 复制原型和静态属性
  ProxyWebSocket.prototype = NativeWebSocket.prototype;
  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach((prop, index) => {
    try {
      Object.defineProperty(ProxyWebSocket, prop, {
        value: index,
        writable: false,
        enumerable: true,
        configurable: false,
      });
    } catch (e) {
      ProxyWebSocket[prop] = index;
    }
  });

  window.WebSocket = ProxyWebSocket;

  // ===== 全局 API =====
  window.TikTokWSListener = {
    // 获取所有消息
    getMessages: () => state.messages,

    // 获取统计信息
    getStats: () => ({
      totalMessages: state.messages.length,
      websocketCount: state.wsCount,
      callbackCount: state.callbacks.length,
    }),

    // 显示统计
    showStats: () => {
      console.log(
        "%c📊 WebSocket 监听器统计",
        "color: #00ff00; font-size: 16px; font-weight: bold;"
      );
      console.log(\`消息数: \${state.messages.length}\`);
      console.log(\`WebSocket连接: \${state.wsCount}\`);
      console.log(\`回调数: \${state.callbacks.length}\`);
    },

    // 添加消息回调
    onMessage: (callback) => {
      state.callbacks.push(callback);
      console.log("[WS Preload] ✅ 已添加消息回调");
      return () => {
        const idx = state.callbacks.indexOf(callback);
        if (idx > -1) state.callbacks.splice(idx, 1);
      };
    },

    // 清空消息
    clearMessages: () => {
      state.messages = [];
      state.recentMessages.clear();
      console.log("[WS Preload] 🗑️ 消息已清空");
    },

    // 测试
    test: () => {
      console.log(
        \`[WS Preload] 测试: 代理正常 | 消息\${state.messages.length} | WS\${state.wsCount}\`
      );
    },
  };

  console.log(
    "%c[WS Preload] ✅ WebSocket 代理已激活",
    "color: #00ff00; font-size: 14px; font-weight: bold;"
  );
  console.log("💡 window.TikTokWSListener.test() - 测试");
  console.log("💡 window.TikTokWSListener.showStats() - 查看统计");
})();
(function () {
  "use strict";

  console.log(
    "%c[TikTok Main] 主业务逻辑启动（MPA 优化版）",
    "color: #ff0000; font-size: 18px; font-weight: bold;"
  );

  // 检查 WebSocket 监听器
  if (!window.TikTokWSListener) {
    console.error(
      "%c[TikTok Main] WebSocket 监听器未找到！请确保 preload 已注入",
      "color: #ff0000; font-weight: bold;"
    );
    return;
  }

  console.log(
    "%c[TikTok Main] WebSocket 监听器已就绪",
    "color: #00ff00; font-weight: bold;"
  );

  // ===== 状态管理 =====
  const state = {
    userCache: new Map(),
  };

  // ===== 工具函数 =====

  // 检查是否在聊天页
  function isOnMessagesPage() {
    return (
      window.location.pathname.startsWith("/messages") ||
      window.location.href.includes("/messages")
    );
  }

  // MPA 兼容导航（不刷新，不破坏历史）
  function navigateToMessages() {
    console.log(
      "%c[TikTok Main] 导航到聊天界面（MPA 模式）",
      "color: #ffaa00; font-weight: bold;"
    );

    // 方法1：点击导航按钮（最自然）
    const navBtn = document.querySelector('[data-e2e="nav-messages"]');
    if (navBtn && !navBtn.disabled) {
      console.log("[TikTok Main] 找到导航按钮，模拟点击");
      navBtn.click();
      // 触发 MPA 路由变更
      history.pushState({ page: "messages" }, "", "/messages");
      return true;
    }

    // 方法2：导航链接
    const link = document.querySelector('a[href="/messages"]');
    if (link) {
      console.log("[TikTok Main] 找到导航链接，模拟点击");
      link.click();
      history.pushState({ page: "messages" }, "", "/messages");
      return true;
    }

    // 方法3：直接 pushState（TikTok 支持）
    console.warn("[TikTok Main] 使用 pushState 导航");
    history.pushState({ page: "messages" }, "Messages", "/messages");
    // 触发 TikTok 路由监听
    window.dispatchEvent(new PopStateEvent("popstate", { state: { page: "messages" } }));
    return true;
  }

  // 使用 MutationObserver 等待好友列表（高效无轮询）
  function waitForChatList(maxWaitTime = 10000) {
    return new Promise((resolve) => {
      const target = document.body;
      if (!target) {
        resolve(false);
        return;
      }

      let found = false;
      const observer = new MutationObserver((mutations, obs) => {
        const items = document.querySelectorAll('[data-e2e="chat-list-item"]');
        if (items.length > 0 && !found) {
          found = true;
          obs.disconnect();
          console.log(
            \`%c[TikTok Main] 好友列表已加载（\${items.length} 项）\`,
            "color: #00ff00; font-weight: bold;"
          );
          resolve(true);
        }
      });

      observer.observe(target, {
 steden: true,
        childList: true,
        subtree: true,
      });

      // 超时保护
      setTimeout(() => {
        if (!found) {
          observer.disconnect();
          console.warn("[TikTok Main] 等待好友列表超时");
          resolve(false);
        }
      }, maxWaitTime);
    });
  }

  // ===== 安全 Fetch 拦截器（核心修复）=====
  function setupFetchInterceptor() {
     const OriginalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url || "";

    // 只监听用户信息接口
    if (/\\/tiktok\\/v1\\/im\\/user\\/profile\\//.test(url)) {
      console.log(
        "%c[User Info] 监听到用户信息请求",
        "color: #ffff00; font-weight: bold;",
        url
      );

      try {
        // 执行原始请求
        const response = await OriginalFetch.apply(this, arguments);
        
        // 检查响应是否成功
        if (!response.ok) {
          console.warn("[User Info] 响应失败:", response.status);
          return response;
        }

        // 克隆响应以避免消费原始流
        const clonedResponse = response.clone();
        
        // 异步处理数据提取（不阻塞原始请求）
        clonedResponse.json()
          .then(data => {
            try {
              extractUserInfo(data);
            } catch (err) {
              console.error("[User Info] 数据提取失败:", err);
            }
          })
          .catch(err => {
            console.error("[User Info] JSON 解析失败:", err);
          });

        // 返回原始响应（未被消费）
        return response;
        
      } catch (error) {
        console.error("[User Info] Fetch 拦截异常:", error);
        // 发生错误时，降级为原始请求
        return OriginalFetch.apply(this, arguments);
      }
    }

    // 其他请求完全不干预
    return OriginalFetch.apply(this, arguments);
  };

  // 保持原型链
  window.fetch.toString = OriginalFetch.toString.bind(OriginalFetch);

  console.log(
    "%c[User Info] Fetch 拦截器已安全激活（零影响模式）",
    "color: #00ff00; font-weight: bold;"
  );
  }
  // ===== 用户信息提取器 =====
function extractUserInfo(data) {
  if (!data || !data.users || !Array.isArray(data.users)) {
    console.warn("[User Info] 数据格式异常");
    return;
  }

  console.log(
    \`%c[User Info] 成功获取 \${data.users.length} 个用户信息\`,
    "color: #00ff00; font-weight: bold;"
  );

  data.users.forEach((user, index) => {
    const profile = user.im_user_profile;
    if (!profile || !profile.user_id_str) {
      console.warn(\`[User Info] 用户 #\${index} 数据不完整\`);
      return;
    }

    const userInfo = {
      // 基础信息
      userId: profile.user_id_str,
      username: profile.unique_id || "Unknown",
      nickname: profile.nick_name || "",
      signature: profile.signature || "",
      
      // 头像
      avatar: profile.avatars?.avatar_medium?.url_list?.[0] || null,
      avatarThumb: profile.avatars?.avatar_small?.url_list?.[0] || null,
      
      // 认证信息
      verified: profile.user_verify_type === 1,
      verifyReason: profile.user_verify_reason || "",
      enterpriseVerified: !!profile.enterprise_verify_reason,
      
      // 关系状态
      followStatus: profile.follow_status || 0, // 0=未关注 1=已关注
      followerStatus: profile.follower_status || 0, // 0=未被关注 1=被关注
      mafStatus: profile.maf_status || 0, // 互关状态
      
      // 屏蔽信息
      blocked: user.im_user_profile?.block_info?.block || false,
      blockedBy: user.im_user_profile?.block_info?.blocked_by || false,
      
      // 分享权限
      shareStatus: user.share_permission?.user_share_status || 0,
      
      // 其他
      deleted: profile.deleted === 1,
      updateTime: profile.update_time || Date.now(),
    };

    // 存储到缓存
    state.userCache.set(userInfo.userId, userInfo);
    if (!window.TikTokUserCache) window.TikTokUserCache = new Map();
    window.TikTokUserCache.set(userInfo.userId, userInfo);
    // 格式化输出
    console.group(\`👤 用户信息 #\${index + 1}\`);
    console.log("%c基础信息", "color: #00ffff; font-weight: bold;");
    console.table({
      用户名: userInfo.username,
      昵称: userInfo.nickname,
      ID: userInfo.userId,
      签名: userInfo.signature || "无",
    });

    console.log("%c状态信息", "color: #ffaa00; font-weight: bold;");
    console.table({
      认证: userInfo.verified ? "✓ 已认证" : "✗ 未认证",
      关注状态: getFollowStatusText(userInfo.followStatus),
      粉丝状态: getFollowerStatusText(userInfo.followerStatus),
      互关: userInfo.mafStatus === 1 ? "✓ 互关" : "✗ 单向",
      屏蔽: userInfo.blocked ? "✓ 已屏蔽" : "✗ 正常",
      被屏蔽: userInfo.blockedBy ? "✓ 被屏蔽" : "✗ 正常",
    });

    if (userInfo.avatar) {
      console.log("%c头像:", "color: #ff69b4;", userInfo.avatar);
    }
    console.groupEnd();
  });

  console.log(
    \`%c[User Info] 缓存已更新，当前共 \${state.userCache.size} 个用户\`,
    "color: #00ff00; font-weight: bold;"
  );
}
  function getFollowStatusText(status) {
  const map = {
    0: "未关注",
    1: "已关注",
    2: "好友",
  };
  return map[status] || \`未知(\${status})\`;
}

function getFollowerStatusText(status) {
  const map = {
    0: "未被关注",
    1: "被关注",
  };
  return map[status] || \`未知(\${status})\`;
}
  // 主动获取用户信息
  async function fetchUserInfoIfMissing(userId) {
   if (!userId) {
    console.error("[User Info] userId 不能为空");
    return null;
  }

  // 检查缓存
  if (state.userCache.has(userId)) {
    console.log(\`[User Info] 从缓存获取: \${userId}\`);
    return state.userCache.get(userId);
  }

  try {
    console.log(\`[User Info] 主动请求用户信息: \${userId}\`);
    const url = \`https://www.tiktok.com/tiktok/v1/im/user/profile/?aid=1988&user_ids=\${encodeURIComponent(
      JSON.stringify([userId])
    )}\`;

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Accept": "application/json",
      }
    });

    if (!response.ok) {
      console.error(\`[User Info] 请求失败: \${response.status}\`);
      return null;
    }

    const data = await response.json();
    extractUserInfo(data);
    
    return state.userCache.get(userId) || null;
    
  } catch (error) {
    console.error("[User Info] 主动获取失败:", error);
    return null;
  }
  }

  // 获取好友列表
  function getAllChatUsers() {
    const items = document.querySelectorAll('[data-e2e="chat-list-item"]');
    return Array.from(items).map(item => {
      const nickEl = item.querySelector('[class*="PInfoNickname"]');
      return {
        nickname: nickEl?.textContent.trim() || "",
        element: item,
      };
    }).filter(u => u.nickname);
  }

  // 点击对话项
  function clickChatItemByUsername(username) {
    if (!username) return false;

    const items = document.querySelectorAll('[data-e2e="chat-list-item"]');
    for (const item of items) {
      const nickEl = item.querySelector('[class*="PInfoNickname"]');
      if (nickEl?.textContent.trim() === username) {
        console.log(\`[TikTok Main] 打开对话: \${username}\`);
        item.click();
        return true;
      }
    }
    console.warn(\`[TikTok Main] 未找到用户: \${username}\`);
    return false;
  }

  // ===== 消息处理核心 =====
  async function handleIncomingMessage(parsed) {
      if (parsed.senderId) {
    // 优先查全局缓存（由 Fetch 拦截器维护）
    const cached =
      window.TikTokUserCache?.get(parsed.senderId) ||
      state.userCache.get(parsed.senderId);

    if (cached) {
      console.log(\`[User Info] 命中缓存用户 \${cached.username} (\${cached.userId})\`);
      parsed.senderInfo = cached;
    } else {
      console.log(\`[User Info] 未命中缓存，主动请求 \${parsed.senderId}\`);
      parsed.senderInfo = await fetchUserInfoIfMissing(parsed.senderId);
    }
  }

    const info = parsed.senderInfo;
    console.log(
      "[TikTok Listener] ℹ️ 收到新消息:",
      parsed.summary,
      "from",
      parsed,
      info ? info.username : "未知发送者"
    );
    const label = info
      ? \`@\${info.username} (\${info.nickname})\`
      : parsed.senderId ? \`ID:\${parsed.senderId}\` : "未知";

    console.log("%c" + "═".repeat(60), "color: #00ff00;");
    console.log("%c发送者: " + label, "color: #ff69b4; font-weight: bold;");
    console.log("%c消息: " + parsed.summary, "color: #00ffff; font-weight: bold;");
    console.log(\`大小: \${parsed.size} bytes | 时间: \${new Date(parsed.timestamp).toLocaleString()}\`);

    if (info) {
      console.group("用户详情");
      console.table({
        用户名: info.username,
        昵称: info.nickname,
        ID: info.userId,
        认证: info.verified ? "是" : "否",
      });
      console.groupEnd();
    }
    console.log("%c" + "═".repeat(60), "color: #00ff00;");

    // 自动打开对话 + 知识库
    if (info?.nickname && pluginConfig?.knowledge?.enableRetrieval && pluginConfig?.knowledge?.selectedKnowledgeBase) {
      if (!isOnMessagesPage()) {
        navigateToMessages();
        const loaded = await waitForChatList();
        if (loaded) {
          setTimeout(() => clickChatItemByUsername(info.nickname), 800);
        }
      } else {
        setTimeout(() => clickChatItemByUsername(info.nickname), 400);
      }
      console.log("[TikTok Main] 自动打开对话:", info.nickname);
      // 知识库检索
      if (!parsed.mediaType && parsed.messageText ) {
        const response = await window.electronAPI.sendKnowledgeBaseMessage(
          parsed.messageText,
          pluginConfig.knowledge
        );
        window?.replaceAndSend?.(response);
      }
    }
  }

  // ===== 初始化 =====
  window.TikTokWSListener.onMessage(handleIncomingMessage);
  setupFetchInterceptor();

  // ===== 全局 API =====
  window.TikTokMain = {
    getUserCache: () => [...state.userCache.values()],
    getAllChats: () => getAllChatUsers(),
    openChat: (name) => clickChatItemByUsername(name),
    test: () => {
      console.log(\`[TikTok Main] 运行中 | 用户缓存: \${state.userCache.size}\`);
    },
  };

  console.log("%c[TikTok Main] 初始化完成（MPA 优化版）", "color: #00ff00; font-size: 16px; font-weight: bold;");
  console.log("window.TikTokMain.test() - 测试");
  setTimeout(() => window.TikTokMain.test(), 2000);
})();
`;
