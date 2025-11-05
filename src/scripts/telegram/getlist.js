// a是telegram的react版本
export const telegramGetlists = `
(async () => {
  console.log("[telegram getlists] IndexedDB 脚本开始");

  // 自动获取当前账户编号，默认是 1
  const urlParams = new URLSearchParams(window.location.search);
  const accountNum = urlParams.get("account") || "1";
  console.log("[telegram getlists] 当前账户编号:", accountNum);
  const dbName = "tweb-account-" + accountNum;

  const openReq = indexedDB.open(dbName);

  openReq.onsuccess = function (event) {
    const db = event.target.result;

    const getAll = (storeName) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    };

    (async () => {
      const users = await getAll("users");
      const chats = await getAll("chats");

      const allContactsMap = new Map();

      const userList = users.map((user) => {
        const contact = {
          peerId: String(user.id),
          type: "private",
          name: [user.first_name, user.last_name].filter(Boolean).join(" "),
          username: user.username || null,
          phone: user.phone || null,
          lastMessage: "", // IndexedDB 中没有此数据，保留空
          time: "",
          unreadCount: "0",
          raw: user,
        };
        allContactsMap.set(contact.peerId, contact);
        return contact;
      });

      const chatList = chats.map((chat) => {
        const peerId = String(-Math.abs(chat.id)); // 群组/频道 id 统一为负数
        const contact = {
          peerId,
          type: "group",
          name: chat.title || "",
          username: chat.username || null,
          phone: null,
          lastMessage: "",
          time: "",
          unreadCount: "0",
          raw: chat,
        };
        allContactsMap.set(peerId, contact);
        return contact;
      });

      console.log("[TG IndexedDB 提取完成]", allContactsMap.size, "条记录");

      // 工具函数
      const waitForElement = (selector, timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const interval = 100;
          let waited = 0;
          const timer = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
              clearInterval(timer);
              resolve(el);
            } else if (waited >= timeout) {
              clearInterval(timer);
              reject(new Error("等待元素超时: " + selector));
            }
            waited += interval;
          }, interval);
        });
      };

      function simulateClick(el) {
        const eventOptions = {
          bubbles: true,
          cancelable: true,
          view: window,
        };
        el.dispatchEvent(new MouseEvent("mousedown", eventOptions));
        el.dispatchEvent(new MouseEvent("mouseup", eventOptions));
        el.dispatchEvent(new MouseEvent("click", eventOptions));
      }

      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

      const scrollChatToBottom = async (maxTries = 10, delay = 400) => {
        try {
          const bubble = await waitForElement(
            "div.bubbles.has-groups.has-sticky-dates"
          );

          let tries = 0;
          while (tries < maxTries) {
            if (bubble.classList.contains("scrolled-down")) {
              console.log("[已滚动到底部]");
              break;
            }

            // 尝试点击"滚动到底部"按钮
            const goDownButton = document.querySelector(
              "button.bubbles-go-down.btn-corner"
            );
            if (goDownButton) {
              simulateClick(goDownButton);
              console.log("[点击] bubbles-go-down 成功");
            } else {
              console.warn("[未找到] bubbles-go-down 按钮");
            }

            await sleep(delay);
            tries++;
          }

          if (!bubble.classList.contains("scrolled-down")) {
            console.warn("[警告] 多次尝试后仍未滚动到底部");
          }
        } catch (err) {
          console.error("[错误] 滚动失败:", err);
        }
      };

      // 检查当前是否已打开指定对话
      const isCurrentChat = (peerId) => {
        const currentPeerEl = document.querySelector(
          'div.top>.user-title .peer-title[data-peer-id="' + peerId + '"]'
        );
        if (currentPeerEl) {
          console.log("[已打开] peerId:", peerId);
          return true;
        }
        return false;
      };

      // 根据 peerId 打开对话（新增功能）
      const openChatByPeerId = async (peerId) => {
        // 检查是否已经打开
        if (isCurrentChat(peerId)) {
          console.log("[无需操作] 对话已打开, peerId:", peerId);
          return { success: true, alreadyOpen: true };
        }

        const contact = allContactsMap.get(String(peerId));
        if (!contact) {
          console.warn("[未找到联系人] peerId:", peerId);
          return { success: false, error: "联系人不存在" };
        }

        console.log("[准备打开对话]", contact.name, "peerId:", peerId);

        // 尝试在侧边栏找到对话项并点击
        const el = document.querySelector('a[data-peer-id="' + peerId + '"]');
        if (el) {
          simulateClick(el);
          console.log("[点击侧边栏对话] 成功");
          setTimeout(() => {
            scrollChatToBottom();
          }, 1000);
          return { success: true, alreadyOpen: false };
        } else {
          // 如果侧边栏没有加载,则跳转 URL
          const jumpUrl =
            "https://web.telegram.org/k/?account=" +
            accountNum +
            "#" +
            peerId;
          console.log("[未加载 DOM 元素，跳转至页面]", jumpUrl);
          window.location.href = jumpUrl;
          setTimeout(() => {
            scrollChatToBottom();
          }, 1000);
          return { success: true, alreadyOpen: false, redirected: true };
        }
      };

      // 根据昵称打开对话（原有功能）
      const openChatByNickname = async (nickname, exact = false) => {
        const matcher = exact
          ? (c) => c.name === nickname
          : (c) => c.name.includes(nickname);

        const contact = Array.from(allContactsMap.values()).find(matcher);
        if (!contact) {
          console.warn("[未找到]", nickname);
          return false;
        }

        // 复用 openChatByPeerId
        return await openChatByPeerId(contact.peerId);
      };

      window.TelegramContacts = {
        getAll: () => Array.from(allContactsMap.values()),
        openChatByNickname,
        openChatByPeerId, // 新增方法
        isCurrentChat, // 新增方法
        loadAllContacts: async () => {}, // 不再需要滚动加载
        getStats: () => ({
          total: allContactsMap.size,
          groups: Array.from(allContactsMap.values()).filter(
            (c) => c.type === "group"
          ).length,
          private: Array.from(allContactsMap.values()).filter(
            (c) => c.type === "private"
          ).length,
        }),
      };

      const stats = window.TelegramContacts.getStats();
      console.log("[加载完成]", stats);
      console.log("[使用方法]");
      console.log("  - 打开对话: window.TelegramContacts.openChatByPeerId('1611490212')");
      console.log("  - 检查是否已打开: window.TelegramContacts.isCurrentChat('1611490212')");
      console.log("  - 按昵称打开: window.TelegramContacts.openChatByNickname('z ss', true)");
    })();
  };

  openReq.onerror = function () {
    console.error("无法打开数据库:", dbName);
  };
})();



`;
