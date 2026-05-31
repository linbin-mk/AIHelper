(function () {
  'use strict';

  var MAX_ELEMENTS = 100;

  var INTERACTIVE_SELECTORS = [
    'a[href]',
    'button',
    '[role="button"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="link"]',
    '[role="treeitem"]',
    '[role="option"]',
    '[role="menuitemcheckbox"]',
    '[role="menuitemradio"]',
    '[onclick]',
    'input[type="submit"]',
    'input[type="button"]',
    'input[type="reset"]',
    '[class*="nav-item"]',
    '[class*="menu-item"]',
    '[class*="sidebar-item"]',
    '[class*="tab-item"]',
    '.nav-item',
    '.menu-item',
    '.sidebar-item',
  ];

  function isElementVisible(el) {
    if (!el || !el.isConnected) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
    if (rect.right < 0 || rect.left > window.innerWidth) return false;
    return true;
  }

  function getVisibleText(el) {
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length > 80) text = text.substring(0, 80) + '...';
    if (!text && el.getAttribute('title')) text = el.getAttribute('title').trim();
    if (!text && el.getAttribute('aria-label')) text = el.getAttribute('aria-label').trim();
    if (!text && el.getAttribute('placeholder')) text = el.getAttribute('placeholder').trim();
    return text.substring(0, 80);
  }

  function getSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);

    var tag = el.tagName.toLowerCase();
    var testId = el.getAttribute('data-testid');
    if (testId) return tag + '[data-testid="' + testId + '"]';

    var dataKey = el.getAttribute('data-key');
    if (dataKey) return tag + '[data-key="' + dataKey + '"]';

    var ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return tag + '[aria-label="' + ariaLabel + '"]';

    if (tag === 'a' && el.href) {
      try {
        var path = el.getAttribute('href');
        if (path && path.startsWith('#')) return tag + '[href="' + path + '"]';
        if (path && !path.startsWith('http')) return tag + '[href="' + path + '"]';
      } catch (e) {}
    }

    var title = el.getAttribute('title');
    if (title) return tag + '[title="' + title + '"]';

    var cls = el.getAttribute('class');
    if (cls) {
      var classes = cls.split(/\s+/).filter(function (c) { return c.length > 0 && !c.match(/^\d/); }).slice(0, 2);
      if (classes.length > 0) return tag + '.' + classes.join('.');
    }

    return tag;
  }

  function getUniqueSelector(el) {
    var sel = getSelector(el);
    if (!sel) return null;
    try {
      var matches = document.querySelectorAll(sel);
      if (matches.length === 1) return sel;
    } catch (e) {
      return null;
    }

    var parent = el.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      var parentSel = getSelector(parent);
      if (parentSel) {
        try {
          var combined = parentSel + ' > ' + getSelector(el);
          var matches2 = document.querySelectorAll(combined);
          if (matches2.length === 1) return combined;
        } catch (e) {}
      }

      var index = Array.prototype.indexOf.call(parent.children, el) + 1;
      var nthChild = parentSel + ' > :nth-child(' + index + ')';
      try {
        var matches3 = document.querySelectorAll(nthChild);
        if (matches3.length === 1) return nthChild;
      } catch (e) {}
    }

    return sel;
  }

  function isNavSemantic(el) {
    var role = (el.getAttribute('role') || '').toLowerCase();
    if (['navigation', 'menubar', 'tablist', 'tab', 'menuitem', 'treeitem', 'tree'].indexOf(role) >= 0) return true;
    var parent = el.closest('[role="navigation"], [role="menubar"], [role="tablist"], nav, .sidebar, [class*="nav"], [class*="menu"], [class*="sidebar"]');
    return !!parent;
  }

  function extractInteractiveElements() {
    var seenTexts = new Set();
    var elements = [];
    var allMatches = [];

    for (var i = 0; i < INTERACTIVE_SELECTORS.length; i++) {
      try {
        var nodes = document.querySelectorAll(INTERACTIVE_SELECTORS[i]);
        for (var j = 0; j < nodes.length; j++) {
          if (allMatches.indexOf(nodes[j]) < 0) {
            allMatches.push(nodes[j]);
          }
        }
      } catch (e) {}
    }

    var navElements = [];
    var otherElements = [];

    for (var k = 0; k < allMatches.length; k++) {
      var el = allMatches[k];
      if (!isElementVisible(el)) continue;

      var text = getVisibleText(el);
      if (!text) continue;

      if (seenTexts.has(text)) continue;
      seenTexts.add(text);

      var rect = el.getBoundingClientRect();
      var elementInfo = {
        tagName: el.tagName.toLowerCase(),
        text: text,
        selector: getUniqueSelector(el),
        rect: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        role: el.getAttribute('role') || '',
        href: (el.tagName === 'A' ? (el.getAttribute('href') || '').substring(0, 200) : ''),
        type: (el.tagName === 'INPUT' || el.tagName === 'BUTTON' ? (el.type || '') : ''),
        isVisible: true
      };

      if (isNavSemantic(el)) {
        navElements.push(elementInfo);
      } else {
        otherElements.push(elementInfo);
      }
    }

    elements = navElements.concat(otherElements).slice(0, MAX_ELEMENTS);

    return {
      url: window.location.href,
      title: document.title,
      elements: elements,
      count: elements.length
    };
  }

  var result = extractInteractiveElements();

  try {
    chrome.runtime.sendMessage({
      type: 'PAGE_INTERACTIVE_ELEMENTS_RESULT',
      data: result
    });
  } catch (e) {}

  return result;
})();
