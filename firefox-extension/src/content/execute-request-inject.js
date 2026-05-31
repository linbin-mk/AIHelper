(function () {
  'use strict';

  (async function () {
    const storageKeys = await new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });

    let reqKey = null;
    let reqData = null;
    for (const key of Object.keys(storageKeys)) {
      if (key.startsWith('single_req_')) {
        reqKey = key;
        reqData = storageKeys[key];
        break;
      }
    }

    if (!reqKey || !reqData) return;

    const { url, method, headers, body } = reqData;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const fetchOptions = {
        method: method || 'GET',
        signal: controller.signal,
      };
      if (headers && typeof headers === 'object') {
        fetchOptions.headers = headers;
      }
      if (body && method !== 'GET' && method !== 'HEAD') {
        fetchOptions.body = body;
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const responseBody = await response.text().catch(() => '');
      const responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });

      chrome.runtime.sendMessage({
        type: 'EXECUTE_REQUEST_RESULT',
        data: {
          url: url,
          method: method,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody.substring(0, 50000),
          error: null,
        },
      }).catch(() => {});
    } catch (err) {
      let errorType = 'unknown';
      let errorMessage = err.message || 'Unknown error';
      if (err.name === 'AbortError') {
        errorType = 'timeout';
        errorMessage = '请求超时: 超过30秒未响应';
      } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        errorType = 'network_error';
      }

      chrome.runtime.sendMessage({
        type: 'EXECUTE_REQUEST_RESULT',
        data: {
          url: url,
          method: method,
          status: null,
          statusText: null,
          headers: null,
          body: null,
          error: { type: errorType, message: errorMessage },
        },
      }).catch(() => {});
    } finally {
      if (reqKey) {
        chrome.storage.local.remove(reqKey);
      }
    }
  })();
})();
