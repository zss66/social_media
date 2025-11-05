export const telegramTranslateScript = `
(function () {
  console.log("[Telegram Translator] 脚本开始执行");

  const SELECTORS = {
    MESSAGE_CONTAINER: "div.message",
    MESSAGE_TEXT: "div.message:not(:has(.tg-translator-container))",
    MESSAGE_CONTENT: "div.message",
  };

  const STYLES = \`
  .message.spoilers-container {
    display: flex;
    flex-direction: column;
  }
  .tg-translator-divider {
    border-top: 1px solid #e9edef;
    margin: 0px 0 6px 0;
    width: 100%;
  }
  .tg-translate-btn {
    font-size: 12px;
    cursor: pointer;
    margin-bottom:10px;
    background: #25D366;
    color: white;
    border: none;
    border-radius: 18px;
    padding: 2px 12px;
    margin-left: 0;
    display: inline-block;
  }
  .tg-translate-result {
    padding: 6px;
    margin-bottom: 10px;
    background: #ffffff;
    border-radius: 8px;
    font-size: 14px;
    color: #111b21;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    display: none;
  }
  .tg-translator-container {}
  \`;

  const CACHE_KEY = "telegramTranslationCache";

  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return "msg-" + Math.abs(hash);
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function saveCache(cache) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }

  function getConfig() {
    return {
      targetLanguage: window.pluginConfig?.translation?.targetLanguage || localStorage.getItem('facebookTranslationLanguage') || 'zh-CN',
      buttonText: window.pluginConfig?.translation?.buttonText || '🌐 翻译',
      channel: window.pluginConfig?.translation.channel || 'google',
      autoTranslateReceive: window.pluginConfig?.translation?.autoTranslateReceive || false,
      loadingText: window.pluginConfig?.translation?.loadingText || '翻译中...',
      maxCacheSize: window.pluginConfig?.translation?.maxCacheSize || 500,
      cacheExpireMs: window.pluginConfig?.translation?.cacheExpireMs || (30 * 24 * 60 * 60 * 1000),
      hideButtonAfterTranslate: window.pluginConfig?.translation?.hideButtonAfterTranslate !== undefined 
        ? window.pluginConfig.translation.hideButtonAfterTranslate 
        : true,
      deleteCache: window.pluginConfig?.translation?.deleteCache || false,
    };
  }

  function cleanCache(cache) {
    const config = getConfig();
    const now = Date.now();
    for (const key in cache) {
      if (config.cacheExpireMs !== 0 && (!cache[key].time || now - cache[key].time > config.cacheExpireMs)) {
        delete cache[key];
      }
    }
  }

  function deleteCache() {
    const config = getConfig();
    if (config.deleteCache) {
      localStorage.removeItem(CACHE_KEY);
      translationCache = {};
      console.log('🗑️ 翻译缓存已清除，共释放', Object.keys(translationCache).length, '条记录');
      // 刷新所有按钮显示（删除缓存后重新显示翻译按钮）
      document.querySelectorAll('.tg-translate-btn').forEach(btn => {
        btn.style.display = 'inline-block';
      });
    }
  }

  function limitCacheSize(cache) {
    const config = getConfig();
    const keys = Object.keys(cache);
    if (keys.length <= config.maxCacheSize) return;
    keys.sort((a, b) => cache[a].time - cache[b].time);
    const over = keys.length - config.maxCacheSize;
    for (let i = 0; i < over; i++) {
      delete cache[keys[i]];
    }
  }

  let translationCache = loadCache();
  cleanCache(translationCache);
  limitCacheSize(translationCache);
  saveCache(translationCache);

  function injectStyles() {
    if (document.getElementById('tg-translator-style')) return;
    const styleElement = document.createElement("style");
    styleElement.id = 'tg-translator-style';
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }

  function getOwnTextContent(element) {
    let text = "";
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !node.classList.contains("time") &&
        !node.classList.contains("tg-translator-container")
      ) {
        text += node.textContent;
      }
    });
    return text.trim();
  }

  function createTranslateButton(messageDiv) {
    if (!messageDiv) return;
    if (messageDiv.querySelector(".tg-translator-container")) return;

    const config = getConfig();
    const originalText = getOwnTextContent(messageDiv);
    if (!originalText) return;

    const msgId = hashText(originalText);
    messageDiv.dataset.msgId = msgId;

    const translatorContainer = document.createElement("div");
    translatorContainer.className = "tg-translator-container";

    const divider = document.createElement("div");
    divider.className = "tg-translator-divider";

    const btn = document.createElement("button");
    btn.className = "tg-translate-btn";
    btn.textContent = config.buttonText;

    const resultDiv = document.createElement("div");
    resultDiv.className = "tg-translate-result";

    if (translationCache[msgId]) {
      resultDiv.textContent = translationCache[msgId].text;
      resultDiv.style.display = "block";
      if (config.hideButtonAfterTranslate) {
        btn.style.display = "none";
      }
    }

    btn.onclick = async () => {
      const currentConfig = getConfig();
      btn.disabled = true;
      btn.textContent = currentConfig.loadingText;
      btn.style.background = "#999";
      resultDiv.style.display = "block";
      resultDiv.textContent = "";

      try {
        const response = await window.electronAPI.translateText(
          originalText,
          currentConfig.channel,
          currentConfig.targetLanguage
        );
        console.log("翻译目标语言:", currentConfig.targetLanguage);
        resultDiv.textContent = response?.success
          ? response.translatedText
          : "翻译失败";

        if (response?.success) {
          translationCache[msgId] = {
            text: response.translatedText,
            time: Date.now(),
          };
          cleanCache(translationCache);
          limitCacheSize(translationCache);
          saveCache(translationCache);
          
          if (currentConfig.hideButtonAfterTranslate) {
            btn.style.display = "none";
          }
        }
      } catch (error) {
        resultDiv.textContent = "翻译出错";
        console.error("翻译错误:", error);
      } finally {
        btn.disabled = false;
        btn.textContent = currentConfig.buttonText;
        btn.style.background = "#25D366";
      }
    };

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const newLang = prompt(
        "输入目标语言代码 (如 zh-CN, en, ja):",
        config.targetLanguage
      );
      if (newLang) {
        window.pluginConfig = window.pluginConfig || {};
        window.pluginConfig.translation = window.pluginConfig.translation || {};
        window.pluginConfig.translation.targetLanguage = newLang.trim();
        localStorage.setItem('telegramTranslationLanguage', newLang.trim());
      }
    };

    translatorContainer.appendChild(divider);
    translatorContainer.appendChild(btn);
    translatorContainer.appendChild(resultDiv);

    messageDiv.appendChild(translatorContainer);
    
    if (config.autoTranslateReceive && !translationCache[msgId]) {
      btn.click();
    }
  }

  function initTranslator() {
    injectStyles();

    document.querySelectorAll(SELECTORS.MESSAGE_TEXT).forEach((messageDiv) => {
      createTranslateButton(messageDiv);
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const messages = node.matches?.(SELECTORS.MESSAGE_TEXT)
              ? [node]
              : node.querySelectorAll?.(SELECTORS.MESSAGE_TEXT);

            messages?.forEach((messageDiv) => {
              createTranslateButton(messageDiv);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 实时配置监听
    const configObserver = new MutationObserver(() => {
      const config = getConfig();
      if (config.deleteCache) {
        deleteCache();
        console.log('🔥 配置更新：缓存已实时清除！');
      }
    });
    
    configObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-plugin-config'],
      subtree: true
    });

    // 定时检查
    setInterval(() => {
      const config = getConfig();
      if (config.deleteCache && localStorage.getItem(CACHE_KEY)) {
        deleteCache();
        console.log('⏰ 定时检查：缓存已清除');
      }
    }, 30000);
  }

  function checkElectronAPI() {
    if (window.electronAPI?.translateText) {
      initTranslator();
    } else {
      setTimeout(checkElectronAPI, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkElectronAPI);
  } else {
    checkElectronAPI();
  }
})();
`;
