(function () {
  'use strict';

  return (async function () {
    var storageData = await new Promise(function (resolve) {
      chrome.storage.local.get('page_source_params', resolve);
    });

    var params = storageData.page_source_params || {};

    if (storageData.page_source_params) {
      chrome.storage.local.remove('page_source_params');
    }

    var selector = params.selector || 'body';
    var maxLength = params.maxLength;
    if (!maxLength || maxLength < 1) maxLength = 50000;

    var el = document.querySelector(selector);
    if (!el) {
      return { selector: selector, error: 'NO_ELEMENT_FOUND' };
    }

    var html = el.outerHTML;
    var totalLength = html.length;
    var truncated = false;

    if (html.length > maxLength) {
      html = html.substring(0, maxLength);
      truncated = true;
    }

    return {
      url: window.location.href,
      title: document.title,
      selector: selector,
      html: html,
      truncated: truncated,
      totalLength: totalLength
    };
  })();
})();
