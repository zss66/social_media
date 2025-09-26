function getLexicalEditor() {
  let el = document.querySelector(
    'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"][aria-label="输入消息"]'
  );
  if (el) return el;

  const cands = [...document.querySelectorAll(
    'div[role="textbox"][contenteditable="true"][data-lexical-editor="true"]'
  )];
  return cands.length ? cands[0] : null;
}

function bindEditorKeydown() {
  const el = getLexicalEditor();
  if (!el) {
    console.warn("没找到编辑器");
    return;
  }
  console.log("绑定编辑器");
  console.log(el);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      console.log("捕获到编辑器内 Enter");
      e.preventDefault();
      interceptSendAction();
    }
  });
}

bindEditorKeydown();