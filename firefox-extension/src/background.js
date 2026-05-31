if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

browser.action.onClicked.addListener(() => {
  browser.sidebarAction.toggle();
});

const TAB_BUFFER_MAX = 100;
const tabRequestBuffers = new Map();

let activeTabId = null;

function getOrCreateTabBuffer(tabId) {
  if (!tabRequestBuffers.has(tabId)) {
    tabRequestBuffers.set(tabId, { buffer: new Map(), order: [] });
  }
  return tabRequestBuffers.get(tabId);
}

function initActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      activeTabId = tabs[0].id;
    }
  });
}

initActiveTab();

function addToBuffer(tabId, requestId, data) {
  const tabBuf = getOrCreateTabBuffer(tabId);
  if (tabBuf.buffer.has(requestId)) return;

  const entry = { ...data, timestamp: Date.now() };

  if (tabBuf.order.length >= TAB_BUFFER_MAX) {
    const oldestId = tabBuf.order.shift();
    if (oldestId) tabBuf.buffer.delete(oldestId);
  }

  tabBuf.buffer.set(requestId, entry);
  tabBuf.order.push(requestId);
}

function getRequestPath(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (details.type !== 'xmlhttprequest' && details.type !== 'other') return;

    addToBuffer(details.tabId, details.requestId, {
      method: details.method,
      url: details.url,
      path: getRequestPath(details.url),
    });

    sendToPanel('REQUEST_CAPTURED', {
      tabId: details.tabId,
      requestId: details.requestId,
      method: details.method,
      path: getRequestPath(details.url),
      status: null,
    });
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (details.type !== 'xmlhttprequest' && details.type !== 'other') return;

    const tabBuf = getOrCreateTabBuffer(details.tabId);
    const entry = tabBuf.buffer.get(details.requestId);
    if (entry && details.requestHeaders) {
      const headerSummary = {};
      details.requestHeaders.forEach(function (h) {
        headerSummary[h.name] = h.value;
      });
      entry.headers = headerSummary;
    }
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId < 0) return;
    if (details.type !== 'xmlhttprequest' && details.type !== 'other') return;

    const tabBuf = getOrCreateTabBuffer(details.tabId);
    const entry = tabBuf.buffer.get(details.requestId);
    if (entry) {
      entry.status = details.statusCode;
    } else {
      addToBuffer(details.tabId, details.requestId, {
        method: details.method,
        url: details.url,
        path: getRequestPath(details.url),
        status: details.statusCode,
      });
    }

    sendToPanel('REQUEST_COMPLETED', {
      tabId: details.tabId,
      requestId: details.requestId,
      method: details.method,
      path: getRequestPath(details.url),
      status: details.statusCode,
      headers: entry ? entry.headers || null : null,
      requestBody: entry ? entry.requestBody || null : null,
      responseBody: entry ? entry.responseBody || null : null,
    });
  },
  { urls: ['<all_urls>'] }
);

chrome.tabs.onActivated.addListener((activeInfo) => {
  activeTabId = activeInfo.tabId;

  sendToPanel('TAB_REQUESTS_SWITCH', { tabId: activeTabId });

  chrome.tabs.get(activeTabId, (tab) => {
    if (chrome.runtime.lastError) return;
    sendToPanel('TAB_CHANGED', { url: tab.url, tabId: activeTabId });
  });

  if (typeof applyHeaders === 'function') {
    applyHeaders(activeTabId);
  }

  injectInterceptor(activeTabId);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabRequestBuffers.has(tabId)) {
    tabRequestBuffers.delete(tabId);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    sendToPanel('URL_CHANGED', { url: changeInfo.url });
  }
});

function sendToPanel(type, data) {
  chrome.runtime.sendMessage({ type, data }).catch(() => {});
}

