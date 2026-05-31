const HEADERS_STORAGE_KEY = 'ai_helper_headers';

let headerListener = null;
let headerTabTarget = null;
let currentHeaders = [];

async function loadHeaders() {
  const result = await chrome.storage.local.get(HEADERS_STORAGE_KEY);
  return result[HEADERS_STORAGE_KEY] || [];
}

async function persistHeaders(headers) {
  await chrome.storage.local.set({ [HEADERS_STORAGE_KEY]: headers });
}

function removeHeaderListener() {
  if (headerListener) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(headerListener);
    headerListener = null;
  }
  headerTabTarget = null;
}

function applyHeaders(tabId, headers) {
  if (!headers) {
    headers = currentHeaders;
  } else {
    currentHeaders = headers;
  }

  removeHeaderListener();

  if (!headers || headers.length === 0) return;
  if (!tabId) return;

  headerTabTarget = tabId;

  const headerMap = {};
  headers.forEach(function (h) {
    headerMap[h.name.toLowerCase()] = { name: h.name, value: h.value };
  });

  headerListener = function (details) {
    if (details.tabId !== headerTabTarget) return;

    details.requestHeaders = details.requestHeaders.filter(function (h) {
      return !headerMap.hasOwnProperty(h.name.toLowerCase());
    });

    headers.forEach(function (h) {
      details.requestHeaders.push({
        name: h.name,
        value: h.value,
      });
    });

    return { requestHeaders: details.requestHeaders };
  };

  chrome.webRequest.onBeforeSendHeaders.addListener(
    headerListener,
    { urls: ['<all_urls>'], types: ['xmlhttprequest', 'main_frame', 'sub_frame'] },
    ['blocking', 'requestHeaders']
  );
}

async function addHeader(name, value, tabId) {
  const headers = await loadHeaders();

  const existingIndex = headers.findIndex(function (h) {
    return h.name.toLowerCase() === name.toLowerCase();
  });
  if (existingIndex >= 0) {
    headers[existingIndex] = { name: name, value: value };
  } else {
    headers.push({ name: name, value: value });
  }

  await persistHeaders(headers);
  applyHeaders(tabId, headers);
}

async function removeHeader(name, tabId) {
  let headers = await loadHeaders();
  headers = headers.filter(function (h) {
    return h.name.toLowerCase() !== name.toLowerCase();
  });
  await persistHeaders(headers);
  applyHeaders(tabId, headers);
}

function clearHeadersForTab(tabId) {
  currentHeaders = [];
  removeHeaderListener();
}
