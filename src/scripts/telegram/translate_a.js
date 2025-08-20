// a是telegram的react版本
export const telegramTranslateScript = `
(function () {
  console.log('[telegram Translator] 脚本开始执行');

  const SELECTORS = {
    MESSAGE_CONTAINER: 'div.content-inner',
    MESSAGE_TEXT: '.text-content',
    MESSAGE_CONTENT: '[class*="custome-message-content"]'
  };

  const STYLES = \`
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
    .tg-translator-container {
      margin-top: 4px;
    }
  \`;

  const CACHE_KEY = 'telegramTranslationCache';
  const MAX_CACHE_SIZE = 500;
  const CACHE_EXPIRE_MS = 30 * 24 * 60 * 60 * 1000; // 30天

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

  function cleanCache(cache) {
    const now = Date.now();
    for (const key in cache) {
      if (!cache[key].time || now - cache[key].time > CACHE_EXPIRE_MS) {
        delete cache[key];
      }
    }
  }

  function limitCacheSize(cache) {
    const keys = Object.keys(cache);
    if (keys.length <= MAX_CACHE_SIZE) return;
    keys.sort((a, b) => cache[a].time - cache[b].time);
    const over = keys.length - MAX_CACHE_SIZE;
    for (let i = 0; i < over; i++) {
      delete cache[keys[i]];
    }
  }

  let translationCache = loadCache();
  cleanCache(translationCache);
  limitCacheSize(translationCache);
  saveCache(translationCache);

  function injectStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }

  // 只获取节点自身的文本，不包括子节点文本
  function getOwnTextContent(element) {
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      }
    });
    return text.trim();
  }

  function createTranslateButton(textNode, config) {
    console.log('[telegram Translator] 创建翻译按钮');
    const container = textNode.closest(SELECTORS.MESSAGE_CONTAINER);
    if (!container) return;

    if (container.querySelector('.tg-translator-container')) return;

    const originalText = getOwnTextContent(textNode);
    if (!originalText) return;

    const msgId = hashText(originalText);
    container.dataset.msgId = msgId;

    const translatorContainer = document.createElement('div');
    translatorContainer.className = 'tg-translator-container';

    const divider = document.createElement('div');
    divider.className = 'tg-translator-divider';

    const btn = document.createElement('button');
    btn.className = 'tg-translate-btn';
    btn.textContent = config.buttonText;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'tg-translate-result';

    // 先恢复缓存翻译结果
    if (translationCache[msgId]) {
      resultDiv.textContent = translationCache[msgId].text;
      resultDiv.style.display = 'block';
      btn.style.display = 'none';
    }

    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = config.loadingText;
      btn.style.background = '#999';
      resultDiv.style.display = 'block';
      resultDiv.textContent = '';

      try {
        const response = await window.electronAPI.translateText(originalText, config.targetLanguage);
        console.log('翻译目标语言:', config.targetLanguage);
        resultDiv.textContent = response?.success ? response.translatedText : '翻译失败';

        if (response?.success) {
          translationCache[msgId] = { text: response.translatedText, time: Date.now() };
          cleanCache(translationCache);
          limitCacheSize(translationCache);
          saveCache(translationCache);

          btn.style.display = 'none';
        }
      } catch (error) {
        resultDiv.textContent = '翻译出错';
        console.error('翻译错误:', error);
      } finally {
        btn.disabled = false;
        btn.textContent = config.buttonText;
        btn.style.background = '#25D366';
      }
    };

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const newLang = prompt('输入目标语言代码 (如 zh-CN, en, ja):', config.targetLanguage);
      if (newLang) {
        config.targetLanguage = newLang.trim();
        localStorage.setItem('telegramTranslationLanguage', newLang.trim());
      }
    };

    translatorContainer.appendChild(divider);
    translatorContainer.appendChild(btn);
    translatorContainer.appendChild(resultDiv);

    const messageContent = container.querySelector(SELECTORS.MESSAGE_CONTENT) ||
      container.querySelector('.copyable-text') ||
      container;

    if (messageContent) {
      messageContent.appendChild(translatorContainer);
    }
  }

  function getConfig() {
    return {
      targetLanguage: localStorage.getItem('telegramTranslationLanguage') || (window.pluginConfig?.targetLanguage || 'zh-CN'),
      buttonText: window.pluginConfig?.buttonText || '🌐 翻译',
      loadingText: window.pluginConfig?.loadingText || '翻译中...'
    };
  }

  function initTranslator() {
    injectStyles();

    const config = getConfig();

    document.querySelectorAll(SELECTORS.MESSAGE_TEXT).forEach(textNode => {
      createTranslateButton(textNode, config);
    });

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const messages = node.querySelectorAll?.(SELECTORS.MESSAGE_TEXT);
            messages?.forEach(textNode => {
              createTranslateButton(textNode, config);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function checkElectronAPI() {
    if (window.electronAPI?.translateText) {
      initTranslator();
    } else {
      setTimeout(checkElectronAPI, 500);
    }
  }

  document.addEventListener('DOMContentLoaded', checkElectronAPI);
  if (document.readyState === 'complete') {
    checkElectronAPI();
  }
})();

`;