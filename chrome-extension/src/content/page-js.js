(function () {
  'use strict';

  return (async function () {
    var storageData = await new Promise(function (resolve) {
      chrome.storage.local.get('page_js_params', resolve);
    });

    var params = storageData.page_js_params || {};

    if (storageData.page_js_params) {
      chrome.storage.local.remove('page_js_params');
    }

    var mode = params.mode || 'inline';
    var maxLength = params.maxLength || 50000;

    var scripts = document.querySelectorAll('script');
    var inlineScripts = [];
    var externalScripts = [];
    var totalLength = 0;
    var truncated = false;

    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i];
      if (s.src) {
        externalScripts.push({ src: s.src, type: s.type || 'text/javascript', async: s.async, defer: s.defer });
      } else {
        var text = s.textContent || '';
        if (totalLength + text.length > maxLength) {
          truncated = true;
          text = text.substring(0, maxLength - totalLength);
        }
        inlineScripts.push({
          index: i,
          text: text,
          type: s.type || 'text/javascript'
        });
        totalLength += text.length;
        if (truncated) break;
      }
    }

    var result = {
      url: window.location.href,
      title: document.title,
      mode: mode,
      inlineScripts: mode === 'external' ? [] : inlineScripts,
      externalScripts: mode === 'inline' ? [] : externalScripts,
      inlineCount: inlineScripts.length,
      externalCount: externalScripts.length,
      truncated: truncated,
      totalLength: totalLength
    };

    return result;
  })();
})();
