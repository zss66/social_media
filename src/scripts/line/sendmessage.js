export const sendLineMessage = `
// ====== 配置 ======
function getConfig() {
  return {
    targetLanguage:
      window.pluginConfig?.translation.targetLanguage ||
      localStorage.getItem("lineTranslationLanguage") ||
      "zh-CN",
    sourceLanguage: window.pluginConfig?.translation.sourceLanguage || "zh-CN",
    channel: window.pluginConfig?.translation.channel || "google",
    autoTranslateReceive:
      window.pluginConfig?.translation.autoTranslateReceive || false,
    autoTranslateSend:
      window.pluginConfig?.translation.autoTranslateSend || true,
    preview: window.pluginConfig?.translation.preview || true,
    loadingText: window.pluginConfig?.translation.loadingText || "翻译中...",
  };
}

// ====== 全局状态 ======
const state = {
  pendingPreview: null,
  bypassIntercept: false,
  lastEditor: null,
  lastHost: null,
  currentSendId: null,
  lastInterceptTime: 0,
  boundElements: new WeakSet(), // 使用 WeakSet 追踪已绑定的元素
  isSending: false, // 发送锁
};

// ====== 找编辑器 ======
function getLineEditor() {
  try {
    const textareaEx = document.querySelector('textarea-ex.chatroomEditor-module__textarea__yKTlH') ||
                       document.querySelector('textarea-ex.text') ||
                       document.querySelector('textarea-ex');
    
    if (!textareaEx?.shadowRoot) return state.lastEditor;
    
    const textarea = textareaEx.shadowRoot.querySelector('textarea[part="input"]') ||
                     textareaEx.shadowRoot.querySelector('textarea');
    
    if (textarea) {
      state.lastEditor = textarea;
      state.lastHost = textareaEx;
    }
    
    return textarea || state.lastEditor;
  } catch (error) {
    return state.lastEditor;
  }
}

// ====== 模拟输入 ======
async function simulateTyping(textarea, text) {
  textarea.focus();
  textarea.click();
  textarea.value = "";
  textarea.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  
  await new Promise(r => setTimeout(r, 50));
  
  for (let char of text) {
    textarea.value += char;
    textarea.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    
    if (state.lastHost) {
      state.lastHost.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }
    
    await new Promise(r => setTimeout(r, 10));
  }
  
  await new Promise(r => setTimeout(r, 100));
}

// ====== 模拟回车 ======
function simulateEnter(textarea) {
  const createKeyEvent = (type) => new KeyboardEvent(type, {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  
  // 只在 textarea 上触发
  textarea.dispatchEvent(createKeyEvent("keydown"));
  textarea.dispatchEvent(createKeyEvent("keypress"));
  textarea.dispatchEvent(createKeyEvent("keyup"));
}

// ====== 替换并发送 ======
window.replaceAndSend = async function (text) {
  // 防止重复发送
  if (state.isSending) {
    console.log('[LINE翻译] 正在发送中，跳过重复请求');
    return;
  }

  const editor = getLineEditor();
  if (!editor) {
    console.log('[LINE翻译] 未找到编辑器');
    return;
  }

  state.isSending = true;
  state.bypassIntercept = true;
  const sendId = Date.now() + Math.random();
  state.currentSendId = sendId;

  console.log('[LINE翻译] 开始发送:', text.substring(0, 20) + '...');

  try {
    await simulateTyping(editor, text);
    await new Promise(r => setTimeout(r, 200));
    
    if (state.currentSendId === sendId) {
      simulateEnter(editor);
      console.log('[LINE翻译] 发送完成');
    }
  } catch (error) {
    console.error('[LINE翻译] 发送失败:', error);
  } finally {
    setTimeout(() => {
      if (state.currentSendId === sendId) {
        state.bypassIntercept = false;
        state.currentSendId = null;
        state.isSending = false;
        console.log('[LINE翻译] 重置发送状态');
      }
    }, 800);
  }
};

// ====== 翻译接口 ======
async function translateText(text) {
  try {
    const config = getConfig();
    
    if (!window.electronAPI?.translateText) {
      return text;
    }
    
    const response = await window.electronAPI.translateText(
      text,
      config.channel,
      config.sourceLanguage
    );
    return response?.success ? response.translatedText : text;
  } catch (error) {
    return text;
  }
}

// ====== 获取编辑器位置 ======
function getEditorPosition() {
  const host = state.lastHost || document.querySelector('textarea-ex');
  if (!host) return { bottom: 100, left: "50%", width: 400 };

  const rect = host.getBoundingClientRect();
  return {
    bottom: window.innerHeight - rect.top + 10,
    left: rect.left + rect.width / 2,
    width: Math.min(400, rect.width - 20),
  };
}

// ====== 翻译预览弹窗 ======
function showTranslatePreview(rawText) {
  if (state.pendingPreview) closePreview();

  const config = getConfig();
  const pos = getEditorPosition();

  const preview = document.createElement("div");
  preview.id = "line_translate_preview";
  preview.style.cssText = \`
    position: fixed !important;
    bottom: \${pos.bottom}px !important;
    left: \${pos.left}px !important;
    transform: translateX(-50%) !important;
    background: #ffffff !important;
    border: 2px solid #00B900 !important;
    border-radius: 12px !important;
    padding: 16px !important;
    z-index: 999999 !important;
    width: \${pos.width}px !important;
    max-width: 500px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25) !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
  \`;

  preview.innerHTML = \`
    <div style="margin-bottom: 12px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px; font-weight: 600;">原文</div>
      <div style="padding: 8px; background: #f7f8fa; border-radius: 6px; color: #1c1e21; word-wrap: break-word;">\${escapeHtml(rawText)}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px; font-weight: 600;">翻译预览</div>
      <div id="pv_status" style="color: #00B900; font-size: 12px; margin-bottom: 4px; font-weight: 500;">\${config.loadingText}</div>
      <div id="pv_trans" contenteditable="false" style="padding: 8px; border: 1px solid #dddfe2; border-radius: 6px; min-height: 40px; outline: none; color: #1c1e21; cursor: pointer; word-wrap: break-word; background: white;">加载中...</div>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="pv_cancel" style="padding: 8px 16px; border: 1px solid #dddfe2; border-radius: 6px; background: #ffffff; color: #1c1e21; cursor: pointer; font-size: 13px;">取消</button>
      <button id="pv_retry" style="padding: 8px 16px; border: 1px solid #00B900; border-radius: 6px; background: #ffffff; color: #00B900; cursor: pointer; font-size: 13px;">重试</button>
      <button id="pv_confirm" style="padding: 8px 16px; border: none; border-radius: 6px; background: #00B900; color: #ffffff; cursor: pointer; font-size: 13px; font-weight: 600;">发送</button>
    </div>
  \`;

  document.body.appendChild(preview);

  const obj = {
    raw: rawText,
    node: preview,
    translated: null,
    userEdited: false,
    editingTransText: false,
  };
  state.pendingPreview = obj;

  const elStatus = preview.querySelector("#pv_status");
  const elTrans = preview.querySelector("#pv_trans");
  const elConfirm = preview.querySelector("#pv_confirm");
  const elRetry = preview.querySelector("#pv_retry");
  const elCancel = preview.querySelector("#pv_cancel");

  elConfirm.onclick = () => {
    const finalText = elTrans.innerText.trim() || obj.translated || rawText;
    replaceAndSend(finalText);
    closePreview();
  };

  elRetry.onclick = async () => {
    elStatus.textContent = "重新翻译中...";
    elStatus.style.color = "#00B900";
    try {
      const newTranslation = await translateText(rawText);
      obj.translated = newTranslation;
      elTrans.textContent = newTranslation;
      obj.userEdited = false;
      elStatus.textContent = "";
    } catch (err) {
      elStatus.textContent = "翻译失败";
      elStatus.style.color = "#e41e3f";
    }
  };

  elCancel.onclick = () => closePreview();

  elTrans.addEventListener("click", () => {
    if (elTrans.getAttribute("contenteditable") === "false") {
      elTrans.setAttribute("contenteditable", "true");
      elTrans.style.border = "2px solid #00B900";
      obj.editingTransText = true;
      elTrans.focus();
      const range = document.createRange();
      range.selectNodeContents(elTrans);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });

  elTrans.addEventListener("input", () => (obj.userEdited = true));

  elTrans.addEventListener("blur", () => {
    elTrans.style.border = "1px solid #dddfe2";
    obj.editingTransText = false;
  });

  elTrans.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !obj.editingTransText)) {
      e.preventDefault();
      elConfirm.click();
    }
  });

  const globalKeyHandler = (e) => {
    if (state.pendingPreview === obj) {
      if (e.key === "Enter" && !obj.editingTransText) {
        e.preventDefault();
        e.stopPropagation();
        elConfirm.click();
      } else if (e.key === "Escape") {
        closePreview();
      }
    }
  };

  document.addEventListener("keydown", globalKeyHandler, true);
  obj.globalKeyHandler = globalKeyHandler;

  translateText(rawText)
    .then((translation) => {
      if (state.pendingPreview === obj) {
        obj.translated = translation;
        if (!obj.userEdited) {
          elTrans.textContent = translation;
        }
        elStatus.textContent = "";
      }
    })
    .catch(() => {
      if (state.pendingPreview === obj) {
        elStatus.textContent = "翻译失败";
        elStatus.style.color = "#e41e3f";
      }
    });
}

function closePreview() {
  if (!state.pendingPreview) return;

  if (state.pendingPreview.globalKeyHandler) {
    document.removeEventListener("keydown", state.pendingPreview.globalKeyHandler, true);
  }

  try {
    state.pendingPreview.node.remove();
  } catch (e) {}
  
  state.pendingPreview = null;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

// ====== 拦截发送 ======
function interceptSendAction() {
  console.log('[LINE翻译] 拦截发送动作');
  
  // 如果正在发送，直接返回
  if (state.isSending) {
    console.log('[LINE翻译] 正在发送中，跳过拦截');
    return;
  }

  const editor = getLineEditor();
  if (!editor) {
    console.log('[LINE翻译] 未找到编辑器');
    return;
  }

  const rawText = editor.value.trim();
  if (!rawText) {
    console.log('[LINE翻译] 内容为空');
    return;
  }

  const config = getConfig();
 
  if (!window.pluginConfig?.translation.autoTranslateSend) {
    console.log('[LINE翻译] 自动翻译已关闭，直接发送');
    replaceAndSend(rawText);
    return;
  }

  if (state.pendingPreview) {
    console.log('[LINE翻译] 存在预览窗口，使用预览内容');
    const finalText =
      state.pendingPreview.node.querySelector("#pv_trans").innerText.trim() ||
      state.pendingPreview.translated ||
      rawText;
    replaceAndSend(finalText);
    closePreview();
    return;
  }

  if (window.pluginConfig?.translation.preview) {
    console.log('[LINE翻译] 显示翻译预览');
    showTranslatePreview(rawText);
  } else {
    console.log('[LINE翻译] 直接翻译并发送');
    translateText(rawText)
      .then((translatedText) => replaceAndSend(translatedText))
      .catch(() => replaceAndSend(rawText));
  }
}

// ====== 事件绑定 ======
function attachToEditor(textarea, host) {
  if (!textarea) {
    console.log('[LINE翻译] attachToEditor: textarea 不存在');
    return;
  }
  
  // 使用 WeakSet 检查是否已绑定
  if (state.boundElements.has(textarea)) {
    console.log('[LINE翻译] 编辑器已绑定，跳过');
    return;
  }
  
  console.log('[LINE翻译] 绑定编辑器事件');
  
  const keydownHandler = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !state.bypassIntercept && !e.defaultPrevented) {
      console.log('[LINE翻译] 捕获 Enter 键');
      e.preventDefault();
      e.stopImmediatePropagation();
      
      // 防止快速重复触发
      const now = Date.now();
      if (state.lastInterceptTime && now - state.lastInterceptTime < 1000) {
        console.log('[LINE翻译] 触发过快，跳过 (间隔:', now - state.lastInterceptTime, 'ms)');
        return;
      }
      state.lastInterceptTime = now;
      
      interceptSendAction();
    }
  };
  
  // 标记为已绑定
  state.boundElements.add(textarea);
  textarea.addEventListener("keydown", keydownHandler, { capture: true, once: false });
  
  if (host && !state.boundElements.has(host)) {
    state.boundElements.add(host);
    host.addEventListener("keydown", keydownHandler, { capture: true, once: false });
    console.log('[LINE翻译] 同时绑定 host 元素');
  }
}

function ensureBindings() {
  const editor = getLineEditor();
  if (editor && !state.boundElements.has(editor)) {
    console.log('[LINE翻译] ensureBindings: 发现未绑定的编辑器');
    attachToEditor(editor, state.lastHost);
  }
}

// ====== 初始化 ======
function init() {
  console.log('[LINE翻译] 初始化脚本');
  
  ensureBindings();
  
  // 使用 MutationObserver 监听 DOM 变化
  const observer = new MutationObserver(() => {
    const ed = getLineEditor();
    if (ed && !state.boundElements.has(ed)) {
      console.log('[LINE翻译] MutationObserver: 检测到新编辑器');
      attachToEditor(ed, state.lastHost);
    }
  });
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  document.addEventListener("click", (e) => {
    if (state.pendingPreview && !state.pendingPreview.node.contains(e.target)) {
      closePreview();
    }
  });
  
  window.addEventListener("message", (event) => {
    if (event.data?.type === "sendText") {
      console.log('[LINE翻译] 收到外部消息:', event.data.payload);
      replaceAndSend(event.data.payload);
    }
  });
}

// ====== 启动 ======
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// 延迟确保绑定
setTimeout(() => {
  console.log('[LINE翻译] 延迟检查绑定状态');
  ensureBindings();
}, 2000);

// 暴露调试接口
window.__LINE_TRANSLATION_DEBUG__ = {
  getState: () => state,
  getBoundCount: () => state.boundElements,
  forceRebind: () => {
    const editor = getLineEditor();
    if (editor) {
      console.log('[LINE翻译] 强制重新绑定');
      attachToEditor(editor, state.lastHost);
    }
  }
};
`;
