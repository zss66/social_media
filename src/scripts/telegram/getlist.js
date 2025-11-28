export const telegramGetlists = `
(() => {
  console.log("[telegram getlists] 🔍 正在监听登录状态...");

  // 检查当前是否已登录
  const isLoggedIn = () => {
    const authPage = document.querySelector("#auth-pages");
    const chatPage = document.querySelector("#page-chats");
    return (
      (!authPage || authPage.style.display === "none") &&
      chatPage &&
      chatPage.style.display === ""
    );
  };

  // 主逻辑封装成函数
  const runTelegramGetLists = async () => {
    if (window.__TELEGRAM_GETLISTS_LOADED__) return;
    window.__TELEGRAM_GETLISTS_LOADED__ = true;

    console.log("[telegram getlists] ✅ 检测到登录成功，开始执行主逻辑");

    const urlParams = new URLSearchParams(window.location.search);
    const accountNum = urlParams.get("account") || "1";
    const dbName = "tweb-account-" + accountNum;
    console.log("[telegram getlists] 当前账户编号:", accountNum);

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

        users.forEach((user) => {
          const contact = {
            peerId: String(user.id),
            type: "private",
            name: [user.first_name, user.last_name].filter(Boolean).join(" "),
            username: user.username || null,
            phone: user.phone || null,
            raw: user,
          };
          allContactsMap.set(contact.peerId, contact);
        });

        chats.forEach((chat) => {
          const peerId = String(-Math.abs(chat.id));
          const contact = {
            peerId,
            type: "group",
            name: chat.title || "",
            username: chat.username || null,
            phone: null,
            raw: chat,
          };
          allContactsMap.set(peerId, contact);
        });

        console.log("[TG IndexedDB 提取完成]", allContactsMap.size, "条记录");

        // 实用函数
        const waitForElement = (selector, timeout = 10000) => {
          return new Promise((resolve, reject) => {
            const observer = new MutationObserver(() => {
              const el = document.querySelector(selector);
              if (el) {
                observer.disconnect();
                resolve(el);
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
              observer.disconnect();
              reject(new Error("等待元素超时: " + selector));
            }, timeout);
          });
        };

        const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
        const simulateClick = (el) => {
          ["mousedown", "mouseup", "click"].forEach((type) =>
            el.dispatchEvent(new MouseEvent(type, { bubbles: true }))
          );
        };

        const scrollChatToBottom = async () => {
          try {
            const bubble = await waitForElement(
              "div.bubbles.has-groups.has-sticky-dates"
            );
            if (!bubble.classList.contains("scrolled-down")) {
              const goDownButton = document.querySelector(
                "button.bubbles-go-down.btn-corner"
              );
              if (goDownButton) simulateClick(goDownButton);
            }
          } catch (err) {
            console.warn("[scrollChatToBottom] 错误:", err);
          }
        };

        const isCurrentChat = (peerId) => {
          return !!document.querySelector(
            'div.top>.user-title .peer-title[data-peer-id="' + peerId + '"]'
          );
        };

        const openChatByPeerId = async (peerId) => {
          if (isCurrentChat(peerId)) {
            console.log("[已打开] peerId:", peerId);
            return { success: true, alreadyOpen: true };
          }
          const contact = allContactsMap.get(String(peerId));
          if (!contact) {
            console.warn("[未找到联系人] peerId:", peerId);
            return { success: false };
          }
          const el = document.querySelector('a[data-peer-id="' + peerId + '"]');
          if (el) {
            simulateClick(el);
            setTimeout(scrollChatToBottom, 800);
          } else {
            const jumpUrl =
              "https://web.telegram.org/k/?account=" +
              accountNum +
              "#" +
              peerId;
            console.log("[跳转至]", jumpUrl);
            window.location.href = jumpUrl;
            setTimeout(scrollChatToBottom, 1000);
          }
          return { success: true };
        };

        const openChatByNickname = async (nickname, exact = false) => {
          const matcher = exact
            ? (c) => c.name === nickname
            : (c) => c.name.includes(nickname);
          const contact = Array.from(allContactsMap.values()).find(matcher);
          if (!contact) return false;
          return await openChatByPeerId(contact.peerId);
        };

        window.TelegramContacts = {
          getAll: () => Array.from(allContactsMap.values()),
          openChatByPeerId,
          openChatByNickname,
          isCurrentChat,
        };

        console.log("[TelegramContacts] 已挂载到 window.TelegramContacts");
      })();
    };

    openReq.onerror = function () {
      console.error("[telegram getlists] 无法打开数据库:", dbName);
    };
  };

  // 如果已登录则立即执行，否则监听变化
  if (isLoggedIn()) {
    runTelegramGetLists();
  } else {
    const observer = new MutationObserver(() => {
      if (isLoggedIn()) {
        console.log("[telegram getlists] 🔔 检测到从登录页进入聊天页");
        observer.disconnect();
        runTelegramGetLists();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("[telegram getlists] 👀 等待登录成功...");
  }
})();
`;
