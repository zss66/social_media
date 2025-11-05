export const getWhatsAppList = `
async function getWhatsAppData() {
  // 第一步：从 localStorage 获取基础账户信息（去除引号）
  const lastWidMdRaw = localStorage.getItem("last-wid-md");
  let lastWidMd = lastWidMdRaw ? lastWidMdRaw.replace(/^"|"$/g, "") : null;
  let currentAccount = {};
  if (!lastWidMd) {
    throw new Error("未找到 last-wid-md 字段。请确保已登录 WhatsApp Web。");
  } else {
    const widParts = lastWidMd.match(/^(\d+):(\d+)@c\.us$/);
    currentAccount = {
      fullWid: lastWidMd,
      phoneNumber: widParts ? widParts[1] : "未知",
      deviceId: widParts ? widParts[2] : "未知",
      type: "@c.us 表示个人用户",
    };
  }

  // 第二步：从 IndexedDB 获取并补充信息
  const dbName = "model-storage";
  const request = indexedDB.open(dbName);
  return new Promise((resolve, reject) => {
    request.onerror = () => reject("IndexedDB 打开失败");
    request.onsuccess = async (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(
          ["contact", "chat", "group-metadata"],
          "readonly"
        );
        const contactStore = transaction.objectStore("contact");
        const chatStore = transaction.objectStore("chat");
        const groupStore = transaction.objectStore("group-metadata");

        // 目标 phoneWid
        const targetPhoneWid = currentAccount.phoneNumber + "@c.us";

        // 通过 phoneNumber 索引获取当前用户
        const currentContactRequest = contactStore
          .index("phoneNumber")
          .get(targetPhoneWid);
        const currentContact = await new Promise((res) => {
          currentContactRequest.onsuccess = () =>
            res(currentContactRequest.result);
          currentContactRequest.onerror = () => {
            const fallbackRequest = contactStore.getAll();
            fallbackRequest.onsuccess = () => {
              res(
                fallbackRequest.result.find(
                  (c) => c.phoneNumber === targetPhoneWid
                ) || null
              );
            };
          };
        });

        if (currentContact) {
          currentAccount.id = currentContact.id || "未知";
          currentAccount.pushname = currentContact.pushname || "未知";
          currentAccount.name = currentContact.name || "未知";
          currentAccount.isAddressBookContact =
            currentContact.isAddressBookContact || false;
          currentAccount.phoneNumberCreatedAt =
            currentContact.phoneNumberCreatedAt || "未知";
          currentAccount.contactHash = currentContact.contactHash || "未知";
          currentAccount.pnContactHash = currentContact.pnContactHash || "未知";
        }

        // 获取所有联系人（包含本人，用于匹配）
        const allContactsRequest = contactStore.getAll();
        const allContacts = await new Promise((res) => {
          allContactsRequest.onsuccess = () => res(allContactsRequest.result);
        });

        // 好友列表：过滤当前用户
        const friends = allContacts
          .filter(
            (c) =>
              c.phoneNumber &&
              c.phoneNumber !== targetPhoneWid &&
              !c.id.includes("@g.us")
          )
          .map((c) => ({
            wid: c.id,
            phone: c.phoneNumber.split("@")[0],
            name: c.name || "未知",
            pushname: c.pushname || "未知",
            notify: c.notify || "",
            timestamp: c.phoneNumberCreatedAt || c.t || "未知",
            isAddressBookContact: c.isAddressBookContact || false,
            contactHash: c.contactHash || "未知",
            pnContactHash: c.pnContactHash || "未知",
          }))
          .slice(0, 20);

        // 聊天会话
        const chatsRequest = chatStore.getAll();
        const chats = await new Promise((res) => {
          chatsRequest.onsuccess = () => {
            res(
              chatsRequest.result
                .map((ch) => ({
                  id: ch.id,
                  name: ch.name || "未知",
                  unread: ch.unreadCount || 0,
                  lastMsgTime: ch.t || ch.timestamp || "未知",
                  muted: ch.muteExpiration ? true : false,
                }))
                .slice(0, 20)
            );
          };
        });

        // 群组信息：从 allContacts（包含本人）匹配创建者
        const groupsRequest = groupStore.getAll();
        const groups = await new Promise((res) => {
          groupsRequest.onsuccess = () => {
            res(
              groupsRequest.result
                .map((g) => {
                  let creatorName = "未知";
                  const creatorContact = allContacts.find(
                    (c) => c.id === g.owner
                  );
                  if (creatorContact) {
                    creatorName = creatorContact.name || "未知";
                  }
                  return {
                    id: g.id,
                    name: g.subject || "未知",
                    ownerId: g.owner || "未知",
                    creatorName: creatorName,
                    memberCount: g.size || 0,
                    creationTime: g.creation || "未知",
                    groupAdder: g.groupAdder || "未知",
                    subjectTime: g.subjectTime || "未知",
                  };
                })
                .slice(0, 20)
            );
          };
        });
        // 返回数据对象
        resolve({ currentAccount, friends, chats, groups });
      } catch (error) {
        reject(error);
      } finally {
        db.close();
      }
    };
  });
}
getWhatsAppData().then((data) => console.log("返回数据:", data));
`;
