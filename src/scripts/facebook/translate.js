export const facebookTranslateScript = `
(function () {
  console.log('[Facebook Translator] 脚本开始执行');

  const SELECTORS = {
    MESSAGE_WRAPPER: 'div.html-div > div[role="presentation"] > span > div.html-div:not(:has(.fb-translator-container))'
  };

  const STYLES = \`
  .fb-translator-container {
    margin-top: 6px;
    font-family: Arial, sans-serif;
  }
  .fb-translate-btn {
    font-size: 12px;
    cursor: pointer;
    background: #1877f2;
    color: white;
    border: none;
    border-radius: 14px;
    padding: 2px 10px;
    user-select: none;
  }
  .fb-translate-result {
    margin-top: 6px;
    padding: 6px 10px;
    background: #f0f2f5;
    border-radius: 6px;
    font-size: 14px;
    color: #050505;
    display: none;
    white-space: pre-wrap;
    word-break: break-word;
  }
  \`;

  const CACHE_KEY = 'facebookTranslationCache';
  const MAX_CACHE_SIZE = 500;
  const CACHE_EXPIRE_MS = 30 * 24 * 60 * 60 * 1000;

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
    if (document.getElementById('fb-translator-style')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'fb-translator-style';
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }

  function getOwnTextContent(element) {
    let text = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (
        node.nodeType === Node.ELEMENT_NODE &&
        !node.classList.contains('time') &&
        !node.classList.contains('fb-translator-container')
      ) {
        text += node.textContent;
      }
    });
    return text.trim();
  }

  function getConfig() {
    return {
      targetLanguage: window.pluginConfig?.translation?.targetLanguage || localStorage.getItem('facebookTranslationLanguage') || 'zh-CN',
      buttonText: window.pluginConfig?.translation?.buttonText || '🌐 翻译',
      channel: window.pluginConfig?.translation.channel || 'google',
      autoTranslateReceive: window.pluginConfig?.translation?.autoTranslateReceive || false,
      loadingText: window.pluginConfig?.translation?.loadingText || '翻译中...'
    };
  }

  function createTranslateButton(messageWrapper) {
    if (!messageWrapper) return;
    if (messageWrapper.parentElement.querySelector('.fb-translator-container')) return;

    const config = getConfig();
    const originalText = getOwnTextContent(messageWrapper);
    if (!originalText) return;

    const msgId = hashText(originalText);
    messageWrapper.dataset.msgId = msgId;

    const container = document.createElement('div');
    container.className = 'fb-translator-container';

    const btn = document.createElement('button');
    btn.className = 'fb-translate-btn';
    btn.textContent = config.buttonText;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'fb-translate-result';

    if (translationCache[msgId]) {
      resultDiv.textContent = translationCache[msgId].text;
      resultDiv.style.display = 'block';
      btn.style.display = 'none';
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
          btn.style.display = 'none';
        }
      } catch (error) {
        resultDiv.textContent = '翻译出错';
        console.error('翻译错误:', error);
      } finally {
        btn.disabled = false;
        btn.textContent = currentConfig.buttonText;
        btn.style.background = '#1877f2';
      }
    };

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const newLang = prompt('输入目标语言代码 (如 zh-CN, en, ja):', config.targetLanguage);
      if (newLang) {
        window.pluginConfig = window.pluginConfig || {};
        window.pluginConfig.translation = window.pluginConfig.translation || {};
        window.pluginConfig.translation.targetLanguage = newLang.trim();
        localStorage.setItem('facebookTranslationLanguage', newLang.trim());
      }
    };

    container.appendChild(btn);
    container.appendChild(resultDiv);

    messageWrapper.parentElement.appendChild(container);

    // 新增自动翻译逻辑：如果启用自动翻译且无缓存，则自动触发翻译
    if (config.autoTranslateReceive && !translationCache[msgId]) {
      btn.click();
    }
  }

  function initTranslator() {
    injectStyles();

    document.querySelectorAll(SELECTORS.MESSAGE_WRAPPER).forEach(wrapper => {
      createTranslateButton(wrapper);
    });

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(SELECTORS.MESSAGE_WRAPPER)) {
              createTranslateButton(node);
            }
            const children = node.querySelectorAll?.(SELECTORS.MESSAGE_WRAPPER);
            children?.forEach(createTranslateButton);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
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