function getBufferedRequests(tabId) {
  const tid = tabId || activeTabId;
  const tabBuf = tabRequestBuffers.get(tid);
  if (!tabBuf) return [];
  return tabBuf.order.map((id) => {
    const entry = tabBuf.buffer.get(id);
    return {
      requestId: id,
      tabId: tid,
      method: entry.method,
      path: entry.path,
      url: entry.url,
      status: entry.status || null,
      timestamp: entry.timestamp,
      headers: entry.headers || null,
      requestBody: entry.requestBody || null,
      responseBody: entry.responseBody || null,
    };
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'QUERY_REQUESTS':
      sendResponse({ type: 'REQUESTS_DATA', data: getBufferedRequests() });
      break;

    case 'QUERY_TAB_URL':
      chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ type: 'TAB_URL', data: null });
          return;
        }
        sendResponse({ type: 'TAB_URL', data: { url: tab.url, tabId: activeTabId } });
      });
      return true;

    case 'QUERY_COOKIES':
      chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ type: 'COOKIES_DATA', data: { total: 0, session: 0, persistent: 0 } });
          return;
        }
        chrome.cookies.getAll({ url: tab.url }, (cookies) => {
          if (chrome.runtime.lastError) {
            sendResponse({ type: 'COOKIES_DATA', data: { total: 0, session: 0, persistent: 0 } });
            return;
          }
          const session = cookies.filter((c) => c.session).length;
          const persistent = cookies.length - session;
          sendResponse({ type: 'COOKIES_DATA', data: { total: cookies.length, session, persistent } });
        });
      });
      return true;

    case 'ADD_HEADER':
      if (typeof addHeader === 'function') {
        addHeader(message.data.name, message.data.value, activeTabId).then(() => {
          sendResponse({ type: 'HEADERS_UPDATED', data: message.data });
        });
      }
      return true;

    case 'REMOVE_HEADER':
      if (typeof removeHeader === 'function') {
        removeHeader(message.data.name, activeTabId).then(() => {
          sendResponse({ type: 'HEADERS_UPDATED', data: message.data });
        });
      }
      return true;

    case 'GET_HEADERS':
      if (typeof loadHeaders === 'function') {
        loadHeaders().then((headers) => {
          sendResponse({ type: 'HEADERS_DATA', data: headers });
        });
        return true;
      }
      sendResponse({ type: 'HEADERS_DATA', data: [] });
      break;

    case 'CLOSE_PANEL':
      break;

    case 'REQUEST_BODY_DATA': {
      const bodyData = message.data;
      if (bodyData && bodyData.path && bodyData.method) {
        for (const [, tabBuf] of tabRequestBuffers) {
          for (let i = tabBuf.order.length - 1; i >= 0; i--) {
            const entry = tabBuf.buffer.get(tabBuf.order[i]);
            if (entry && entry.path === bodyData.path && entry.method === bodyData.method) {
              if (bodyData.requestBody !== undefined) {
                entry.requestBody = bodyData.requestBody;
              }
              if (bodyData.responseBody !== undefined) {
                entry.responseBody = bodyData.responseBody;
              }
              sendToPanel('REQUEST_BODY_UPDATE', {
                requestId: tabBuf.order[i],
                path: bodyData.path,
                method: bodyData.method,
                requestBody: entry.requestBody || null,
                responseBody: entry.responseBody || null,
              });
              break;
            }
          }
        }
      }
      break;
    }

    case 'QUERY_REQUESTS_FOR_AI':
      sendResponse({
        type: 'REQUESTS_FOR_AI_DATA',
        data: getBufferedRequests(),
      });
      break;

    case 'QUERY_REQUESTS_FOR_AI_FULL':
      sendResponse({
        type: 'REQUESTS_FOR_AI_FULL_DATA',
        data: getBufferedRequests(),
      });
      break;

    case 'QUERY_TAB_URL_FOR_AI':
      chrome.tabs.get(activeTabId, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ type: 'TAB_URL_FOR_AI_DATA', data: null });
          return;
        }
        sendResponse({ type: 'TAB_URL_FOR_AI_DATA', data: tab.url });
      });
      return true;

    case 'GET_PAGE_CONTEXT':
      handleInjectScript(activeTabId, 'src/content/page-context.js', (result) => {
        sendResponse({ type: 'PAGE_CONTEXT_DATA', data: result });
      });
      return true;

    case 'EXTRACT_AUTH':
      handleInjectScript(activeTabId, 'src/content/auth-extractor.js', (result) => {
        sendResponse({ type: 'AUTH_EXTRACT_DATA', data: result });
      });
      return true;

    case 'GET_PAGE_INTERACTIVE_ELEMENTS':
      handleInjectScript(activeTabId, 'src/content/page-interactive-elements.js', (result) => {
        sendResponse({ type: 'PAGE_INTERACTIVE_ELEMENTS_DATA', data: result });
      });
      return true;

    case 'GET_PAGE_CSS':
      handleInjectScript(activeTabId, 'src/content/page-css.js',
        { _storageKey: 'page_css_params', selector: message.selector, mode: message.mode, maxLength: message.maxLength },
        (result) => {
          sendResponse({ type: 'PAGE_CSS_DATA', data: result });
        });
      return true;

    case 'GET_PAGE_SOURCE':
      handleInjectScript(activeTabId, 'src/content/page-source.js',
        { _storageKey: 'page_source_params', selector: message.selector, maxLength: message.maxLength },
        (result) => {
          sendResponse({ type: 'PAGE_SOURCE_DATA', data: result });
        });
      return true;

    case 'GET_PAGE_JS':
      handleInjectScript(activeTabId, 'src/content/page-js.js',
        { _storageKey: 'page_js_params', mode: message.mode, maxLength: message.maxLength },
        (result) => {
          sendResponse({ type: 'PAGE_JS_DATA', data: result });
        });
      return true;

    case 'PAGE_INTERACTIVE_ELEMENTS_RESULT':
      sendToPanel('PAGE_INTERACTIVE_ELEMENTS_RESULT', message.data);
      break;

    case 'EXECUTE_REQUEST_RESULT':
      sendToPanel('EXECUTE_REQUEST_RESULT', message.data);
      break;

    case 'QUERY_REQUEST_DETAIL': {
      const rid = message.requestId;
      if (!rid) {
        sendResponse({ type: 'REQUEST_DETAIL_ERROR', error: 'bad_request', message: '缺少 requestId 参数' });
        break;
      }
      const tabBuf = tabRequestBuffers.get(activeTabId);
      if (!tabBuf || !tabBuf.buffer.has(rid)) {
        sendResponse({ type: 'REQUEST_DETAIL_ERROR', error: 'not_found', message: 'No request found with ID: ' + rid });
        break;
      }
      const entry = tabBuf.buffer.get(rid);
      sendResponse({
        type: 'REQUEST_DETAIL',
        data: {
          requestId: rid,
          url: entry.url,
          method: entry.method,
          path: entry.path,
          status: entry.status || null,
          headers: entry.headers || null,
          requestBody: entry.requestBody || null,
          responseBody: entry.responseBody || null,
          timestamp: entry.timestamp,
        },
      });
      break;
    }

    case 'REFRESH_PAGE':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs || tabs.length === 0) {
          sendResponse({ type: 'REFRESH_PAGE_RESULT', data: { error: 'no_active_tab', message: '未找到活动标签页' } });
          return;
        }
        var tab = tabs[0];
        chrome.tabs.reload(tab.id, function () {
          if (chrome.runtime.lastError) {
            sendResponse({ type: 'REFRESH_PAGE_RESULT', data: { error: 'reload_failed', message: chrome.runtime.lastError.message } });
          } else {
            sendResponse({ type: 'REFRESH_PAGE_RESULT', data: { success: true, url: tab.url } });
          }
        });
      });
      return true;

    case 'EXECUTE_REQUEST': {
      const reqData = message.data;
      if (!reqData || !reqData.url || !reqData.method) {
        sendResponse({ type: 'EXECUTE_REQUEST_ERROR', error: 'bad_request', message: '缺少必要参数 url/method' });
        break;
      }
      executeSingleRequest(reqData, activeTabId, sendResponse);
      return true;
    }

    case 'CLICK_ELEMENT': {
      const clickData = message.data;
      if (!clickData || !clickData.selector) {
        sendResponse({ type: 'CLICK_ELEMENT_ERROR', data: { success: false, error: 'bad_request', message: '缺少 selector 参数' } });
        break;
      }
      if (!activeTabId) {
        sendResponse({ type: 'CLICK_ELEMENT_ERROR', data: { success: false, error: 'no_tab', message: '没有活跃标签页' } });
        break;
      }
      const storageKey = 'click_elem_' + Date.now();
      chrome.storage.local.set({ [storageKey]: { selector: clickData.selector, timeout: clickData.timeout || 3000 } }, () => {
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTabId },
            files: ['src/content/element-click.js'],
          },
          () => {
            if (chrome.runtime.lastError) {
              chrome.storage.local.remove(storageKey);
              sendResponse({
                type: 'CLICK_ELEMENT_ERROR',
                data: { success: false, error: 'inject_failed', message: '注入点击脚本失败: ' + chrome.runtime.lastError.message }
              });
              return;
            }
            sendResponse({ type: 'CLICK_ELEMENT_SENT', data: { message: '点击指令已注入页面' } });
          }
        );
      });
      return true;
    }

    case 'INPUT_TEXT': {
      const inputData = message.data;
      if (!inputData || !inputData.selector || inputData.text === undefined) {
        sendResponse({ type: 'INPUT_TEXT_ERROR', data: { success: false, error: 'bad_request', message: '缺少 selector 或 text 参数' } });
        break;
      }
      if (!activeTabId) {
        sendResponse({ type: 'INPUT_TEXT_ERROR', data: { success: false, error: 'no_tab', message: '没有活跃标签页' } });
        break;
      }
      const storageKey = 'input_elem_' + Date.now();
      chrome.storage.local.set({ [storageKey]: { selector: inputData.selector, text: inputData.text } }, () => {
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTabId },
            files: ['src/content/element-input.js'],
          },
          () => {
            if (chrome.runtime.lastError) {
              chrome.storage.local.remove(storageKey);
              sendResponse({
                type: 'INPUT_TEXT_ERROR',
                data: { success: false, error: 'inject_failed', message: '注入输入脚本失败: ' + chrome.runtime.lastError.message }
              });
              return;
            }
            sendResponse({ type: 'INPUT_TEXT_SENT', data: { message: '输入指令已注入页面' } });
          }
        );
      });
      return true;
    }

    case 'CLICK_ELEMENT_RESULT':
      sendToPanel('CLICK_ELEMENT_RESULT', message.data);
      break;

    case 'INPUT_TEXT_RESULT':
      sendToPanel('INPUT_TEXT_RESULT', message.data);
      break;

    case 'NAVIGATE_TO_URL':
      if (!message.data || !message.data.url) {
        sendResponse({ type: 'NAVIGATE_TO_URL_RESULT', data: { success: false, error: '缺少 url 参数' } });
        break;
      }
      chrome.tabs.update(activeTabId, { url: message.data.url }, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ type: 'NAVIGATE_TO_URL_RESULT', data: { success: false, error: chrome.runtime.lastError.message } });
          return;
        }
        sendResponse({ type: 'NAVIGATE_TO_URL_RESULT', data: { success: true, tabId: tab.id, url: tab.url, title: tab.title } });
      });
      return true;

    case 'OPEN_NEW_TAB':
      chrome.tabs.create({ url: (message.data && message.data.url) || '' }, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ type: 'OPEN_NEW_TAB_RESULT', data: { success: false, error: chrome.runtime.lastError.message } });
          return;
        }
        sendResponse({ type: 'OPEN_NEW_TAB_RESULT', data: { success: true, tabId: tab.id, url: tab.url || '', title: tab.title || '' } });
      });
      return true;

    case 'SWITCH_TO_TAB': {
      const data = message.data || {};
      if (data.tabId) {
        chrome.tabs.update(data.tabId, { active: true }, (tab) => {
          if (chrome.runtime.lastError) {
            sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: false, error: '切换失败: ' + chrome.runtime.lastError.message } });
            return;
          }
          sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: true, tabId: tab.id, url: tab.url, title: tab.title } });
        });
        return true;
      }
      if (data.urlPattern) {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          const matched = tabs.find((t) => t.url && t.url.toLowerCase().includes(data.urlPattern.toLowerCase()));
          if (!matched) {
            sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: false, error: '未找到包含 "' + data.urlPattern + '" 的标签页' } });
            return;
          }
          chrome.tabs.update(matched.id, { active: true }, (tab) => {
            if (chrome.runtime.lastError) {
              sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: false, error: '切换失败: ' + chrome.runtime.lastError.message } });
              return;
            }
            sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: true, tabId: tab.id, url: tab.url, title: tab.title } });
          });
        });
        return true;
      }
      sendResponse({ type: 'SWITCH_TO_TAB_RESULT', data: { success: false, error: '需要提供 tabId 或 urlPattern' } });
      break;
    }

    case 'CLOSE_TAB': {
      const ctabId = message.data && message.data.tabId;
      if (!ctabId) {
        sendResponse({ type: 'CLOSE_TAB_RESULT', data: { success: false, error: '缺少 tabId 参数' } });
        break;
      }
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        if (tabs.length <= 1) {
          sendResponse({ type: 'CLOSE_TAB_RESULT', data: { success: false, error: '不能关闭唯一的标签页' } });
          return;
        }
        chrome.tabs.remove(ctabId, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ type: 'CLOSE_TAB_RESULT', data: { success: false, error: chrome.runtime.lastError.message } });
            return;
          }
          sendResponse({ type: 'CLOSE_TAB_RESULT', data: { success: true, message: '标签页已关闭' } });
        });
      });
      return true;
    }

    case 'LIST_TABS':
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const result = tabs.map((t) => ({ tabId: t.id, url: t.url || '', title: t.title || '', active: t.active }));
        sendResponse({ type: 'LIST_TABS_RESULT', data: { success: true, tabs: result } });
      });
      return true;
  }
});

