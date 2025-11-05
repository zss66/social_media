export const tiktokTranslateScript = `
(function () {
  console.log('[TikTok Translator] 浏览器注入修复版 v2.2 - 支持单字符');

  // ==================== 选择器（稳健匹配，防类名变动） ====================
  const SELECTORS = {
    MESSAGE_ITEM: 'div[data-e2e="chat-item"]', // 最稳定：用 data-e2e
    MESSAGE_TEXT_CONTAINER: 'div[class*="DivTextContainer"]', // 模糊匹配
    MESSAGE_TEXT: 'p[class*="PText"]' // 模糊匹配 <p>
  };

  // ==================== 原始样式（100% 不变） ====================
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

  // ==================== 工具函数 ====================
  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return 'msg-' + Math.abs(hash).toString(36);
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('缓存加载失败', e);
      return {};
    }
  }

  function saveCache(cache) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('缓存保存失败', e);
    }
  }

  function getConfig() {
    const defaults = {
      targetLanguage: 'zh-CN',
      buttonText: '🌐 翻译',
      channel: 'google',
      autoTranslateReceive: false,
      loadingText: '翻译中...',
      maxCacheSize: 500,
      cacheExpireMs: 30 * 24 * 60 * 60 * 1000,
      hideButtonAfterTranslate: true,
      deleteCache: false
    };

    const fromStorage = {
      targetLanguage: localStorage.getItem('tiktokTranslationLanguage')
    };

    const fromPlugin = window.pluginConfig?.translation || {};

    return { ...defaults, ...fromStorage, ...fromPlugin };
  }

  function cleanCache(cache) {
    const config = getConfig();
    const now = Date.now();
    for (const key in cache) {
      const entry = cache[key];
      if (!entry.time || (config.cacheExpireMs > 0 && now - entry.time > config.cacheExpireMs)) {
        delete cache[key];
      }
    }
  }

  function limitCacheSize(cache) {
    const config = getConfig();
    const keys = Object.keys(cache);
    if (keys.length <= config.maxCacheSize) return;
    keys.sort((a, b) => cache[a].time - cache[b].time);
    const excess = keys.length - config.maxCacheSize;
    for (let i = 0; i < excess; i++) {
      delete cache[keys[i]];
    }
  }

  // ==================== 缓存初始化 ====================
  let translationCache = loadCache();
  cleanCache(translationCache);
  limitCacheSize(translationCache);
  saveCache(translationCache);

  // ==================== 样式注入 ====================
  function injectStyles() {
    if (document.getElementById('tt-translator-style')) return;
    const style = document.createElement('style');
    style.id = 'tt-translator-style';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  // ==================== 翻译按钮创建（支持单字符） ====================
  function createTranslateButton(messageItem) {
    // 防止重复注入（用我们自己的标记）
    if (messageItem.dataset.ttTranslator === '1') return;
    messageItem.dataset.ttTranslator = '1';

    const textContainer = messageItem.querySelector(SELECTORS.MESSAGE_TEXT_CONTAINER);
    const textElement = messageItem.querySelector(SELECTORS.MESSAGE_TEXT);
    if (!textContainer || !textElement) return;

    const originalText = textElement.textContent.trim();
    if (!originalText) return; // **移除 length < 2 限制，支持单字符**

    const msgId = hashText(originalText);

    // 防止重复容器
    if (textContainer.querySelector('.tt-translator-container')) return;

    const container = document.createElement('div');
    container.className = 'tt-translator-container';

    const btn = document.createElement('button');
    btn.className = 'tt-translate-btn';
    btn.textContent = getConfig().buttonText;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'tt-translate-result';

    container.appendChild(btn);
    container.appendChild(resultDiv);
    textContainer.appendChild(container); // 插入到文本容器末尾

    // 缓存命中
    if (translationCache[msgId]) {
      resultDiv.textContent = translationCache[msgId].text;
      resultDiv.style.display = 'block';
      if (getConfig().hideButtonAfterTranslate) {
        btn.style.display = 'none';
      }
      return;
    }

    // 点击翻译
    btn.onclick = async () => {
      const config = getConfig();
      btn.disabled = true;
      btn.textContent = config.loadingText;
      btn.style.background = '#999';
      resultDiv.style.display = 'block';
      resultDiv.textContent = '';

      try {
        const response = await window.electronAPI.translateText(
          originalText,
          config.channel,
          config.targetLanguage
        );

        const translated = response?.success ? response.translatedText : '翻译失败';
        resultDiv.textContent = translated;

        if (response?.success) {
          translationCache[msgId] = { text: translated, time: Date.now() };
          limitCacheSize(translationCache);
          saveCache(translationCache);

          if (config.hideButtonAfterTranslate) {
            btn.style.display = 'none';
          }
        }
      } catch (err) {
        resultDiv.textContent = '翻译出错';
        console.error('[TikTok Translator] 翻译失败', err);
      } finally {
        btn.disabled = false;
        btn.textContent = config.buttonText;
        btn.style.background = '#69C9D0';
      }
    };

    // 右键切换语言
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      const lang = prompt('输入目标语言代码 (如 zh-CN, en, ja):', getConfig().targetLanguage);
      if (lang && lang.trim()) {
        localStorage.setItem('tiktokTranslationLanguage', lang.trim());
        alert(\`语言已切换为：\${lang.trim()}\n请刷新页面生效\`);
      }
    };

    // 自动翻译（延迟触发）
    if (getConfig().autoTranslateReceive && !translationCache[msgId]) {
      setTimeout(() => btn.click(), 500);
    }
  }

  // ==================== 初始化与观察 ====================
  function initTranslator() {
    injectStyles();

    // 处理已有消息
    document.querySelectorAll(SELECTORS.MESSAGE_ITEM).forEach(createTranslateButton);

    // 观察新消息（防抖）
    let timeout = null;
    const observer = new MutationObserver(() => {
      if (timeout) return;
      timeout = setTimeout(() => {
        document.querySelectorAll(SELECTORS.MESSAGE_ITEM).forEach(createTranslateButton);
        timeout = null;
      }, 100);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 定时清理
    setInterval(() => {
      const config = getConfig();
      if (config.deleteCache && localStorage.getItem(CACHE_KEY)) {
        localStorage.removeItem(CACHE_KEY);
        translationCache = {};
        document.querySelectorAll('.tt-translate-btn').forEach(btn => {
          btn.style.display = 'inline-block';
        });
        console.log('缓存已清除');
      }
    }, 20000);
  }

  // ==================== 启动 ====================
  function start() {
    if (window.electronAPI?.translateText) {
      initTranslator();
    } else {
      setTimeout(start, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // 调试接口
  window.TikTokTranslator = {
    clearCache: () => {
      localStorage.removeItem(CACHE_KEY);
      translationCache = {};
      location.reload();
    },
    version: '2.2-single-char-fixed'
  };

  console.log('[TikTok Translator] 单字符修复版加载完成');
})();
`;
