(function () {
  'use strict';

  console.log('[SPIKE:BRIDGE] bridge 在 ISOLATED world 中已加载');

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    var data = event.data;
    if (data && data.__AI_HELPER_BODY__) {
      console.log('[SPIKE:BRIDGE] 收到 MAIN world 消息:', data.__AI_HELPER_BODY__);

      try {
        chrome.runtime.sendMessage({
          type: 'SPIKE_BODY_DATA',
          data: data.__AI_HELPER_BODY__
        }, function () {
          if (chrome.runtime.lastError) {
            console.warn('[SPIKE:BRIDGE] sendMessage 错误:', chrome.runtime.lastError.message);
          }
        });
      } catch (e) {
        console.error('[SPIKE:BRIDGE] sendMessage 异常:', e);
      }
    }
  });

  console.log('[SPIKE:BRIDGE] postMessage 监听已安装');
  console.log('[SPIKE:BRIDGE] 如果看到这条日志，说明 ISOLATED world bridge 注入成功！');
})();
