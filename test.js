// 1) 获取编辑器节点（按你提供的属性来定位）
function getLexicalEditor() {
  // 1) 最精确：直接匹配“输入消息”
  let el = document.querySelector(
    'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"][aria-label="输入消息"]'
  );
  if (el) return el;

  // 2) 次精确：根据 aria-label / aria-placeholder 包含“输入消息/发消息/Message”
  el = [...document.querySelectorAll(
    'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"]'
  )].find(n => {
    const al = (n.getAttribute('aria-label') || '').toLowerCase();
    const ph = (n.getAttribute('aria-placeholder') || '').toLowerCase();
    return /输入消息|发消息|type a message|message/.test(al) ||
           /输入消息|发消息|type a message|message/.test(ph);
  });
  if (el) return el;

  // 3) 兜底：排除“搜索”相关输入框，挑“更靠下、并且更宽”的那个
  const cands = [...document.querySelectorAll(
    'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"]'
  )].filter(n => {
    const al = (n.getAttribute('aria-label') || '').toLowerCase();
    const ph = (n.getAttribute('aria-placeholder') || '').toLowerCase();
    return !/搜索|search/.test(al) && !/搜索|search/.test(ph);
  });

  if (cands.length === 0) return null;
  if (cands.length === 1) return cands[0];

  // 选择“更靠页面底部”的（bottom 值更大）；如相同，选更宽的
  cands.sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    if (rb.bottom !== ra.bottom) return rb.bottom - ra.bottom;
    return rb.width - ra.width;
  });
  return cands[0];
}

// 下面继续使用你之前的函数即可：focusAtEnd / simulateTyping / insertAllAtOnce / pressEnterToSend


// 2) 将光标移动到编辑器末尾并聚焦（Lexical/React 必需）
function focusAtEnd(el) {
  el.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false); // 光标放在末尾
  sel.removeAllRanges();
  sel.addRange(range);
}

// 3) 逐字模拟输入（更像真人打字）
function simulateTyping(text, { perCharDelay = 30 } = {}) {
  const el = getLexicalEditor();
  if (!el) {
    console.warn("未找到编辑器元素");
    return;
  }
  focusAtEnd(el);

  let i = 0;
  (function typeNext() {
    if (i >= text.length) return;

    const ch = text[i++];

    // beforeinput —— 让富文本/框架有“将要插入”的机会（Lexical 友好）
    el.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: ch,
      })
    );

    // 实际插入字符（execCommand 在此场景仍然很好用）
    document.execCommand("insertText", false, ch);

    // input —— 通知框架“已经插入”
    el.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: ch,
      })
    );

    setTimeout(typeNext, perCharDelay);
  })();
}

// 4) 一次性快速插入（“粘贴式”）
function insertAllAtOnce(text) {
  const el = getLexicalEditor();
  if (!el) {
    console.warn("未找到编辑器元素");
    return;
  }
  focusAtEnd(el);

  // 触发 beforeinput（整段）
  el.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertFromPaste",
      data: text,
    })
  );

  // 使用 execCommand 插入整段文本
  document.execCommand("insertText", false, text);

  // 触发 input（整段）
  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertFromPaste",
      data: text,
    })
  );
}

// 5) 可选：模拟“回车发送”
function pressEnterToSend() {
  const el = getLexicalEditor();
  if (!el) return;

  // 部分站点会监听 keydown/keypress/keyup，稳妥起见三个都发
  ["keydown", "keypress", "keyup"].forEach((type) => {
    el.dispatchEvent(
      new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        key: "Enter",
        code: "Enter",
        which: 13,
        keyCode: 13,
      })
    );
  });
}

/* ============================
   使用示例
   ============================ */
// 逐字打字：
simulateTyping("djdjkk");

// 或者一次性插入：
/*
insertAllAtOnce("djdjkk");
*/

// 插入后如需发送：
// pressEnterToSend();
