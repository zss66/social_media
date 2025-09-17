(() => {
  console.log("✅ WhatsApp 拦截脚本已启动");

  // ====== 1. 伪造 visibility & focus ======
  try {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden"
    });
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true
    });
    document.hasFocus = () => false;
    console.log("📡 已伪造 visibilityState = hidden, hasFocus = false");
  } catch (e) {
    console.warn("⚠️ visibility 伪造失败:", e);
  }

  // ====== 2. 拦截 Notification ======
  try {
    const OriginalNotification = window.Notification;
    function InterceptedNotification(title, options) {
      console.log("📩 捕获到通知:", title, options);
      window.dispatchEvent(new CustomEvent("whatsapp-notification", {
        detail: { title, options }
      }));
      return new OriginalNotification(title, options);
    }
    InterceptedNotification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);
    Object.defineProperty(InterceptedNotification, "permission", {
      get: () => OriginalNotification.permission
    });
    window.Notification = InterceptedNotification;
    console.log("🔔 Notification 已拦截");
  } catch (e) {
    console.warn("⚠️ Notification 拦截失败:", e);
  }

 })();
