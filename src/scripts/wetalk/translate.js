export const wetalkTranslateScript = `
(function () {
  console.log('[WeTalk Translator] 脚本开始执行');

  const SELECTORS = {
    MESSAGE_CONTAINER: 'span.message > div.d-flex > .right-message.wetalk-chatting-color:not(:has(.wt-translator-container))'
  };

  const STYLES = \`
    .wt-translator-divider {
      border-top: 1px solid #e9edef;
      margin: 0px 0 6px 0;
      width: 100%;
    }
    .wt-translate-btn {
      font-size: 12px;
      cursor: pointer;
      margin-bottom: 10px;
      background: #25D366;
      color: white;
      border: none;
      border-radius: 18px;
      padding: 2px 12px;
      margin-left: 0;
      display: inline-block;
    }
    .wt-translate-result {
      padding: 6px;
      margin-bottom: 10px;
      background: #ffffff;
      border-radius: 8px;
      font-size: 14px;
      color: #111b21;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      display: none;
    }
    .wt-translator-container {
      margin-top: 4px;
      width: 100%;
    }
  \`;

  const CACHE_KEY = 'wetalkTranslationCache';

  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return 'msg-' + Math.abs(hash);
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

  // ✅ 修复1：正确语法 + 闭合大括号
  function cleanCache(cache) {
    const config = getConfig();
    const now = Date.now();
    for (const key in cache) {
      if (config.cacheExpireMs !== 0 && (!cache[key].time || now - cache[key].time > config.cacheExpireMs)) {
        delete cache[key];
      }
    }
  }

  // ✅ 修复2：完整闭合函数
  function deleteCache() {
    const config = getConfig();
    if (config.deleteCache) {
      localStorage.removeItem(CACHE_KEY);
      translationCache = {};
      console.log('🗑️ WeTalk翻译缓存已清除，共释放', Object.keys(translationCache).length, '条记录');
      // 刷新所有按钮显示
      document.querySelectorAll('.wt-translate-btn').forEach(btn => {
        btn.style.display = 'inline-block';
      });
    }
  }  // ✅ 添加缺失的 }

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

  // ✅ 修复3：缓存初始化移到此处
  let translationCache = loadCache();
  cleanCache(translationCache);
  limitCacheSize(translationCache);
  saveCache(translationCache);

  function injectStyles() {
    if (document.getElementById('wt-translator-style')) return;
    const style = document.createElement('style');
    style.id = 'wt-translator-style';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function getOwnTextContent(element) {
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !node.classList.contains('time') &&
        !node.classList.contains('wt-translator-container')
      ) {
        text += node.textContent;
      }
    });
    return text.trim();
  }

  function createTranslateButton(msgDiv) {
    if (msgDiv.dataset.injected === 'true') return;
    msgDiv.dataset.injected = 'true';

    const config = getConfig();
    const originalText = getOwnTextContent(msgDiv);
    if (!originalText) return;

    const msgId = hashText(originalText);
    msgDiv.dataset.msgId = msgId;

    const container = document.createElement('div');
    container.className = 'wt-translator-container';

    const divider = document.createElement('div');
    divider.className = 'wt-translator-divider';

    const btn = document.createElement('button');
    btn.className = 'wt-translate-btn';
    btn.textContent = config.buttonText;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'wt-translate-result';

    if (translationCache[msgId]) {
      resultDiv.textContent = translationCache[msgId].text;
      resultDiv.style.display = 'block';
      if (config.hideButtonAfterTranslate) {
        btn.style.display = 'none';
      }
    }

    btn.onclick = async () => {
      const currentConfig = getConfig();
      btn.disabled = true;
      btn.textContent = currentConfig.loadingText;
      btn.style.background = '#999';
      resultDiv.style.display = 'block';
      resultDiv.textContent = '';

      try {
        const response = await window.electronAPI.translateText(originalText, currentConfig.channel, currentConfig.targetLanguage);
        console.log('翻译目标语言:', currentConfig.targetLanguage);
        resultDiv.textContent = response?.success ? response.translatedText : '翻译失败';

        if (response?.success) {
          translationCache[msgId] = { text: response.translatedText, time: Date.now() };
          cleanCache(translationCache);
          limitCacheSize(translationCache);
          saveCache(translationCache);
          
          if (currentConfig.hideButtonAfterTranslate) {
            btn.style.display = 'none';
          }
        }
      } catch (err) {
        resultDiv.textContent = '翻译出错';
        console.error('翻译失败:', err);
      } finally {
        btn.disabled = false;
        btn.textContent = currentConfig.buttonText;
        btn.style.background = '#25D366';
      }
    };

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const newLang = prompt('输入目标语言代码 (如 zh-CN, en, ja):', config.targetLanguage);
      if (newLang) {
        window.pluginConfig = window.pluginConfig || {};
        window.pluginConfig.translation = window.pluginConfig.translation || {};
        window.pluginConfig.translation.targetLanguage = newLang.trim();
        localStorage.setItem('wetalkTranslationLanguage', newLang.trim());
      }
    };

    // ✅ 修复4：安全DOM操作（不直接清空，避免破坏WeTalk样式）
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.alignItems = 'flex-start';
    msgDiv.style.gap = '4px';

    // ✅ 安全保留原有内容，只添加翻译容器
    const originalContent = msgDiv.querySelector('.message-content') || msgDiv.firstChild;
    if (originalContent && !msgDiv.querySelector('.wt-translator-container')) {
      msgDiv.appendChild(container);
    }

    container.appendChild(divider);
    container.appendChild(btn);
    container.appendChild(resultDiv);

    if (config.autoTranslateReceive && !translationCache[msgId]) {
      btn.click();
    }
  }

  function enhanceMessages() {
    const messages = document.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
    messages.forEach(msg => createTranslateButton(msg));
  }

  function initTranslator() {
    injectStyles();
    enhanceMessages();
    
    const observer = new MutationObserver(enhanceMessages);
    observer.observe(document.body, { childList: true, subtree: true });

    // ✅ 新增：实时配置监听（5行代码解决！）
    const configObserver = new MutationObserver(() => {
      const config = getConfig();
      if (config.deleteCache) {
        deleteCache();
        console.log('🔥 WeTalk配置更新：缓存已实时清除！');
      }
    });
    
    configObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-plugin-config'],
      subtree: true
    });

    // ✅ 新增：定时检查（万无一失）
    setInterval(() => {
      const config = getConfig();
      if (config.deleteCache && localStorage.getItem(CACHE_KEY)) {
        deleteCache();
        console.log('⏰ WeTalk定时检查：缓存已清除');
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
