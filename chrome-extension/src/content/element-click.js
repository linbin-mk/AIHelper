(function () {
  'use strict';

  var DANGER_KEYWORDS = [
    'delete', 'remove', 'logout', 'sign out', 'signout',
    'reset', 'clear', 'purge', 'destroy',
    '\u5220\u9664', '\u767b\u51fa', '\u9000\u51fa', '\u6ce8\u9500',
    '\u91cd\u7f6e', '\u6e05\u7a7a', '\u6e05\u9664', '\u9500\u6bc1'
  ];
  var DANGER_REGEX = new RegExp(DANGER_KEYWORDS.join('|'), 'i');

  function getElementText(el) {
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100);
    if (!text) text = (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    return text;
  }

  (async function () {
    var storageKeys = await new Promise(function (resolve) {
      chrome.storage.local.get(null, resolve);
    });

    var clickKey = null;
    var clickData = null;
    var keys = Object.keys(storageKeys);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].startsWith('click_elem_')) {
        clickKey = keys[i];
        clickData = storageKeys[keys[i]];
        break;
      }
    }

    if (!clickKey || !clickData) return;

    chrome.storage.local.remove(clickKey);

    var selector = clickData.selector;
    var timeout = clickData.timeout || 3000;

    var el = null;
    try {
      el = document.querySelector(selector);
    } catch (e) {
      chrome.runtime.sendMessage({
        type: 'CLICK_ELEMENT_RESULT',
        data: {
          success: false,
          error: 'invalid_selector',
          message: 'CSS选择器语法错误: ' + e.message,
          selector: selector
        }
      }).catch(function () {});
      return;
    }

    if (!el) {
      chrome.runtime.sendMessage({
        type: 'CLICK_ELEMENT_RESULT',
        data: {
          success: false,
          error: 'selector_not_found',
          message: '未找到匹配元素: ' + selector,
          selector: selector
        }
      }).catch(function () {});
      return;
    }

    var matchedCount = 1;
    try {
      matchedCount = document.querySelectorAll(selector).length;
    } catch (e) {}

    var elementText = getElementText(el);

    if (DANGER_REGEX.test(elementText)) {
      chrome.runtime.sendMessage({
        type: 'CLICK_ELEMENT_RESULT',
        data: {
          success: false,
          warning: 'dangerous_action',
          message: '元素文本包含危险关键词，已拒绝执行: ' + elementText,
          selector: selector
        }
      }).catch(function () {});
      return;
    }

    var urlBefore = window.location.href;

    try {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    } catch (e1) {
      try {
        el.scrollIntoView(true);
      } catch (e2) {}
    }

    try {
      el.click();
    } catch (e3) {
      try {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } catch (e4) {
        chrome.runtime.sendMessage({
          type: 'CLICK_ELEMENT_RESULT',
          data: {
            success: false,
            error: 'click_failed',
            message: '点击失败: ' + (e3.message || e4.message || ''),
            selector: selector
          }
        }).catch(function () {});
        return;
      }
    }

    var pageChanged = false;
    var checkEnd = Date.now() + timeout;

    function checkLoop() {
      var urlChanged = window.location.href !== urlBefore;

      if (urlChanged) {
        pageChanged = true;
        chrome.runtime.sendMessage({
          type: 'CLICK_ELEMENT_RESULT',
          data: {
            success: true,
            elementText: elementText,
            pageChanged: pageChanged,
            selector: selector,
            matchedCount: matchedCount
          }
        }).catch(function () {});
        return;
      }

      if (Date.now() >= checkEnd) {
        chrome.runtime.sendMessage({
          type: 'CLICK_ELEMENT_RESULT',
          data: {
            success: true,
            elementText: elementText,
            pageChanged: pageChanged,
            selector: selector,
            matchedCount: matchedCount,
            message: '点击已执行，未检测到页面变化'
          }
        }).catch(function () {});
        return;
      }

      setTimeout(checkLoop, 200);
    }

    setTimeout(checkLoop, 300);
  })();
})();
