function injectScript(webview, script, callback) {
  if (!webview) {
    console.warn('Webview not ready');
    return;
  }
  
  const injectionCode = `
    try {
      ${script}
      ${callback ? 'window.postMessage({ type: "scriptInjected" }, "*")' : ''}
    } catch(e) {
      console.error('Script injection error:', e);
    }
  `;

  webview.executeJavaScript(injectionCode)
    .then(() => {
      if (callback) {
        const onMessage = (event) => {
          if (event.data && event.data.type === 'scriptInjected') {
            callback();
            window.removeEventListener('message', onMessage);
          }
        };
        window.addEventListener('message', onMessage);
      }
    })
    .catch(err => console.error('Script injection failed:', err));
}

module.exports = { injectScript };