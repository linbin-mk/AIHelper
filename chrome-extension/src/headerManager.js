const HEADERS_STORAGE_KEY = 'ai_helper_headers';
const DNR_RULE_ID_BASE = 1000;

let headerRuleMap = {};

async function loadHeaders() {
  const result = await chrome.storage.local.get(HEADERS_STORAGE_KEY);
  return result[HEADERS_STORAGE_KEY] || [];
}

async function persistHeaders(headers) {
  await chrome.storage.local.set({ [HEADERS_STORAGE_KEY]: headers });
}

async function addHeader(name, value, tabId) {
  const headers = await loadHeaders();

  const existingIndex = headers.findIndex((h) => h.name.toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    headers[existingIndex] = { name, value };
  } else {
    headers.push({ name, value });
  }

  await persistHeaders(headers);
  await applyHeaders(tabId, headers);
}

async function removeHeader(name, tabId) {
  let headers = await loadHeaders();
  headers = headers.filter((h) => h.name.toLowerCase() !== name.toLowerCase());
  await persistHeaders(headers);
  await applyHeaders(tabId, headers);
}

async function applyHeaders(tabId, headers) {
  if (!headers) {
    headers = await loadHeaders();
  }

  const removeIds = Object.keys(headerRuleMap).map(Number);
  const addRules = [];

  if (headers.length > 0 && tabId) {
    headers.forEach((h, i) => {
      const ruleId = DNR_RULE_ID_BASE + i;
      headerRuleMap[ruleId] = true;
      addRules.push({
        id: ruleId,
        priority: 1,
        condition: {
          tabIds: [tabId],
          resourceTypes: ['xmlhttprequest', 'main_frame', 'sub_frame'],
        },
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: h.name,
              operation: 'set',
              value: h.value,
            },
          ],
        },
      });
    });
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds.length > 0 ? removeIds : undefined,
      addRules: addRules.length > 0 ? addRules : undefined,
    });
  } catch (e) {
    console.error('DNR update failed:', e);
  }

  if (headers.length === 0) {
    headerRuleMap = {};
  }
}

async function clearHeadersForTab(tabId) {
  const removeIds = Object.keys(headerRuleMap).map(Number);
  headerRuleMap = {};

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds.length > 0 ? removeIds : undefined,
    });
  } catch (e) {
    console.error('DNR clear failed:', e);
  }
}

async function initHeaders() {
  const headers = await loadHeaders();
  if (headers.length > 0) {
    applyHeaders(activeTabId, headers);
  }
}

initHeaders();
