(function () {
  'use strict';

  var INPUT_TYPES = ['text', 'search', 'url', 'tel', 'email', 'password', 'number', 'date', 'month', 'week', 'time', 'datetime-local', 'color', ''];

  function isInputElement(el) {
    var tag = (el.tagName || '').toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') {
      var type = (el.getAttribute('type') || 'text').toLowerCase();
      return INPUT_TYPES.indexOf(type) !== -1;
    }
    return false;
  }

  function isContentEditable(el) {
    return el.isContentEditable === true;
  }

  (async function () {
    var storageKeys = await new Promise(function (resolve) {
      chrome.storage.local.get(null, resolve);
    });

    var inputKey = null;
    var inputData = null;
    var keys = Object.keys(storageKeys);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].startsWith('input_elem_')) {
        inputKey = keys[i];
        inputData = storageKeys[keys[i]];
        break;
      }
    }

    if (!inputKey || !inputData) return;

    chrome.storage.local.remove(inputKey);

    var selector = inputData.selector;
    var text = inputData.text;

    var el = null;
    try {
      el = document.querySelector(selector);
    } catch (e) {
      chrome.runtime.sendMessage({
        type: 'INPUT_TEXT_RESULT',
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
        type: 'INPUT_TEXT_RESULT',
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

    var isInput = isInputElement(el);
    var isEditable = isContentEditable(el);

    if (!isInput && !isEditable) {
      chrome.runtime.sendMessage({
        type: 'INPUT_TEXT_RESULT',
        data: {
          success: false,
          error: 'not_input_element',
          message: '目标元素不是可输入元素',
          elementTag: (el.tagName || '').toLowerCase(),
          selector: selector
        }
      }).catch(function () {});
      return;
    }

    try {
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
    } catch (e1) {
      try {
        el.scrollIntoView(true);
      } catch (e2) {}
    }

    try {
      el.focus();
    } catch (e) {}

    var resultData = {
      success: true,
      selector: selector,
      matchedCount: matchedCount
    };

    if (isEditable) {
      el.textContent = text;
      el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
      var elText = el.textContent || '';
      resultData.elementTag = (el.tagName || '').toLowerCase();
      resultData.inputMode = 'contenteditable';
      resultData.valueCheck = elText === text ? 'matched' : 'mismatch';
      if (elText !== text) {
        resultData.actualValue = elText.substring(0, 100);
        resultData.message = '值已设置但读取不匹配，目标元素可能被框架控制';
      }
    } else {
      el.value = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      var elValue = el.value || '';
      resultData.elementTag = (el.tagName || '').toLowerCase();
      resultData.valueCheck = elValue === text ? 'matched' : 'mismatch';
      if (elValue !== text) {
        resultData.actualValue = elValue.substring(0, 100);
        resultData.message = '值已设置但读取不匹配，目标元素可能被框架控制';
      }
    }

    chrome.runtime.sendMessage({
      type: 'INPUT_TEXT_RESULT',
      data: resultData
    }).catch(function () {});
  })();
})();
