(function () {
  'use strict';

  var DEFAULT_CSS_PROPS = null;
  var EMPTY_DIV_STYLE = null;

  function getDefaultStyleMap() {
    if (DEFAULT_CSS_PROPS) return DEFAULT_CSS_PROPS;
    var div = document.createElement('div');
    EMPTY_DIV_STYLE = window.getComputedStyle(div);
    DEFAULT_CSS_PROPS = {};
    for (var i = 0; i < EMPTY_DIV_STYLE.length; i++) {
      DEFAULT_CSS_PROPS[EMPTY_DIV_STYLE[i]] = EMPTY_DIV_STYLE.getPropertyValue(EMPTY_DIV_STYLE[i]);
    }
    return DEFAULT_CSS_PROPS;
  }

  function extractComputedStyle(selector) {
    var el = document.querySelector(selector);
    if (!el) {
      return { selector: selector, error: 'NO_ELEMENT_FOUND' };
    }

    var style = window.getComputedStyle(el);
    var defaults = getDefaultStyleMap();
    var computedStyle = {};

    for (var i = 0; i < style.length; i++) {
      var prop = style[i];
      var val = style.getPropertyValue(prop);
      var defaultVal = defaults[prop];
      if (defaultVal === undefined || val !== defaultVal) {
        computedStyle[prop] = val;
      }
    }

    return {
      selector: selector,
      computedStyle: computedStyle,
      elementInfo: {
        tagName: el.tagName.toLowerCase(),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 200)
      }
    };
  }

  function extractStylesheets(maxLength) {
    maxLength = maxLength || 50000;
    var stylesheets = [];
    var totalLength = 0;
    var truncated = false;

    var styleEls = document.querySelectorAll('style');
    var linkEls = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < styleEls.length; i++) {
      var cssText = styleEls[i].textContent || '';
      if (totalLength + cssText.length > maxLength) {
        truncated = true;
        cssText = cssText.substring(0, maxLength - totalLength);
      }
      stylesheets.push({ type: 'inline', cssText: cssText });
      totalLength += cssText.length;
      if (truncated) break;
    }

    for (var j = 0; j < linkEls.length && !truncated; j++) {
      var link = linkEls[j];
      try {
        var sheet = link.sheet;
        var rulesText = '';
        if (sheet && sheet.cssRules) {
          for (var k = 0; k < sheet.cssRules.length; k++) {
            rulesText += sheet.cssRules[k].cssText + '\n';
          }
        }
        if (totalLength + rulesText.length > maxLength) {
          truncated = true;
          rulesText = rulesText.substring(0, maxLength - totalLength);
        }
        stylesheets.push({
          type: 'external',
          href: link.href || '',
          cssText: rulesText,
          accessible: true
        });
        totalLength += rulesText.length;
      } catch (e) {
        stylesheets.push({
          type: 'external',
          href: link.href || '',
          cssText: '',
          accessible: false
        });
      }
    }

    return {
      stylesheets: stylesheets,
      count: stylesheets.length,
      truncated: truncated,
      totalLength: totalLength
    };
  }

  return (async function () {
    var storageData = await new Promise(function (resolve) {
      chrome.storage.local.get('page_css_params', resolve);
    });

    var params = storageData.page_css_params || {};

    if (storageData.page_css_params) {
      chrome.storage.local.remove('page_css_params');
    }

    var mode = params.mode || 'computed';
    var selector = params.selector || '';
    var maxLength = params.maxLength || 50000;

    var result;
    if (mode === 'stylesheet') {
      result = extractStylesheets(maxLength);
    } else {
      if (!selector) {
        result = { error: 'selector is required for computed mode' };
      } else {
        result = extractComputedStyle(selector);
      }
    }

    result.mode = mode;
    return result;
  })();
})();
