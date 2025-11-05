export const sendTikTokMessage = `
// ====== 配置 ======
function getConfig() {
  return {
    targetLanguage:
      window.pluginConfig?.translation.targetLanguage ||
      localStorage.getItem("tiktokTranslationLanguage") ||
      "zh-CN",
    sourceLanguage: window.pluginConfig?.translation.sourceLanguage || "en",
    channel: window.pluginConfig?.translation.channel || "google",
    autoTranslateSend:
      window.pluginConfig?.translation.autoTranslateSend !== false,
    preview: window.pluginConfig?.translation.preview !== false,
    loadingText: window.pluginConfig?.translation.loadingText || "翻译中...",
  };
}

// ====== 全局状态 ======
const state = {
  pendingPreview: null,
  bypassIntercept: false,
};

// ====== 找TikTok编辑器 ======
function getTikTokEditor() {
  const selectors = [
    '.public-DraftEditor-content[contenteditable="true"][role="textbox"]',
    '[data-e2e="message-input-area"] .public-DraftEditor-content',
    '.DraftEditor-editorContainer [contenteditable="true"][role="textbox"]',
  ];

  for (const selector of selectors) {
    const editor = document.querySelector(selector);
    if (editor) {
      const inputArea = editor.closest('[data-e2e="message-input-area"]');
      if (inputArea) return editor;
    }
  }

  for (const selector of selectors) {
    const editor = document.querySelector(selector);
    if (editor) return editor;
  }

  return null;
}

// ====== 清除并输入文本（兼容Draft.js）======
async function replaceEditorText(editor, newText) {
  editor.focus();
  await new Promise((r) => setTimeout(r, 50));

  // 全选现有内容
  document.execCommand("selectAll", false, null);
  await new Promise((r) => setTimeout(r, 30));

  // 使用粘贴方式替换（对Draft.js更友好）
  const dataTransfer = new DataTransfer();
  dataTransfer.setData("text/plain", newText);

  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: dataTransfer,
  });

  editor.dispatchEvent(pasteEvent);

  // 如果粘贴事件被拦截，使用insertText
  if (!pasteEvent.defaultPrevented) {
    try {
      document.execCommand("insertText", false, newText);
    } catch (e) {
      // 最后的备选方案
      editor.textContent = newText;
      editor.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          inputType: "insertText",
          data: newText,
        })
      );
    }
  }

  await new Promise((r) => setTimeout(r, 50));
}

// ====== 替换并发送 ======
window.replaceAndSend = async function (text, bypassTranslation = false) {
  const editor = getTikTokEditor();
  if (!editor) {
    console.warn("[TikTok翻译] 未找到编辑器");
    return;
  }

  state.bypassIntercept = true;

  try {
    if (!bypassTranslation) {
      await replaceEditorText(editor, text);
    }

    await new Promise((r) => setTimeout(r, 100));

    // 触发Enter发送
    const keyEvent = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      keyCode: 13,
    });

    editor.dispatchEvent(keyEvent);
  } catch (error) {
    console.error("[TikTok翻译] 发送失败:", error);
  } finally {
    setTimeout(() => {
      state.bypassIntercept = false;
    }, 100);
  }
};

// ====== 翻译接口 ======
async function translateText(text) {
  try {
    const config = getConfig();
    const response = await window.electronAPI.translateText(
      text,
      config.channel,
      config.sourceLanguage
    );
    return response?.success ? response.translatedText : text;
  } catch (error) {
    console.error("[TikTok翻译] 翻译失败:", error);
    return text;
  }
}

// ====== 获取编辑器位置 ======
function getEditorPosition() {
  const editor = getTikTokEditor();
  if (!editor) return { bottom: 100, left: "50%" };

  const rect = editor.getBoundingClientRect();
  return {
    bottom: window.innerHeight - rect.top + 10,
    left: rect.left + rect.width / 2,
    width: Math.min(400, rect.width - 40),
  };
}

// ====== 翻译预览弹窗 ======
function showTranslatePreview(rawText) {
  if (state.pendingPreview) closePreview();

  const config = getConfig();
  const pos = getEditorPosition();

  const preview = document.createElement("div");
  preview.style.cssText = \`
    position: fixed;
    bottom: \${pos.bottom}px;
    left: \${pos.left}px;
    transform: translateX(-50%);
    background: #ffffff;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 16px;
    z-index: 10000;
    width: \${pos.width}px;
    max-width: 90vw;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
  \`;

  preview.innerHTML = \`
    <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #ffffff; z-index: 1;"></div>
    <div style="position: absolute; bottom: -9px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 9px solid #e1e5e9; z-index: 0;"></div>
    <div style="margin-bottom: 12px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px;">原文</div>
      <div style="padding: 8px; background: #f7f8fa; border-radius: 6px; color: #1c1e21; word-wrap: break-word;">\${escapeHtml(
        rawText
      )}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px;">翻译预览</div>
      <div id="pv_status" style="color: #fe2c55; font-size: 12px; margin-bottom: 4px;">\${
        config.loadingText
      }</div>
      <div id="pv_trans" contenteditable="false" style="padding: 8px; border: 1px solid #dddfe2; border-radius: 6px; min-height: 36px; outline: none; color: #1c1e21; cursor: pointer; word-wrap: break-word;" placeholder="翻译结果"></div>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="pv_cancel" style="padding: 8px 16px; border: 1px solid #dddfe2; border-radius: 4px; background: #ffffff; color: #1c1e21; cursor: pointer; font-size: 14px;">取消</button>
      <button id="pv_retry" style="padding: 8px 16px; border: 1px solid #fe2c55; border-radius: 4px; background: #ffffff; color: #fe2c55; cursor: pointer; font-size: 14px;">重试</button>
      <button id="pv_confirm" style="padding: 8px 16px; border: none; border-radius: 4px; background: #fe2c55; color: #ffffff; cursor: pointer; font-size: 14px; font-weight: 600;">发送</button>
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

  // 发送按钮
  elConfirm.onclick = () => {
    const finalText = elTrans.innerText.trim() || obj.translated || rawText;
    replaceAndSend(finalText);
    closePreview();
  };

  // 重试按钮
  elRetry.onclick = async () => {
    elStatus.textContent = "重新翻译中...";
    elStatus.style.color = "#fe2c55";
    try {
      const newTranslation = await translateText(rawText);
      obj.translated = newTranslation;
      elTrans.textContent = newTranslation;
      obj.userEdited = false;
      elStatus.textContent = "";
    } catch (err) {
      elStatus.textContent = "翻译失败";
      elStatus.style.color = "#ff0000";
    }
  };

  // 取消按钮
  elCancel.onclick = () => closePreview();

  // 点击编辑译文
  elTrans.addEventListener("click", () => {
    if (elTrans.getAttribute("contenteditable") === "false") {
      elTrans.setAttribute("contenteditable", "true");
      elTrans.style.border = "2px solid #fe2c55";
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

  // 编辑时按Enter发送
  elTrans.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        elConfirm.click();
      } else if (!obj.editingTransText) {
        e.preventDefault();
        elConfirm.click();
      }
    }
  });

  // 全局快捷键
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

  // 开始翻译
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
    .catch((err) => {
      if (state.pendingPreview === obj) {
        elStatus.textContent = "翻译失败";
        elStatus.style.color = "#ff0000";
      }
    });
}

function closePreview() {
  if (!state.pendingPreview) return;

  if (state.pendingPreview.globalKeyHandler) {
    document.removeEventListener(
      "keydown",
      state.pendingPreview.globalKeyHandler,
      true
    );
  }

  try {
    state.pendingPreview.node.remove();
  } catch (e) {}
  state.pendingPreview = null;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ====== 拦截发送 ======
function interceptSendAction() {
  const editor = getTikTokEditor();
  if (!editor) {
    console.warn("[TikTok翻译] 未找到编辑器");
    return;
  }

  const rawText = editor.innerText.trim();
  if (!rawText) return;

  const config = getConfig();

  // 如果关闭了自动翻译，直接发送
  if (!config.autoTranslateSend) {
    replaceAndSend(rawText, true);
    return;
  }

  // 如果已经有预览窗口，使用预览的内容
  if (state.pendingPreview) {
    const finalText =
      state.pendingPreview.node.querySelector("#pv_trans").innerText.trim() ||
      state.pendingPreview.translated ||
      rawText;
    replaceAndSend(finalText);
    closePreview();
    return;
  }

  // 显示翻译预览
  if (config.preview) {
    showTranslatePreview(rawText);
  } else {
    // 不显示预览，直接翻译发送
    translateText(rawText)
      .then((translatedText) => {
        replaceAndSend(translatedText);
      })
      .catch((err) => {
        replaceAndSend(rawText, true);
      });
  }
}

// ====== 事件绑定 ======
function attachToEditor(el) {
  if (!el || el._boundByTikTokScript) return;
  el._boundByTikTokScript = true;

  console.log("[TikTok翻译] 已绑定到编辑器");

  el.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" && !e.shiftKey && !state.bypassIntercept) {
        e.preventDefault();
        e.stopImmediatePropagation();
        interceptSendAction();
      }
    },
    true
  );
}

function ensureBindings() {
  const el = getTikTokEditor();
  if (el) attachToEditor(el);

  // 监听DOM变化，自动绑定新出现的编辑器
  new MutationObserver(() => {
    const ed = getTikTokEditor();
    if (ed && !ed._boundByTikTokScript) {
      attachToEditor(ed);
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// ====== 初始化 ======
function init() {
  console.log("[TikTok翻译] 插件已启动");

  ensureBindings();

  // 点击外部关闭预览
  document.addEventListener("click", (e) => {
    if (state.pendingPreview && !state.pendingPreview.node.contains(e.target)) {
      closePreview();
    }
  });

  // 接收外部消息
  window.addEventListener("message", (event) => {
    if (event.data?.type === "sendText") {
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
`;
