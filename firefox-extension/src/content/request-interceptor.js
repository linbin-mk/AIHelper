(function () {
  'use strict';

  // 飞书域名不拦截，避免干扰其安全机制
  if (/(?:^|\.)feishu\.cn$/.test(location.hostname)) return;

  var BODY_SIZE_LIMIT = 100 * 1024;

  function getPath(url) {
    try {
      var u = new URL(url, location.href);
      return u.pathname + u.search;
    } catch (e) {
      return url;
    }
  }

  function sendBodyData(method, url, requestBody, responseBody) {
    var path = getPath(url);
    window.postMessage({
      __AI_HELPER_BODY__: {
        path: path,
        method: method,
        requestBody: requestBody,
        responseBody: responseBody,
      },
    }, '*');
  }

  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = (init && init.method) || 'GET';
    var requestBody = (init && init.body) || null;
    if (typeof requestBody !== 'string' && requestBody != null) {
      requestBody = String(requestBody);
    }

    return originalFetch.apply(this, arguments).then(function (response) {
      var clone = response.clone();
      clone.text().then(function (text) {
        sendBodyData(method, url, requestBody, text.length > BODY_SIZE_LIMIT ? text.substring(0, BODY_SIZE_LIMIT) : text);
      }).catch(function () {
        sendBodyData(method, url, requestBody, null);
      });
      return response;
    }).catch(function (err) {
      sendBodyData(method, url, requestBody, null);
      throw err;
    });
  };

  var OriginalXHR = XMLHttpRequest;
  XMLHttpRequest = function () {
    var xhr = new OriginalXHR();
    var _method = 'GET';
    var _url = '';
    var _requestBody = null;

    var originalOpen = xhr.open;
    xhr.open = function (method, url) {
      _method = method;
      _url = url;
      return originalOpen.apply(xhr, arguments);
    };

    var originalSend = xhr.send;
    xhr.send = function (body) {
      _requestBody = body;
      if (typeof _requestBody === 'object' && _requestBody != null && _requestBody.constructor !== String) {
        _requestBody = String(_requestBody);
      }

      var loadHandler = function () {
        var responseBody = xhr.responseText;
        if (responseBody && responseBody.length > BODY_SIZE_LIMIT) {
          responseBody = responseBody.substring(0, BODY_SIZE_LIMIT);
        }
        sendBodyData(_method, _url, _requestBody, responseBody);
      };

      xhr.addEventListener('load', loadHandler, { once: true });
      xhr.addEventListener('error', function () {
        sendBodyData(_method, _url, _requestBody, null);
      }, { once: true });

      return originalSend.apply(xhr, arguments);
    };

    return xhr;
  };
  XMLHttpRequest.prototype = OriginalXHR.prototype;

  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || !event.data.__AI_HELPER_REPLAY__) return;
    var data = event.data.__AI_HELPER_REPLAY__;
    var options = {
      method: data.method || 'GET',
      headers: data.headers || {},
    };
    if (data.body != null && data.method !== 'GET') {
      options.body = data.body;
    }
    window.fetch(data.url, options).catch(function () {});
  });
})();
