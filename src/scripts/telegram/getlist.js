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

      const openChatByNickname = async (nickname, exact = false) => {
        const matcher = exact
          ? (c) => c.name === nickname
          : (c) => c.name.includes(nickname);

        const contact = Array.from(allContactsMap.values()).find(matcher);
        if (!contact) {
          console.warn("[未找到]", nickname);
          return false;
        }
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
         const scrollChatToBottom = async (maxTries = 10, delay = 400) => {
          try {
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

            const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

            const bubble = await waitForElement(
              "div.bubbles.has-groups.has-sticky-dates"
            );

            let tries = 0;
            while (tries < maxTries) {
              if (bubble.classList.contains("scrolled-down")) {
                console.log("[已滚动到底部]");
                break;
              }

              // 尝试点击“滚动到底部”按钮
              const goDownButton = document.querySelector(
                "button.bubbles-go-down.btn-corner"
              );
              if (goDownButton) {
                simulateClick(goDownButton);
                console.log('[点击] bubbles-go-down 成功');
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
        const el = document.querySelector(
          'a[data-peer-id="' + contact.peerId + '"]'
        );
        if (el) {
          simulateClick(el);
          setTimeout(() => {
            scrollChatToBottom();
          }, 1000);
          return true;
        } else {
          // 获取当前账户编号用于跳转
          const urlParams = new URLSearchParams(window.location.search);
          const accountNum = urlParams.get("account") || "1";

          // 设置跳转地址
          const jumpUrl =
            "https://web.telegram.org/k/?account=" +
            accountNum +
            "platform" +
            electronAPI.getinfo().platform +
            "containerId" +
            electronAPI.getinfo().containerId +
            "#" +
            contact.peerId;
          console.log("[未加载 DOM 元素，跳转至页面]", jumpUrl);
          window.location.href = jumpUrl;
          setTimeout(() => {
            scrollChatToBottom();
          }, 1000);
          return true;
        }
      };

      window.TelegramContacts = {
        getAll: () => Array.from(allContactsMap.values()),
        openChatByNickname,
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
    })();
  };

  openReq.onerror = function () {
    console.error("无法打开数据库:", dbName);
  };
})();



`;
