(function () {
  'use strict';

  console.log('[SPIKE:MAIN] request-interceptor.js 在 MAIN world 中已加载');

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
    console.log('[SPIKE:MAIN] postMessage 发送:', { path, method, requestBody, responseBody });
    window.postMessage({
      __AI_HELPER_BODY__: {
        path: path,
        method: method,
        requestBody: requestBody,
        responseBody: responseBody,
      },
    }, '*');
  }

  // Hook fetch
  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = (init && init.method) || 'GET';
    console.log('[SPIKE:MAIN] fetch 被拦截:', method, url);

    try {
      sendBodyData(method, url, null, null);
    } catch (e) {
      console.error('[SPIKE:MAIN] sendBodyData 错误:', e);
    }

    return originalFetch.apply(this, arguments).then(function (response) {
      var cloned = response.clone();
      cloned.text().then(function (text) {
        sendBodyData(method, url, null, text ? text.substring(0, 500) : null);
      }).catch(function () {});
      return response;
    });
  };
  window.fetch.toString = function () { return originalFetch.toString(); };

  // Hook XMLHttpRequest
  var OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function () {
    var xhr = new OriginalXHR();
    var method = 'GET';
    var url = '';
    var requestBody = null;

    var originalOpen = xhr.open;
    xhr.open = function (m, u) {
      method = m;
      url = typeof u === 'string' ? u : (u && u.href) || '';
      console.log('[SPIKE:MAIN] XHR.open 被拦截:', method, url);
      try {
        sendBodyData(method, url, null, null);
      } catch (e) {
        console.error('[SPIKE:MAIN] XHR.sendBodyData 错误:', e);
      }
      return originalOpen.apply(this, arguments);
    };

    var originalSend = xhr.send;
    xhr.send = function (body) {
      requestBody = body;
      console.log('[SPIKE:MAIN] XHR.send 被拦截, body length:', body ? body.length : 0);
      return originalSend.apply(this, arguments);
    };

    xhr.addEventListener('load', function () {
      console.log('[SPIKE:MAIN] XHR 响应:', method, url, xhr.status);
      try {
        sendBodyData(method, url, requestBody, xhr.responseText ? xhr.responseText.substring(0, 500) : null);
      } catch (e) {
        console.error('[SPIKE:MAIN] XHR.sendBodyData 错误:', e);
      }
    });

    return xhr;
  };
  window.XMLHttpRequest.toString = function () { return OriginalXHR.toString(); };

  console.log('[SPIKE:MAIN] fetch 和 XHR hook 已安装');
  console.log('[SPIKE:MAIN] window 上可直接调用: spikeTest() 来运行测试请求');
  console.log('[SPIKE:MAIN] window 上可直接调用: spikeTest2() 来运行 XHR 测试');

  window.spikeTest = function () {
    console.log('[SPIKE:MAIN] 运行 fetch 测试...');
    fetch('/__spike_test__', { method: 'POST', body: 'test-body' })
      .then(function (r) { return r.text(); })
      .then(function (t) { console.log('[SPIKE:MAIN] fetch 测试完成:', t); })
      .catch(function (e) { console.log('[SPIKE:MAIN] fetch 测试错误 (预期，路径不存在):', e.message); });
  };

  window.spikeTest2 = function () {
    console.log('[SPIKE:MAIN] 运行 XHR 测试...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/__spike_xhr_test__');
    xhr.send('test-xhr-body');
    console.log('[SPIKE:MAIN] XHR 测试已发起');
  };

  console.log('[SPIKE:MAIN] 如果看到这条日志，说明 MAIN world 注入成功！一切就绪。');
})();
