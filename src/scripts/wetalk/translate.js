export const wetalkTranslateScript = `
(function () {
  console.log('[wetalk Translator] 脚本开始执行');

  const SELECTORS = {
    MESSAGE_CONTAINER: 'span.message > div.d-flex > .right-message.wetalk-chatting-color'
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
      margin-bottom:10px;
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
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  function getConfig() {
    return {
      targetLanguage: localStorage.getItem('wetalkTranslationLanguage') || (window.pluginConfig?.targetLanguage || 'zh-CN'),
      buttonText: window.pluginConfig?.buttonText || '🌐 翻译',
      loadingText: window.pluginConfig?.loadingText || '翻译中...'
    };
  }

  function createTranslateButton(msgDiv, config) {
    if (msgDiv.dataset.injected === 'true') return;
    msgDiv.dataset.injected = 'true';

    const originalText = msgDiv.textContent.trim();
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
      } catch (err) {
        resultDiv.textContent = '翻译出错';
        console.error('翻译失败:', err);
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
        localStorage.setItem('wetalkTranslationLanguage', config.targetLanguage);
      }
    };

    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.alignItems = 'flex-start';
    msgDiv.style.gap = '4px';

    const originalDiv = document.createElement('div');
    originalDiv.textContent = originalText;

    msgDiv.textContent = '';
    msgDiv.appendChild(originalDiv);
    msgDiv.appendChild(container);

    container.appendChild(divider);
    container.appendChild(btn);
    container.appendChild(resultDiv);
  }

  function enhanceMessages() {
    const config = getConfig();
    const messages = document.querySelectorAll(SELECTORS.MESSAGE_CONTAINER);
    messages.forEach(msg => createTranslateButton(msg, config));
  }

  function checkElectronAPI() {
    if (window.electronAPI?.translateText) {
      injectStyles();
      enhanceMessages();
      const observer = new MutationObserver(enhanceMessages);
      observer.observe(document.body, { childList: true, subtree: true });
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