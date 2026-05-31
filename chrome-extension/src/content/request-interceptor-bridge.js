(function () {
  'use strict';

  function isValidContext() {
    try {
      return !!chrome.runtime && !!chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  window.addEventListener('message', function (event) {
    if (!isValidContext()) return;
    if (!event.data || !event.data.__AI_HELPER_BODY__) return;

    var bodyData = event.data.__AI_HELPER_BODY__;
    chrome.runtime.sendMessage({
      type: 'REQUEST_BODY_DATA',
      data: {
        path: bodyData.path,
        method: bodyData.method,
        requestBody: bodyData.requestBody,
        responseBody: bodyData.responseBody,
      },
    }).catch(function () {});
  });

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'REPLAY_REQUEST' && message.data) {
      window.postMessage({
        __AI_HELPER_REPLAY__: message.data,
      }, '*');
    }
  });
})();