function injectInterceptor(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ['src/content/request-interceptor.js'],
      world: 'MAIN',
    },
    () => {
      if (chrome.runtime.lastError) {
        // CSP 可能阻止注入，静默忽略
      }
    }
  );
}

function handleInjectScript(tabId, filePath, param3, param4) {
  var storageParams = null;
  var callback;

  if (typeof param3 === 'function') {
    callback = param3;
  } else {
    storageParams = param3;
    callback = param4;
  }

  if (!tabId) {
    callback({ error: 'No active tab' });
    return;
  }

  function doInject() {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: [filePath],
      },
      (results) => {
        if (chrome.runtime.lastError) {
          callback({ error: 'Script injection failed: ' + chrome.runtime.lastError.message });
          return;
        }

        if (!results || results.length === 0) {
          callback({ error: 'Script returned no result' });
          return;
        }

        const result = results[0].result;
        callback(result);
      }
    );
  }

  if (storageParams) {
    var storageKey = storageParams._storageKey || ('inject_' + Date.now());
    delete storageParams._storageKey;
    chrome.storage.local.set({ [storageKey]: storageParams }, function () {
      doInject();
    });
  } else {
    doInject();
  }
}

function executeSingleRequest(reqData, tabId, sendResponse) {
  if (!tabId) {
    sendResponse({ type: 'EXECUTE_REQUEST_ERROR', error: 'no_tab', message: '没有活跃标签页' });
    return;
  }

  const storageKey = 'single_req_' + Date.now();
  chrome.storage.local.set({ [storageKey]: reqData }, () => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ['src/content/execute-request-inject.js'],
      },
      () => {
        if (chrome.runtime.lastError) {
          chrome.storage.local.remove(storageKey);
          sendResponse({
            type: 'EXECUTE_REQUEST_ERROR',
            error: 'inject_failed',
            message: '注入执行脚本失败: ' + chrome.runtime.lastError.message,
          });
          return;
        }
        sendResponse({ type: 'EXECUTE_REQUEST_SENT', message: '请求已注入页面执行' });
      }
    );
  });
}
