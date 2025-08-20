export const tiktokTranslateScript = `
(function () {
  console.log('[TikTok Translator] 脚本开始执行');

  const SELECTORS = {
    MESSAGE_TEXT_CONTAINER: 'div.css-1ntk7ja-DivTextContainer.e9j91383',
    MESSAGE_TEXT: 'div.css-1ntk7ja-DivTextContainer.e9j91383 > p.css-1rdxtjl-PText.e9j913815',
  };

  const STYLES = \`
  .tt-translator-container {
    margin-top: 6px;
    font-family: Arial, sans-serif;
  }
  .tt-translate-btn {
    font-size: 12px;
    cursor: pointer;
    background: #69C9D0;
    color: white;
    border: none;
    border-radius: 14px;
    padding: 2px 10px;
    user-select: none;
  }
  .tt-translate-result {
    margin-top: 6px;
    padding: 6px 10px;
    background: #f0f8fa;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    display: none;
    white-space: pre-wrap;
    word-break: break-word;
  }
  \`;

  const CACHE_KEY = 'tiktokTranslationCache';
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
    if (document.getElementById('tt-translator-style')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'tt-translator-style';
    styleElement.textContent = STYLES;
    document.head.appendChild(styleElement);
  }

  function getMessageText(container) {
    const p = container.querySelector(SELECTORS.MESSAGE_TEXT);
    return p ? p.textContent.trim() : '';
  }

  function getConfig() {
    return {
      targetLanguage: window.pluginConfig?.targetLanguage || 'zh-CN',
      buttonText: window.pluginConfig?.buttonText || '🌐 翻译',
      loadingText: window.pluginConfig?.loadingText || '翻译中...'
    };
  }

  function createTranslateButton(messageContainer) {
    if (!messageContainer) return;
    if (messageContainer.querySelector('.tt-translator-container')) return;

    const config = getConfig();
    const originalText = getMessageText(messageContainer);
    if (!originalText) return;

    const msgId = hashText(originalText);
    messageContainer.dataset.msgId = msgId;

    const container = document.createElement('div');
    container.className = 'tt-translator-container';

    const btn = document.createElement('button');
    btn.className = 'tt-translate-btn';
    btn.textContent = config.buttonText;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'tt-translate-result';

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
        const response = await window.electronAPI.translateText(originalText, currentConfig.targetLanguage);
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
        btn.style.background = '#69C9D0';
      }
    };

    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const newLang = prompt('输入目标语言代码 (如 zh-CN, en, ja):', config.targetLanguage);
      if (newLang) {
        window.pluginConfig = window.pluginConfig || {};
        window.pluginConfig.targetLanguage = newLang.trim();
        localStorage.setItem('tiktokTranslationLanguage', newLang.trim());
      }
    };

    container.appendChild(btn);
    container.appendChild(resultDiv);

    messageContainer.appendChild(container);
  }

  function initTranslator() {
    injectStyles();

    document.querySelectorAll(SELECTORS.MESSAGE_TEXT_CONTAINER).forEach(container => {
      createTranslateButton(container);
    });

    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches(SELECTORS.MESSAGE_TEXT_CONTAINER)) {
              createTranslateButton(node);
            }
            const children = node.querySelectorAll?.(SELECTORS.MESSAGE_TEXT_CONTAINER);
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
