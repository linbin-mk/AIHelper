(function () {
  'use strict';

  if (typeof browser === 'undefined') {
    globalThis.browser = chrome;
  }

  console.log('[SPIKE:BG] background Event Page 已加载');

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'SPIKE_BODY_DATA') {
      console.log('[SPIKE:BG] 收到请求体数据:', message.data);
      console.log('[SPIKE:BG] 来源 tab:', sender.tab ? sender.tab.id : 'N/A');
    }
  });

  chrome.runtime.onInstalled.addListener(function () {
    console.log('[SPIKE:BG] 扩展已安装/更新');
  });

  console.log('[SPIKE:BG] 后台就绪。请打开任意网页，查看控制台输出。');
  console.log('[SPIKE:BG] 验证清单:');
  console.log('  1. MAIN world 脚本是否加载？→ 网页控制台应有 [SPIKE:MAIN] 日志');
  console.log('  2. fetch hook 是否工作？→ 在网页控制台执行 spikeTest()');
  console.log('  3. XHR hook 是否工作？→ 在网页控制台执行 spikeTest2()');
  console.log('  4. postMessage 是否传递到 bridge？→ 网页控制台应有 [SPIKE:BRIDGE] 日志');
  console.log('  5. bridge 是否能 sendMessage 到 bg？→ Service Worker 控制台应有 [SPIKE:BG] 日志');
})();
