// ====== 配置 ======
let sendMode = 1; // 固定为预览模式
// ====== 全局状态 ======
const state = {
  pendingPreview: null,
  bypassIntercept: false,
};
// ====== 找编辑器 ======
function getLexicalEditor() {
  const cands = [
    ...document.querySelectorAll(
      'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"]'
    ),
  ].filter((el) => {
    const al = (el.getAttribute("aria-label") || "").toLowerCase();
    const ph = (el.getAttribute("aria-placeholder") || "").toLowerCase();
    if (/搜索|search/.test(al) || /搜索|search/.test(ph)) return false;
    return true;
  });
  if (cands.length === 0) return null;
  const footerBox = cands.find((el) => el.closest("footer"));
  if (footerBox) return footerBox;
  cands.sort(
    (a, b) =>
      b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom
  );
  return cands[0];
}
// ====== 清除原始文本 ======
async function clearOriginalText() {
  const editor = getLexicalEditor();
  if (!editor) return false;

  editor.focus();
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 全选
  const selection = window.getSelection();
  selection.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.addRange(range);

  await new Promise((resolve) => setTimeout(resolve, 50));

  // 模拟 Delete 键
  editor.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Delete",
      code: "Delete",
      keyCode: 46,
    })
  );

  editor.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "deleteContentBackward",
    })
  );

  return true;
}
// ====== 文本替换和发送 ======
async function replaceAndSend(text) {
  const editor = getLexicalEditor();
  if (!editor) return;

  await clearOriginalText();

  await navigator.clipboard.writeText(text);

  editor.focus();
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 模拟 Ctrl+V
  editor.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      key: "v",
      code: "KeyV",
    })
  );

  const pasteEvent = new ClipboardEvent("paste", {
    bubbles: true,
    cancelable: true,
    clipboardData: new DataTransfer(),
  });

  Object.defineProperty(pasteEvent, "clipboardData", {
    value: {
      getData: () => text,
      types: ["text/plain"],
    },
  });

  editor.dispatchEvent(pasteEvent);

  setTimeout(() => {
    state.bypassIntercept = true;

    const sendBtn = document.querySelector(
      "button[aria-label='发送'], button[aria-label='Send'], button[title='Send'], button[data-testid='send']"
    );

    if (sendBtn) {
      sendBtn.click();
    } else {
      editor.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: "Enter",
          code: "Enter",
        })
      );
    }

    setTimeout(() => {
      state.bypassIntercept = false;
    }, 100);
  }, 200);
}
// ====== 翻译接口 ======
async function translateText(text) {
  await new Promise((r) => setTimeout(r, 800));
  return `[Translated] ${text}`;
}
// ====== 获取编辑器位置信息 ======
function getEditorPosition() {
  const editor = getLexicalEditor();
  if (!editor) return { bottom: 100, left: "50%" };

  const rect = editor.getBoundingClientRect();
  return {
    bottom: window.innerHeight - rect.top + 10,
    left: rect.left + rect.width / 2,
    width: Math.min(400, rect.width),
  };
}
// ====== 翻译预览弹窗 ======
function showTranslatePreview(rawText) {
  if (state.pendingPreview) closePreview();

  const pos = getEditorPosition();

  const preview = document.createElement("div");
  preview.style.cssText = `
    position: fixed;
    bottom: ${pos.bottom}px;
    left: ${pos.left}px;
    transform: translateX(-50%);
    background: #ffffff;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 16px;
    z-index: 10000;
    width: ${pos.width}px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
  `;

  preview.innerHTML = `
    <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid #ffffff; z-index: 1;"></div>
    <div style="position: absolute; bottom: -9px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-top: 9px solid #e1e5e9; z-index: 0;"></div>
    <div style="margin-bottom: 12px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px;">原文</div>
      <div style="padding: 8px; background: #f7f8fa; border-radius: 6px; color: #1c1e21;">${escapeHtml(
        rawText
      )}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <div style="color: #65676b; font-size: 12px; margin-bottom: 4px;">翻译预览</div>
      <div id="pv_status" style="color: #1877f2; font-size: 12px; margin-bottom: 4px;">翻译中...</div>
      <div id="pv_trans" contenteditable="false" style="padding: 8px; border: 1px solid #dddfe2; border-radius: 6px; min-height: 36px; outline: none; color: #1c1e21; cursor: pointer;" placeholder="翻译结果"></div>
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="pv_cancel" style="padding: 6px 12px; border: 1px solid #dddfe2; border-radius: 6px; background: #ffffff; color: #1c1e21; cursor: pointer; font-size: 13px;">取消</button>
      <button id="pv_retry" style="padding: 6px 12px; border: 1px solid #1877f2; border-radius: 6px; background: #ffffff; color: #1877f2; cursor: pointer; font-size: 13px;">重试</button>
      <button id="pv_confirm" style="padding: 6px 12px; border: none; border-radius: 6px; background: #1877f2; color: #ffffff; cursor: pointer; font-size: 13px; font-weight: 500;">发送</button>
    </div>
  `;

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
    elStatus.style.color = "#1877f2";
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
      elTrans.style.border = "2px solid #1877f2";
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
    .catch((err) => {
      if (state.pendingPreview === obj) {
        elStatus.textContent = "翻译失败";
        elStatus.style.color = "#e41e3f";
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
  return text.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}
// ====== 拦截发送 ======
function interceptSendAction() {
  const editor = getLexicalEditor();
  if (!editor) return;

  const rawText = editor.innerText.trim();
  if (!rawText) return;

  if (state.pendingPreview) {
    const finalText =
      state.pendingPreview.node.querySelector("#pv_trans").innerText.trim() ||
      state.pendingPreview.translated ||
      rawText;
    replaceAndSend(finalText);
    closePreview();
    return;
  }

  showTranslatePreview(rawText);
}
// ====== 事件绑定 ======
function attachToEditor(el) {
  if (!el || el._boundByScript) return;
  el._boundByScript = true;

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
function bindSendButton() {
  function tryBind() {
    const sendBtn = document.querySelector(
      "button[aria-label='发送'], button[aria-label='Send'], button[title='Send'], button[data-testid='send']"
    );
    if (sendBtn && !sendBtn._boundByScript) {
      sendBtn._boundByScript = true;
      sendBtn.addEventListener(
        "click",
        (e) => {
          if (!state.bypassIntercept) {
            e.preventDefault();
            e.stopImmediatePropagation();
            interceptSendAction();
          }
        },
        true
      );
    }
  }
  tryBind();
  new MutationObserver(tryBind).observe(document.body, {
    childList: true,
    subtree: true,
  });
}
function ensureBindings() {
  const el = getLexicalEditor();
  if (el) attachToEditor(el);

  new MutationObserver(() => {
    const ed = getLexicalEditor();
    if (ed) attachToEditor(ed);
  }).observe(document.body, { childList: true, subtree: true });
}
// ====== 初始化 ======
(function init() {
  ensureBindings();
  bindSendButton();

  document.addEventListener("click", (e) => {
    if (state.pendingPreview && !state.pendingPreview.node.contains(e.target)) {
      closePreview();
    }
  });

  console.log("简化版翻译拦截脚本已初始化");
})();
