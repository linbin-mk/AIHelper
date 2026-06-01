if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

const tabMonitorBtn = document.getElementById('tabMonitorBtn');
const tabChatBtn = document.getElementById('tabChatBtn');
const tabSkillsBtn = document.getElementById('tabSkillsBtn');
const tabKnowledgeBtn = document.getElementById('tabKnowledgeBtn');
const tabSettingsBtn = document.getElementById('tabSettingsBtn');
const tabChat = document.getElementById('tab-chat');
const tabSkills = document.getElementById('tab-skills');
const tabMonitor = document.getElementById('tab-monitor');
const tabKnowledge = document.getElementById('tab-knowledge');
const tabSettings = document.getElementById('tab-settings');

const requestListEl = document.getElementById('requestList');
const currentUrlEl = document.getElementById('currentUrl');
const cookieInfoEl = document.getElementById('cookieInfo');
const headerStatusEl = document.getElementById('headerStatus');
const headerNameEl = document.getElementById('headerName');
const headerValueEl = document.getElementById('headerValue');
const addHeaderBtn = document.getElementById('addHeaderBtn');
const headerListEl = document.getElementById('headerList');
const closeBtn = document.getElementById('closeBtn');

const settingsNavItems = document.querySelectorAll('.settings-nav-item');
const settingsProvider = document.getElementById('settings-provider');
const settingsBasic = document.getElementById('settings-basic');
const settingsAdvanced = document.getElementById('settings-advanced');
const maxToolRoundsEl = document.getElementById('maxToolRounds');
const debugModeToggleEl = document.getElementById('debugModeToggle');
const themeToggleEl = document.getElementById('themeToggle');
const basicConfigSaveBtn = document.getElementById('basicConfigSaveBtn');
const advancedConfigSaveBtn = document.getElementById('advancedConfigSaveBtn');
const maxToolRoundsErrorEl = document.getElementById('maxToolRoundsError');
const languageSelectEl = document.getElementById('languageSelect');

const viewAgentsMdBtn = document.getElementById('viewAgentsMdBtn');
const agentsMdField = document.getElementById('agentsMdField');
const fileModalOverlay = document.getElementById('fileModalOverlay');

const SETTINGS_KEY = 'ai_helper_settings';
const THEME_KEY = 'ai_helper_theme';

const skillRegistry = window.__getSkillRegistry();
window.skillRegistry = skillRegistry;

let currentHeaders = [];
let currentExpandedRid = null;
let requestDataMap = {};
let currentMonitoringTabId = null;
let initialDataLoaded = false;

let currentSessionId = null;
let currentSessionMessages = [];
window.currentSessionId = currentSessionId;
window.currentSessionMessages = currentSessionMessages;

function switchTab(tabId) {
  const tabs = { monitor: tabMonitor, chat: tabChat, knowledge: tabKnowledge, skills: tabSkills, settings: tabSettings };
  Object.keys(tabs).forEach((k) => {
    tabs[k].classList.remove('active');
  });
  tabs[tabId].classList.add('active');

  tabMonitorBtn.classList.toggle('active', tabId === 'monitor');
  tabChatBtn.classList.toggle('active', tabId === 'chat');
  tabKnowledgeBtn.classList.toggle('active', tabId === 'knowledge');
  tabSkillsBtn.classList.toggle('active', tabId === 'skills');
  tabSettingsBtn.classList.toggle('active', tabId === 'settings');

  if (tabId === 'chat') {
    refreshChatView();
  }
  if (tabId === 'knowledge' && typeof initKnowledgeManager === 'function') {
    initKnowledgeManager();
  }
  if (tabId === 'skills') {
    renderSkillsList();
    renderFavorites();
    checkConnectivityForSkills();
  }
  if (tabId === 'settings') {
    switchSettingsSection('provider');
  }
}

async function refreshChatView() {
  const activeId = await SessionManager.getActiveSessionId();
  if (activeId) {
    const session = await SessionManager.getSession(activeId);
    if (session && session.messages.length > 0) {
      currentSessionId = session.id;
      currentSessionMessages = session.messages;
      window.currentSessionId = currentSessionId;
      window.currentSessionMessages = currentSessionMessages;
      window.chatMessages = currentSessionMessages;
      hideWelcomePage();
      if (typeof renderChatMessages === 'function') {
        renderChatMessages(currentSessionMessages);
      }
      updateSessionTitleDisplay(session.title);
      renderSessionList();
      return;
    }
  }
  currentSessionId = null;
  currentSessionMessages = [];
  window.currentSessionId = null;
  window.currentSessionMessages = [];
  window.chatMessages = [];
  showWelcomePage();
  renderSessionList();
}

tabChatBtn.addEventListener('click', () => switchTab('chat'));
tabSkillsBtn.addEventListener('click', () => switchTab('skills'));
tabMonitorBtn.addEventListener('click', () => switchTab('monitor'));
tabKnowledgeBtn.addEventListener('click', () => switchTab('knowledge'));
tabSettingsBtn.addEventListener('click', () => switchTab('settings'));

document.getElementById('smartSearchBtn').addEventListener('click', function () {
  var input = document.getElementById('smartSearchInput');
  if (input) {
    var q = input.value;
    input.value = '';
    triggerSmartSearch(q);
  }
});
document.getElementById('smartSearchInput').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    var q = e.target.value;
    e.target.value = '';
    triggerSmartSearch(q);
  }
});

// ===== Config Detection & Prompt =====

function showConfigPrompt() {
  var prompt = document.getElementById('configPrompt');
  var input = document.getElementById('chatInput');
  var send = document.getElementById('sendBtn');
  if (prompt) prompt.style.display = '';
  if (input) input.disabled = true;
  if (send) send.disabled = true;
}

function hideConfigPrompt() {
  var prompt = document.getElementById('configPrompt');
  var input = document.getElementById('chatInput');
  var send = document.getElementById('sendBtn');
  if (prompt) prompt.style.display = 'none';
  if (input) input.disabled = false;
  if (send) send.disabled = false;
}

async function checkConfigOnInteract() {
  var config = await loadModelConfig();
  if (!config || !config.apiBaseUrl || !config.apiKey || !config.modelName) {
    showConfigPrompt();
    return false;
  }
  hideConfigPrompt();
  return true;
}

var configPromptBtn = document.getElementById('configPromptBtn');
if (configPromptBtn) {
  configPromptBtn.addEventListener('click', function () {
    hideConfigPrompt();
    switchTab('settings');
    switchSettingsSection('provider');
  });
}

document.addEventListener('click', function (e) {
  var prompt = document.getElementById('configPrompt');
  if (!prompt || prompt.style.display === 'none') return;
  if (!prompt.contains(e.target) && e.target !== document.getElementById('chatInput') && e.target !== document.getElementById('sendBtn')) {
    hideConfigPrompt();
  }
});

var _chatInputEl = document.getElementById('chatInput');
if (_chatInputEl) {
  _chatInputEl.addEventListener('focus', function () {
    checkConfigOnInteract();
  });
}

sendBtn.addEventListener('click', async function (e) {
  var ok = await checkConfigOnInteract();
  if (!ok) {
    e.stopImmediatePropagation();
  }
}, true);

var _chatInputKeyDownEl = document.getElementById('chatInput');
if (_chatInputKeyDownEl) {
  _chatInputKeyDownEl.addEventListener('keydown', async function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      var ok = await checkConfigOnInteract();
      if (!ok) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }, true);
}

function sendMessage(type, data) {
  chrome.runtime.sendMessage({ type, data }, (response) => {
    if (chrome.runtime.lastError) return;
    handleResponse(type, response);
  });
}

function handleResponse(sentType, response) {
  if (!response) return;

  switch (response.type) {
    case 'REQUESTS_DATA':
      if (!initialDataLoaded) {
        renderRequestList(response.data);
        initialDataLoaded = true;
      } else {
        mergeRequestList(response.data);
      }
      break;
    case 'TAB_URL':
      if (response.data) {
        currentUrlEl.textContent = response.data.url;
        window.__currentTabUrl = response.data.url;
        if (response.data.tabId != null) {
          currentMonitoringTabId = response.data.tabId;
        }
      }
      break;
    case 'COOKIES_DATA':
      updateCookieDisplay(response.data);
      break;
    case 'HEADERS_DATA':
      currentHeaders = response.data;
      updateHeaderDisplay();
      break;
  }
}

async function initTheme() {
  try {
    const result = await chrome.storage.local.get(THEME_KEY);
    const theme = result[THEME_KEY] || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggleEl) {
      themeToggleEl.checked = theme === 'dark';
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (themeToggleEl) {
      themeToggleEl.checked = true;
    }
  }
}

async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  if (themeToggleEl) {
    themeToggleEl.checked = next === 'dark';
  }
  try {
    await chrome.storage.local.set({ [THEME_KEY]: next });
  } catch {
    // 静默失败
  }
}

async function checkConnectivityForSkills() {
  var container = document.getElementById('smartSearchContainer');
  var loading = document.getElementById('smartSearchLoading');
  if (!container || !loading) return;

  container.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    var config = await loadModelConfig();
    if (!config || !config.apiBaseUrl || !config.apiKey || !config.modelName) {
      loading.classList.add('hidden');
      return;
    }
  } catch (e) {
    loading.classList.add('hidden');
    return;
  }

  var timeoutPromise = new Promise(function (resolve) {
    setTimeout(function () { resolve({ success: false, message: 'timeout' }); }, 5000);
  });
  var result = await Promise.race([testConnectivity(config), timeoutPromise]);
  loading.classList.add('hidden');

  if (result && result.success) {
    container.classList.remove('hidden');
    var input = document.getElementById('smartSearchInput');
    if (input) {
      input.placeholder = typeof t === 'function' ? t('smartSearch.placeholder') : '输入你需要解决的场景';
    }
    var btn = document.getElementById('smartSearchBtn');
    if (btn) {
      btn.textContent = typeof t === 'function' ? t('smartSearch.search') : 'AI搜索';
    }
  }
}

function triggerSmartSearch(query) {
  if (!query || !query.trim()) return;

  if (typeof _isSending !== 'undefined' && _isSending) {
    showToast('当前存在进行中的会话，请等待完成后再搜索');
    return;
  }

  if (window.currentSessionId) {
    window.currentSessionId = null;
    window.currentSessionMessages = [];
    window.chatMessages = [];
    if (typeof SessionManager !== 'undefined') {
      SessionManager.setActiveSessionId(null);
    }
  }

  switchTab('chat');

  if (typeof activateSkill === 'function') {
    activateSkill('recommend-skill');
  }

  var chatInput = document.getElementById('chatInput');
  if (chatInput && typeof sendChatMessage === 'function') {
    chatInput.value = query.trim();
    sendChatMessage();
  }
}

async function init() {
  await initLanguage();
  await initTheme();
  await skillRegistry.loadAllSkills();
  renderSkillsList();
  renderFavorites();
  const settings = await loadSettings();
  populateBasicConfigForm(settings);
  populateAdvancedConfigForm(settings);
  applyDebugMode(settings.debugMode);

  if (typeof window.ensureAgentsMdForLang === 'function') {
    var lang = window.resolveLanguage(window.__i18nMessages._storedLang || 'auto');
    window.ensureAgentsMdForLang(lang).catch(function () {});
  }

  sendMessage('QUERY_REQUESTS');
  sendMessage('QUERY_TAB_URL');
  sendMessage('QUERY_COOKIES');
  sendMessage('GET_HEADERS');
  setTimeout(() => sendMessage('QUERY_TAB_URL'), 200);

  await initChatView();
  initBatchDeleteDialog();
}

async function initChatView() {
  const collapsed = await SessionManager.getSidebarCollapsed();
  const sidebar = document.getElementById('chatSidebar');
  if (sidebar && collapsed) {
    sidebar.classList.add('chat-sidebar--collapsed');
  }
  const capsule = document.getElementById('sidebarCapsule');
  if (capsule && collapsed) {
    capsule.classList.add('sidebar-capsule--visible');
  }
  const toolbar = document.getElementById('chatMainToolbar');
  if (toolbar && collapsed) {
    toolbar.classList.add('chat-main__toolbar--with-capsule');
  }

  initChatEvents();
  updateSidebarModelInfo();
  await refreshChatView();
}

chrome.runtime.onMessage.addListener((message) => {
  handlePanelMessage(message);
});

function handlePanelMessage(message) {
  switch (message.type) {
    case 'REQUEST_COMPLETED':
      appendRequest(message.data);
      break;
    case 'REQUEST_CAPTURED':
      if (!message.data.status) {
        appendRequest(message.data);
      }
      break;
    case 'TAB_CHANGED':
      currentUrlEl.textContent = message.data.url || t('common.loading');
      window.__currentTabUrl = message.data.url || null;
      if (message.data.tabId != null) {
        currentMonitoringTabId = message.data.tabId;
      }
      filterRequestRowsByTab();
      sendMessage('QUERY_COOKIES');
      sendMessage('GET_HEADERS');
      break;
    case 'TAB_REQUESTS_SWITCH':
      if (message.data.tabId != null) {
        currentMonitoringTabId = message.data.tabId;
      }
      filterRequestRowsByTab();
      sendMessage('QUERY_REQUESTS');
      break;
    case 'URL_CHANGED':
      currentUrlEl.textContent = message.data.url;
      sendMessage('QUERY_COOKIES');
      break;
    case 'REQUEST_BODY_UPDATE': {
      var rid = message.data.requestId;
      if (rid && requestDataMap[rid]) {
        if (message.data.requestBody !== undefined) {
          requestDataMap[rid].requestBody = message.data.requestBody;
        }
        if (message.data.responseBody !== undefined) {
          requestDataMap[rid].responseBody = message.data.responseBody;
        }
        if (currentExpandedRid === rid) {
          deleteRequestDetailDOM(rid);
          var row = document.querySelector('[data-request-id="' + rid + '"]');
          if (row) {
            var detail = document.createElement('div');
            detail.className = 'request-detail open';
            detail.setAttribute('data-detail-id', rid);
            renderRequestDetail(detail, requestDataMap[rid]);
            row.after(detail);
          }
        }
      }
      break;
    }
    case 'HEADERS_UPDATED':
      sendMessage('GET_HEADERS');
      break;

  }
}

function renderRequestList(requests) {
  requestListEl.innerHTML = '';

  if (!requests || requests.length === 0) {
    requestListEl.innerHTML = '<div class="empty-hint">' + t('monitor.waitingRequests') + '</div>';
    return;
  }

  requests.forEach((req) => appendRequestRow(req));
  requestListEl.scrollTop = requestListEl.scrollHeight;
}

function mergeRequestList(requests) {
  var hint = requestListEl.querySelector('.empty-hint');
  if (hint) hint.remove();

  if (!requests || requests.length === 0) {
    filterRequestRowsByTab();
    return;
  }

  requests.forEach(function (req) {
    var rid = req.requestId;
    if (!rid) return;
    var existing = document.querySelector('[data-request-id="' + rid + '"]');
    if (existing) return;
    appendRequestRow(req);
  });

  filterRequestRowsByTab();
}

function appendRequest(req) {
  if (requestListEl.querySelector('.empty-hint')) {
    requestListEl.innerHTML = '';
  }

  const existingRow = document.querySelector(`[data-request-id="${req.requestId || ''}"]`);
  if (existingRow && req.status != null) {
    const statusEl = existingRow.querySelector('.request-status');
    if (statusEl) {
      statusEl.textContent = req.status;
      statusEl.className = `request-status status-${getStatusClass(req.status)}`;
    }
    if (req.requestId && requestDataMap[req.requestId]) {
      var d = requestDataMap[req.requestId];
      d.status = req.status;
      if (req.headers != null) d.headers = req.headers;
      if (req.requestBody !== undefined) d.requestBody = req.requestBody;
      if (req.responseBody !== undefined) d.responseBody = req.responseBody;
    }
    return;
  }

  if (!existingRow) {
    appendRequestRow(req);
    requestListEl.scrollTop = requestListEl.scrollHeight;
  }
}

function appendRequestRow(req) {
  var row = document.createElement('div');
  row.className = 'request-row';
  var rid = req.requestId || ('rid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
  row.setAttribute('data-request-id', rid);
  if (req.tabId != null) {
    row.setAttribute('data-tab-id', req.tabId);
  }
  if (req.requestId) {
    requestDataMap[rid] = {
      method: req.method,
      path: req.path,
      url: req.url || '',
      status: req.status,
      headers: req.headers || null,
      requestBody: req.requestBody || null,
      responseBody: req.responseBody || null,
      tabId: req.tabId,
    };
  }

  var method = req.method || 'GET';
  var methodEl = document.createElement('span');
  methodEl.className = 'request-method method-' + method.toUpperCase();
  methodEl.textContent = method.toUpperCase();

  var pathEl = document.createElement('span');
  pathEl.className = 'request-path';
  pathEl.textContent = req.path || '/';
  pathEl.title = req.path || '/';

  var statusEl = document.createElement('span');
  statusEl.className = req.status != null ? 'request-status status-' + getStatusClass(req.status) : 'request-status';
  statusEl.textContent = req.status != null ? req.status : '---';

  row.appendChild(methodEl);
  row.appendChild(pathEl);
  row.appendChild(statusEl);
  requestListEl.appendChild(row);

  if (currentMonitoringTabId != null && req.tabId != null && req.tabId !== currentMonitoringTabId) {
    row.style.display = 'none';
  }
}

function filterRequestRowsByTab() {
  var rows = requestListEl.querySelectorAll('.request-row');
  if (rows.length === 0) return;

  var hasVisible = false;
  rows.forEach(function (row) {
    var rowTabId = row.getAttribute('data-tab-id');
    if (currentMonitoringTabId == null || rowTabId == null || rowTabId === String(currentMonitoringTabId)) {
      row.style.display = '';
      hasVisible = true;
    } else {
      row.style.display = 'none';
    }
  });

  if (!hasVisible) {
    requestListEl.innerHTML = '<div class="empty-hint">' + t('monitor.waitingRequests') + '</div>';
    collapseRequestDetail();
  }
}

function getStatusClass(status) {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 300 && status < 400) return '3xx';
  if (status >= 400 && status < 500) return '4xx';
  if (status >= 500) return '5xx';
  return '';
}

requestListEl.addEventListener('click', function (e) {
  var row = e.target.closest('.request-row');
  if (!row) return;
  var rid = row.getAttribute('data-request-id');
  if (!rid) return;
  toggleRequestDetail(rid);
});

function toggleRequestDetail(rid) {
  if (currentExpandedRid === rid) {
    collapseRequestDetail();
    return;
  }
  collapseRequestDetail();

  var row = document.querySelector('[data-request-id="' + rid + '"]');
  if (!row) return;
  row.classList.add('expanded');

  var req = requestDataMap[rid];
  if (!req) return;
  currentExpandedRid = rid;

  var detail = document.createElement('div');
  detail.className = 'request-detail';
  detail.setAttribute('data-detail-id', rid);
  renderRequestDetail(detail, req);
  row.after(detail);

  requestAnimationFrame(function () {
    detail.classList.add('open');
  });
}

function collapseRequestDetail() {
  if (!currentExpandedRid) return;
  var row = document.querySelector('[data-request-id="' + currentExpandedRid + '"]');
  if (row) row.classList.remove('expanded');
  var detail = document.querySelector('[data-detail-id="' + currentExpandedRid + '"]');
  if (detail) {
    detail.classList.remove('open');
    setTimeout(function () {
      if (detail && detail.parentNode) detail.parentNode.removeChild(detail);
    }, 200);
  }
  currentExpandedRid = null;
}

function getRequestData(rid) {
  return requestDataMap[rid] || null;
}

function deleteRequestDetailDOM(rid) {
  var detail = document.querySelector('[data-detail-id="' + rid + '"]');
  if (detail && detail.parentNode) detail.parentNode.removeChild(detail);
}

function renderRequestDetail(detailEl, req) {
  var url = req.url || ('/' + (req.path || '').replace(/^\//, ''));
  var headers = req.headers || {};
  var requestBody = req.requestBody;
  var responseBody = req.responseBody;

  var headerKeys = Object.keys(headers);

  var hasHeaders = headerKeys.length > 0;
  var hasReqBody = requestBody != null && requestBody !== '';
  var hasRespBody = responseBody != null && responseBody !== '';

  // Tab bar
  var tabBar = document.createElement('div');
  tabBar.className = 'rd-tab-bar';

  function createTab(label, key, active) {
    var tab = document.createElement('span');
    tab.className = 'rd-tab' + (active ? ' active' : '');
    tab.setAttribute('data-rd-tab', key);
    tab.textContent = label;
    tab.addEventListener('click', function () {
      var tabs = detailEl.querySelectorAll('.rd-tab');
      var contents = detailEl.querySelectorAll('.rd-content');
      tabs.forEach(function (t) { t.classList.remove('active'); });
      contents.forEach(function (c) { c.classList.remove('active'); });
      tab.classList.add('active');
      var content = detailEl.querySelector('.rd-content[data-rd-tab="' + key + '"]');
      if (content) content.classList.add('active');
    });
    return tab;
  }

  tabBar.appendChild(createTab(t('requestDetail.headers'), 'headers', true));
  tabBar.appendChild(createTab(t('requestDetail.requestBody'), 'req-body', false));
  tabBar.appendChild(createTab(t('requestDetail.responseBody'), 'resp-body', false));
  detailEl.appendChild(tabBar);

  // URL display
  var urlBar = document.createElement('div');
  urlBar.className = 'rd-url-bar';
  urlBar.textContent = url;
  detailEl.appendChild(urlBar);

  // Content panels
  function createContent(key, active) {
    var div = document.createElement('div');
    div.className = 'rd-content' + (active ? ' active' : '');
    div.setAttribute('data-rd-tab', key);
    return div;
  }

  function formatBody(body) {
    if (!body) return null;
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch (e) {
      return body;
    }
  }

  // Headers content
  var headersContent = createContent('headers', true);
  if (hasHeaders) {
    var table = document.createElement('table');
    table.className = 'rd-kv-table';
    headerKeys.forEach(function (key) {
      var tr = document.createElement('tr');
      var tdKey = document.createElement('td');
      tdKey.className = 'rd-kv-key';
      tdKey.textContent = key;
      var tdVal = document.createElement('td');
      tdVal.className = 'rd-kv-val';
      tdVal.textContent = headers[key];
      tr.appendChild(tdKey);
      tr.appendChild(tdVal);
      table.appendChild(tr);
    });
    headersContent.appendChild(table);
  } else {
    var emptyH = document.createElement('div');
    emptyH.className = 'rd-empty';
    emptyH.textContent = t('requestDetail.noHeaders');
    headersContent.appendChild(emptyH);
  }
  detailEl.appendChild(headersContent);

  // Request body content
  var reqBodyContent = createContent('req-body', false);
  if (hasReqBody) {
    var reqPre = document.createElement('pre');
    reqPre.className = 'rd-code';
    reqPre.textContent = formatBody(requestBody);
    reqBodyContent.appendChild(reqPre);
  } else {
    var emptyReq = document.createElement('div');
    emptyReq.className = 'rd-empty';
    emptyReq.textContent = t('requestDetail.noRequestBody');
    reqBodyContent.appendChild(emptyReq);
  }
  detailEl.appendChild(reqBodyContent);

  // Response body content
  var respBodyContent = createContent('resp-body', false);
  if (hasRespBody) {
    var respPre = document.createElement('pre');
    respPre.className = 'rd-code';
    respPre.textContent = formatBody(responseBody);
    if (responseBody && responseBody.length >= 100 * 1024) {
      var truncNote = document.createElement('div');
      truncNote.className = 'rd-truncated';
      truncNote.textContent = t('requestDetail.truncated');
      respBodyContent.appendChild(respPre);
      respBodyContent.appendChild(truncNote);
    } else {
      respBodyContent.appendChild(respPre);
    }
  } else {
    var emptyResp = document.createElement('div');
    emptyResp.className = 'rd-empty';
    emptyResp.textContent = t('requestDetail.noResponseBody');
    respBodyContent.appendChild(emptyResp);
  }
  detailEl.appendChild(respBodyContent);

  // Replay button
  var replaySection = document.createElement('div');
  replaySection.className = 'rd-replay-section';

  var replayBtn = document.createElement('button');
  replayBtn.className = 'rd-replay-btn';
  replayBtn.textContent = t('requestDetail.replay');
  replayBtn.addEventListener('click', function () {
    if (replayBtn.disabled) return;
    replayBtn.disabled = true;
    replayBtn.textContent = t('requestDetail.sending');
    replayBtn.classList.add('sending');

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || tabs.length === 0) {
        replayBtn.disabled = false;
        replayBtn.textContent = t('requestDetail.replay');
        replayBtn.classList.remove('sending');
        return;
      }

      var replayData = {
        url: url,
        method: req.method || 'GET',
        headers: headers,
        body: req.requestBody || null,
      };

      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'REPLAY_REQUEST',
        data: replayData,
      }, function () {
        setTimeout(function () {
          replayBtn.disabled = false;
          replayBtn.textContent = t('requestDetail.replay');
          replayBtn.classList.remove('sending');
        }, 800);
      });
    });
  });

  replaySection.appendChild(replayBtn);
  detailEl.appendChild(replaySection);
}

function updateCookieDisplay(data) {
  if (!data || data.total === 0) {
    cookieInfoEl.textContent = t('monitor.noCookie');
  } else {
    cookieInfoEl.textContent = t('monitor.cookieCount', { total: data.total, session: data.session || 0, persistent: data.persistent || 0 });
  }
}

function updateHeaderDisplay() {
  if (!currentHeaders || currentHeaders.length === 0) {
    headerStatusEl.textContent = t('monitor.headerStatusNone');
  } else {
    const names = currentHeaders.map((h) => h.name).join(', ');
    headerStatusEl.textContent = t('monitor.headerStatus', { names: names });
  }
  renderHeaderList();
}

function renderHeaderList() {
  headerListEl.innerHTML = '';
  currentHeaders.forEach((h) => {
    const item = document.createElement('div');
    item.className = 'header-item';

    const nameEl = document.createElement('span');
    nameEl.className = 'header-item-name';
    nameEl.textContent = h.name;

    const valueEl = document.createElement('span');
    valueEl.className = 'header-item-value';
    valueEl.textContent = h.value;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'header-item-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = t('common.delete');
    deleteBtn.addEventListener('click', () => {
      sendMessage('REMOVE_HEADER', { name: h.name });
    });

    item.appendChild(nameEl);
    item.appendChild(valueEl);
    item.appendChild(deleteBtn);
    headerListEl.appendChild(item);
  });
}

addHeaderBtn.addEventListener('click', () => {
  const name = headerNameEl.value.trim();
  const value = headerValueEl.value.trim();
  if (!name || !value) return;

  sendMessage('ADD_HEADER', { name, value });
  headerNameEl.value = '';
  headerValueEl.value = '';
});

closeBtn.addEventListener('click', () => {
  window.close();
});

async function updateSidebarModelInfo() {
  const el = document.getElementById('sidebarModelInfo');
  if (!el) return;
  try {
    const config = await loadModelConfig();
    if (config && config.modelName) {
      el.textContent = config.modelName;
    } else {
      el.textContent = t('session.noModel');
    }
  } catch {
    el.textContent = '';
  }
}

// ===== Session List Rendering =====

function renderSessionList(filter) {
  SessionManager.loadSessions().then(function (sessions) {
    var listEl = document.getElementById('sessionList');
    if (!listEl) return;

    var activeId = window.currentSessionId;
    var searchTerm = filter || (document.getElementById('sessionSearchInput') ? document.getElementById('sessionSearchInput').value : '');

    var filtered = sessions;
    if (searchTerm && searchTerm.trim()) {
      var lower = searchTerm.trim().toLowerCase();
      filtered = sessions.filter(function (s) {
        return (s.title || t('session.untitled')).toLowerCase().indexOf(lower) !== -1;
      });
      renderFlatSessionList(listEl, filtered, activeId, searchTerm.trim());
    } else {
      renderGroupedSessionList(listEl, sessions);
    }

    // 添加垃圾桶按钮（会话非空时显示）
    if (sessions.length > 0) {
      listEl.insertAdjacentHTML('beforeend', '<button class="batch-delete-btn" id="batchDeleteBtn" title="批量删除会话">'
        + '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '</button>');
      var btn = document.getElementById('batchDeleteBtn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openBatchDeleteDialog();
        });
      }
    }
  });
}

function renderGroupedSessionList(listEl, sessions) {
  var groups = renderTimeGroups(sessions);
  var html = '';

  var groupLabels = {
    today: t('session.timeGroupToday'),
    yesterday: t('session.timeGroupYesterday'),
    thisWeek: t('session.timeGroupThisWeek'),
    earlier: t('session.timeGroupEarlier')
  };

  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var yesterdayStart = todayStart - 86400000;
  var weekStart = todayStart - 6 * 86400000;

  for (var gi = 0; gi < groups.length; gi++) {
    var group = groups[gi];
    if (group.sessions.length === 0) continue;
    html += '<div class="session-group-header">' + groupLabels[group.key] + '</div>';
    for (var si = 0; si < group.sessions.length; si++) {
      html += buildSessionCardHTML(group.sessions[si]);
    }
  }

  if (!html) {
    html = '<div class="empty-hint" style="padding:16px;text-align:center;">' + t('session.noSessions') + '</div>';
  }

  listEl.innerHTML = html;
  bindSessionCardEvents(listEl);
}

function renderFlatSessionList(listEl, sessions, activeId, searchTerm) {
  var html = '';
  for (var i = 0; i < sessions.length; i++) {
    html += buildSessionCardHTML(sessions[i], true);
  }
  if (!html) {
    html = '<div class="empty-hint" style="padding:16px;text-align:center;">' + t('session.noMatch') + '</div>';
  }
  listEl.innerHTML = html;

  if (searchTerm) {
    var cards = listEl.querySelectorAll('.session-card__title');
    cards.forEach(function (el) {
      var text = el.textContent;
      var idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (idx !== -1) {
        el.innerHTML = text.substring(0, idx) + '<mark>' + text.substring(idx, idx + searchTerm.length) + '</mark>' + text.substring(idx + searchTerm.length);
      }
    });
  }

  bindSessionCardEvents(listEl);
}

function buildSessionCardHTML(session) {
  var activeId = currentSessionId;
  var activeClass = (session.id === activeId) ? ' session-card--active' : '';
  var title = session.title;
  var timeStr = formatRelativeTime(session.updatedAt || session.createdAt);
  return '<div class="session-card' + activeClass + '" data-session-id="' + session.id + '">'
    + '<div class="session-card__title">' + htmlEscapeStr(title) + '</div>'
    + '<div class="session-card__time">' + timeStr + '</div>'
    + '<button class="session-card__more" data-session-id="' + session.id + '">'
    + '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.55146 8.00001C4.55146 8.63513 4.03659 9.15001 3.40146 9.15001C2.76634 9.15001 2.25146 8.63513 2.25146 8.00001C2.25146 7.36488 2.76634 6.85001 3.40146 6.85001C4.03659 6.85001 4.55146 7.36488 4.55146 8.00001Z" fill="currentColor"/><path d="M9.1476 8.00001C9.1476 8.63513 8.63273 9.15001 7.9976 9.15001C7.36248 9.15001 6.8476 8.63513 6.8476 8.00001C6.8476 7.36488 7.36248 6.85001 7.9976 6.85001C8.63273 6.85001 9.1476 7.36488 9.1476 8.00001Z" fill="currentColor"/><path d="M13.7486 8.00001C13.7486 8.63513 13.2338 9.15001 12.5986 9.15001C11.9635 9.15001 11.4486 8.63513 11.4486 8.00001C11.4486 7.36488 11.9635 6.85001 12.5986 6.85001C13.2338 6.85001 13.7486 7.36488 13.7486 8.00001Z" fill="currentColor"/></svg>'
    + '</button>'
    + '</div>';
}

function bindSessionCardEvents(listEl) {
  var cards = listEl.querySelectorAll('.session-card');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      var sid = card.getAttribute('data-session-id');
      if (sid) switchToSession(sid);
    });
    card.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showSessionContextMenu(e, card.getAttribute('data-session-id'));
    });
  });

  var moreBtns = listEl.querySelectorAll('.session-card__more');
  moreBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      showSessionContextMenu(e, btn.getAttribute('data-session-id'));
    });
  });
}

// ===== Session Switching =====

async function switchToSession(sessionId) {
  if (sessionId === currentSessionId) return;
  if (typeof _isSending !== 'undefined' && _isSending) {
    showToast(t('session.sendingInProgress'));
    return;
  }
  var session = await SessionManager.getSession(sessionId);
  if (!session) return;

  currentSessionId = session.id;
  currentSessionMessages = session.messages;
  window.currentSessionId = currentSessionId;
  window.currentSessionMessages = currentSessionMessages;
  window.chatMessages = currentSessionMessages;
  await SessionManager.setActiveSessionId(session.id);

  hideWelcomePage();
  var chatMessagesEl = document.getElementById('chatMessages');
  if (chatMessagesEl) chatMessagesEl.style.display = '';
  if (typeof renderChatMessages === 'function') {
    renderChatMessages(currentSessionMessages);
  }
  updateSessionTitleDisplay(session.title);
  renderSessionList();

  if (document.getElementById('chatInput')) {
    document.getElementById('chatInput').focus();
  }
}

function updateSessionTitleDisplay(title) {
  var el = document.getElementById('sessionTitleDisplay');
  if (el) {
    el.textContent = title || '';
  }
}

// ===== Time Groups =====

function renderTimeGroups(sessions) {
  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var yesterdayStart = todayStart - 86400000;
  var weekStart = todayStart - 6 * 86400000;

  var groups = { today: [], yesterday: [], thisWeek: [], earlier: [] };

  var sorted = sessions.slice().sort(function (a, b) { return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt); });

  sorted.forEach(function (s) {
    var time = s.updatedAt || s.createdAt;
    if (time >= todayStart) {
      groups.today.push(s);
    } else if (time >= yesterdayStart) {
      groups.yesterday.push(s);
    } else if (time >= weekStart) {
      groups.thisWeek.push(s);
    } else {
      groups.earlier.push(s);
    }
  });

  return [
    { key: 'today', sessions: groups.today },
    { key: 'yesterday', sessions: groups.yesterday },
    { key: 'thisWeek', sessions: groups.thisWeek },
    { key: 'earlier', sessions: groups.earlier }
  ];
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  var now = Date.now();
  var diff = now - timestamp;

  if (diff < 60000) return t('common.justNow');
  if (diff < 3600000) return Math.floor(diff / 60000) + t('common.minutesAgo');
  if (diff < 86400000) return Math.floor(diff / 3600000) + t('common.hoursAgo');

  var d = new Date(timestamp);
  var month = d.getMonth() + 1;
  var day = d.getDate();
  return month + '/' + day;
}

// ===== Context Menu =====

function showSessionContextMenu(e, sessionId) {
  var menu = document.getElementById('sessionContextMenu');
  if (!menu) return;
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.setAttribute('data-session-id', sessionId);

  function hideMenu() {
    menu.style.display = 'none';
    document.removeEventListener('click', hideMenu);
    document.removeEventListener('contextmenu', hideMenu);
  }

  setTimeout(function () {
    document.addEventListener('click', hideMenu);
    document.addEventListener('contextmenu', hideMenu);
  }, 0);
}

document.addEventListener('click', function (e) {
  var item = e.target.closest('.context-menu__item');
  if (!item) return;
  var menu = item.closest('.context-menu');
  if (!menu) return;
  var sessionId = menu.getAttribute('data-session-id');
  var action = item.getAttribute('data-action');
  if (!sessionId || !action) return;
  menu.style.display = 'none';
  handleContextMenuAction(action, sessionId);
});

async function handleContextMenuAction(action, sessionId) {
  switch (action) {
    case 'rename':
      startInlineRename(sessionId);
      break;
    case 'export':
      await SessionManager.exportSessionLog(sessionId);
      break;
    case 'delete':
      handleDeleteSession(sessionId);
      break;
  }
}

async function handleDeleteSession(sessionId) {
  var session = await SessionManager.getSession(sessionId);
  if (!session) return;
  var title = session.title || t('session.untitled');
  if (!confirm(t('session.confirmDelete', { title: title }))) return;

  await SessionManager.deleteSession(sessionId);

  if (sessionId === currentSessionId) {
    var sessions = await SessionManager.loadSessions();
    if (sessions.length > 0) {
      await switchToSession(sessions[0].id);
    } else {
      currentSessionId = null;
      currentSessionMessages = [];
      window.currentSessionId = null;
      window.currentSessionMessages = [];
      window.chatMessages = [];
      showWelcomePage();
      updateSessionTitleDisplay('');
    }
  }

  renderSessionList();
  refreshWelcomeRecentIfVisible();
}

function refreshWelcomeRecentIfVisible() {
  var welcome = document.getElementById('chatWelcome');
  if (welcome && welcome.style.display !== 'none') {
    renderRecentSessions();
  }
}

function showToast(message) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('toast--out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  }, 4000);
}

function startInlineRename(sessionId) {
  var card = document.querySelector('.session-card[data-session-id="' + sessionId + '"]');
  if (!card) return;
  var titleEl = card.querySelector('.session-card__title');
  if (!titleEl) return;

  var input = document.createElement('input');
  input.className = 'session-card__edit-input';
  input.value = titleEl.textContent;
  input.setAttribute('data-session-id', sessionId);

  titleEl.replaceWith(input);
  input.focus();
  input.select();

  function finishRename() {
    var newTitle = input.value.trim();
    var restoreEl = document.createElement('div');
    restoreEl.className = 'session-card__title';
    if (newTitle) {
      SessionManager._clearTitleTimer(sessionId);
      SessionManager.renameSession(sessionId, newTitle).then(function () {
        restoreEl.textContent = newTitle;
        if (sessionId === currentSessionId) {
          updateSessionTitleDisplay(newTitle);
        }
        input.replaceWith(restoreEl);
      });
    } else {
      restoreEl.textContent = titleEl.textContent;
      input.replaceWith(restoreEl);
    }
  }

  input.addEventListener('blur', finishRename);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      var restoreEl = document.createElement('div');
      restoreEl.className = 'session-card__title';
      restoreEl.textContent = titleEl.textContent;
      input.replaceWith(restoreEl);
    }
  });
}

// ===== Sidebar Toggle =====

function toggleSidebar() {
  var sidebar = document.getElementById('chatSidebar');
  if (!sidebar) return;
  var collapsed = sidebar.classList.toggle('chat-sidebar--collapsed');
  var capsule = document.getElementById('sidebarCapsule');
  if (capsule) {
    if (collapsed) {
      capsule.classList.add('sidebar-capsule--visible');
    } else {
      capsule.classList.remove('sidebar-capsule--visible');
    }
  }
  var toolbar = document.getElementById('chatMainToolbar');
  if (toolbar) {
    if (collapsed) {
      toolbar.classList.add('chat-main__toolbar--with-capsule');
    } else {
      toolbar.classList.remove('chat-main__toolbar--with-capsule');
    }
  }
  SessionManager.setSidebarCollapsed(collapsed);
}

// ===== Search Flash =====

function flashSearchInput() {
  var sidebar = document.getElementById('chatSidebar');
  var input = document.getElementById('sessionSearchInput');

  if (sidebar && sidebar.classList.contains('chat-sidebar--collapsed')) {
    toggleSidebar();
  }

  if (input) {
    input.focus();
  }

  setTimeout(function () {
    showSearchGuide();
  }, 350);
}

function showSearchGuide() {
  var input = document.getElementById('sessionSearchInput');
  if (!input) return;
  var rect = input.getBoundingClientRect();
  showGuideHand({
    emoji: '👈',
    left: rect.right + 8,
    top: rect.top + rect.height / 2 - 28,
    cssClass: 'guide-hand--bounce-x'
  });
}

// ===== Session Search =====

function initSessionSearch() {
  var input = document.getElementById('sessionSearchInput');
  if (!input) return;
  input.addEventListener('input', function () {
    renderSessionList();
  });
}

// ===== New Session Button =====

function createNewSessionAndShow() {
  currentSessionId = null;
  currentSessionMessages = [];
  window.currentSessionId = null;
  window.currentSessionMessages = [];
  window.chatMessages = [];
  if (typeof SessionManager !== 'undefined') {
    SessionManager.setActiveSessionId(null);
  }
  updateSessionTitleDisplay('');
  var msgEl = document.getElementById('chatMessages');
  if (msgEl && typeof renderChatMessages === 'function') renderChatMessages([]);
  showWelcomePage();
  renderSessionList();
}

// ===== Welcome Page =====

function showWelcomePage() {
  console.log('[showWelcomePage] called');
  var welcome = document.getElementById('chatWelcome');
  var messages = document.getElementById('chatMessages');
  console.log('[showWelcomePage] welcome:', !!welcome, 'messages:', !!messages);
  if (welcome) welcome.style.display = '';
  if (messages) {
    messages.style.display = 'none';
    messages.innerHTML = '';
  }
  renderRecentSessions();
}

function hideWelcomePage() {
  console.log('[hideWelcomePage] called');
  var welcome = document.getElementById('chatWelcome');
  var messages = document.getElementById('chatMessages');
  console.log('[hideWelcomePage] welcome:', !!welcome, 'messages:', !!messages);
  if (welcome) welcome.style.display = 'none';
  if (messages) messages.style.display = '';
}

async function renderRecentSessions() {
  var listEl = document.getElementById('welcomeRecentList');
  var container = document.getElementById('welcomeRecentSessions');
  var titleEl = document.querySelector('.chat-welcome__recent-title');
  if (!listEl || !container) return;

  var sessions = await SessionManager.loadSessions();
  var withMessages = sessions.filter(function (s) { return s.messages && s.messages.length > 0; });
  withMessages.sort(function (a, b) { return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt); });
  var recent = withMessages.slice(0, 3);

  if (recent.length === 0) {
    container.style.display = '';
    if (titleEl) titleEl.textContent = t('welcome.quickStart');
    var prompts = t('welcome.recommendPrompts');
    var html = '';
    for (var i = 0; i < prompts.length; i++) {
      html += '<div class="recent-session-card recent-session-card--recommend" data-prompt="' + htmlEscapeStr(prompts[i]) + '">'
        + '<div class="recent-session-card__title">' + htmlEscapeStr(prompts[i]) + '</div>'
        + '</div>';
    }
    listEl.innerHTML = html;

    listEl.querySelectorAll('.recent-session-card--recommend').forEach(function (card) {
      card.addEventListener('click', function () {
        var text = card.getAttribute('data-prompt');
        if (text) handleRecommendClick(text);
      });
    });
    return;
  }

  container.style.display = '';
  if (titleEl) titleEl.textContent = t('welcome.recentSessions');
  var html = '';
  for (var j = 0; j < recent.length; j++) {
    var s = recent[j];
    html += '<div class="recent-session-card" data-session-id="' + s.id + '">'
      + '<div class="recent-session-card__title">' + htmlEscapeStr(s.title || t('session.untitled')) + '</div>'
      + '<div class="recent-session-card__time">' + formatRelativeTime(s.updatedAt || s.createdAt) + '</div>'
      + '</div>';
  }
  listEl.innerHTML = html;

  listEl.querySelectorAll('.recent-session-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var sid = card.getAttribute('data-session-id');
      if (sid) switchToSession(sid);
    });
  });
}

function handleRecommendClick(text) {
  createNewSessionAndShow();
  var inputEl = document.getElementById('chatInput');
  if (inputEl) {
    inputEl.value = text;
    inputEl.focus();
    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
  }
  showSendGuide();
}

function showSendGuide() {
  var sendBtn = document.getElementById('sendBtn');
  if (!sendBtn) return;
  var rect = sendBtn.getBoundingClientRect();
  showGuideHand({
    emoji: '👇',
    left: rect.left + rect.width / 2 - 28,
    top: rect.top - 40,
    cssClass: 'guide-hand--bounce-y'
  });
}

function showGuideHand(opts) {
  var hand = document.createElement('span');
  hand.className = 'guide-hand ' + (opts.cssClass || '');
  hand.textContent = opts.emoji || '';
  hand.style.left = opts.left + 'px';
  hand.style.top = opts.top + 'px';
  document.body.appendChild(hand);
  setTimeout(function () {
    if (hand.parentNode) hand.parentNode.removeChild(hand);
  }, 3500);
}

function htmlEscapeStr(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== Init Events =====

function initChatEvents() {
  var newBtn = document.getElementById('newSessionBtn');
  if (newBtn) {
    newBtn.addEventListener('click', createNewSessionAndShow);
  }

  var collapseBtn = document.getElementById('sidebarCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebar);
  }

  var capsule = document.getElementById('sidebarCapsule');
  if (capsule) {
    capsule.addEventListener('click', function (e) {
      var btn = e.target.closest('.capsule-btn');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      if (action === 'expand') {
        toggleSidebar();
      } else if (action === 'search') {
        flashSearchInput();
      } else if (action === 'new-session') {
        var sidebar = document.getElementById('chatSidebar');
        if (sidebar && sidebar.classList.contains('chat-sidebar--collapsed')) {
          toggleSidebar();
        }
        createNewSessionAndShow();
      }
    });
  }

  initSessionSearch();
}

const CATEGORY_ORDER = ['Business', 'Product', 'Development', 'Testing'];
let currentDebugMode = false;

function renderSkillsList() {
  var categoriesEl = document.getElementById('skillsCategories');
  if (!categoriesEl) return;

  var registry = window.__getSkillRegistry();
  var skills = registry.getAll();

  if (skills.length === 0) {
    categoriesEl.innerHTML = '<div class="empty-hint">' + t('skills.emptyHint') + '</div>';
    return;
  }

  var categorized = {};
  skills.forEach(function (s) {
    var cat = s.category || 'Other';
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(s);
  });

  var html = '';
  for (var ci = 0; ci < CATEGORY_ORDER.length; ci++) {
    var cat = CATEGORY_ORDER[ci];
    var catSkills = categorized[cat];
    if (!catSkills || catSkills.length === 0) continue;
    delete categorized[cat];

    html += '<div class="skill-category">';
    html += '<div class="skill-category-title">' + t('skills.categories.' + cat) + '</div>';
    html += '<div class="skill-category-pills">';
    for (var si = 0; si < catSkills.length; si++) {
      var s = catSkills[si];
      html += '<div class="skill-row" data-skill-id="' + s.id + '">';
      html += '<div class="skill-row-name">' + s.name + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  // 处理未在 CATEGORY_ORDER 中的分类（如"其他"/Other）
  var remaining = Object.keys(categorized);
  for (var ri = 0; ri < remaining.length; ri++) {
    var rCat = remaining[ri];
    var rSkills = categorized[rCat];
    if (!rSkills || rSkills.length === 0) continue;

    html += '<div class="skill-category">';
    html += '<div class="skill-category-title">' + t('skills.categories.' + rCat) + '</div>';
    html += '<div class="skill-category-pills">';
    for (var rsi = 0; rsi < rSkills.length; rsi++) {
      var rs = rSkills[rsi];
      html += '<div class="skill-row" data-skill-id="' + rs.id + '">';
      html += '<div class="skill-row-name">' + rs.name + '</div>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';
  }

  categoriesEl.innerHTML = html;

  // 绑定技能行点击事件
  categoriesEl.querySelectorAll('.skill-row').forEach(function (row) {
    row.addEventListener('click', function () {
      var skillId = row.getAttribute('data-skill-id');
      var registry2 = window.__getSkillRegistry();
      var skill = registry2.getAll().find(function (s) { return s.id === skillId; });
      if (skill) showSkillDetail(skill);
    });
    row.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var skillId = row.getAttribute('data-skill-id');
      showSkillContextMenu(e, skillId);
    });
  });
}

function showSkillDetail(skill) {
  exitSkillEditMode();

  var overlay = document.getElementById('skillDetailOverlay');
  var titleEl = document.getElementById('skillDetailTitle');
  var bodyEl = document.getElementById('skillDetailBody');
  var useBtn = document.getElementById('skillDetailUseBtn');
  var resetBtn = document.getElementById('skillDetailResetBtn');

  if (!overlay || !titleEl || !bodyEl || !useBtn) return;

  titleEl.textContent = skill.name;

  var currentLang = getCurrentLangSuffix();
  if (skill._edits && skill._edits[currentLang]) {
    if (resetBtn) resetBtn.classList.remove('hidden');
  } else {
    if (resetBtn) resetBtn.classList.add('hidden');
  }

  var promptContent = skill.getPrompt();
  var contentHtml = '';
  if (promptContent && promptContent.trim()) {
    contentHtml = typeof renderMarkdown === 'function' ? renderMarkdown(promptContent) : promptContent;
  } else {
    contentHtml = '<div class="empty-hint">该技能暂无详细说明</div>';
  }

  bodyEl.innerHTML = contentHtml;

  useBtn.setAttribute('data-skill-id', skill.id);

  overlay.classList.remove('hidden');
}

function hideSkillDetail() {
  exitSkillEditMode();
  var overlay = document.getElementById('skillDetailOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function getCurrentLangSuffix() {
  var lang = (window.__i18nMessages && window.__i18nMessages._lang) || 'zh-CN';
  return (lang === 'zh-CN') ? 'cn' : 'en';
}

var _currentEditingSkillId = null;

function enterSkillEditMode(skill) {
  var bodyEl = document.getElementById('skillDetailBody');
  var formEl = document.getElementById('skillDetailEditForm');
  var useBtn = document.getElementById('skillDetailUseBtn');
  var editBtn = document.getElementById('skillDetailEditBtn');
  var resetBtn = document.getElementById('skillDetailResetBtn');

  if (!formEl) return;

  document.getElementById('skillEditName').value = skill.name || '';
  document.getElementById('skillEditDesc').value = skill.description || '';
  document.getElementById('skillEditPrompt').value = skill.getPrompt ? skill.getPrompt() : '';

  _currentEditingSkillId = skill.id;

  if (bodyEl) bodyEl.style.display = 'none';
  formEl.classList.remove('hidden');
  if (useBtn) useBtn.style.display = 'none';
  if (editBtn) editBtn.style.display = 'none';
  if (resetBtn) resetBtn.style.display = 'none';
}

function exitSkillEditMode() {
  var bodyEl = document.getElementById('skillDetailBody');
  var formEl = document.getElementById('skillDetailEditForm');
  var useBtn = document.getElementById('skillDetailUseBtn');
  var editBtn = document.getElementById('skillDetailEditBtn');
  var resetBtn = document.getElementById('skillDetailResetBtn');

  _currentEditingSkillId = null;

  if (formEl) formEl.classList.add('hidden');
  if (bodyEl) bodyEl.style.display = '';
  if (useBtn) useBtn.style.display = '';
  if (editBtn) editBtn.style.display = '';
  if (resetBtn) {
    var skillId = _currentEditingSkillId || useBtn.getAttribute('data-skill-id');
    if (skillId) {
      var registry = window.__getSkillRegistry();
      var skill = registry.getAll().find(function (s) { return s.id === skillId; });
      if (skill && skill._edits && skill._edits[getCurrentLangSuffix()]) {
        resetBtn.style.display = '';
      } else {
        resetBtn.style.display = 'none';
      }
    }
  }
}

function saveSkillEdit() {
  var skillId = _currentEditingSkillId;
  if (!skillId) return;

  var name = document.getElementById('skillEditName').value.trim();
  var description = document.getElementById('skillEditDesc').value.trim();
  var prompt = document.getElementById('skillEditPrompt').value;

  var registry = window.__getSkillRegistry();
  registry.update(skillId, {
    name: name,
    description: description,
    _prompt: prompt
  }, getCurrentLangSuffix());

  var skill = registry.getAll().find(function (s) { return s.id === skillId; });
  if (skill) {
    showSkillDetail(skill);
  }
  renderSkillsList();
  renderFavorites();
  showToast(t('skills.saved') || '保存成功');
}

async function resetSkillEdit(skillId) {
  var registry = window.__getSkillRegistry();
  await registry.resetSkill(skillId, getCurrentLangSuffix());

  var skill = registry.getAll().find(function (s) { return s.id === skillId; });
  if (skill) {
    showSkillDetail(skill);
  }
  renderSkillsList();
  renderFavorites();
  showToast(t('skills.reset') || '已重置为默认值');
}

// ═══════════════════════════════════════════════
//  技能收藏 — 右键菜单与悬浮框
// ═══════════════════════════════════════════════

var pendingFavoriteSkillId = null;
var _activeContextMenuCleanup = null;

function _setupContextMenuCleanup(cleanup) {
  if (_activeContextMenuCleanup) {
    _activeContextMenuCleanup();
   }
  _activeContextMenuCleanup = cleanup;
}

function _clearContextMenuCleanup() {
  if (_activeContextMenuCleanup) {
    _activeContextMenuCleanup();
    _activeContextMenuCleanup = null;
  }
}

// 全局监听：点击任意位置关闭当前打开的菜单
(function () {
  document.addEventListener('click', function () {
    _clearContextMenuCleanup();
  });
})();

function showSkillContextMenu(e, skillId) {
  _clearContextMenuCleanup();
  var menu = document.getElementById('skillContextMenu');
  if (!menu) return;
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.setAttribute('data-skill-id', skillId);
  positionMenuInViewport(menu);
  pendingFavoriteSkillId = skillId;

  _setupContextMenuCleanup(function () {
    menu.style.display = 'none';
  });
}

function showFavoriteCardContextMenu(e, collectionId) {
  _clearContextMenuCleanup();
  var menu = document.getElementById('favoriteCardContextMenu');
  if (!menu) return;
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.setAttribute('data-collection-id', collectionId);
  menu.removeAttribute('data-skill-id');
  positionMenuInViewport(menu);

  var unfavoriteItem = menu.querySelector('[data-action="unfavorite"]');
  var deleteItem = menu.querySelector('[data-action="deleteCollection"]');
  var divider = menu.querySelector('.context-menu__divider');
  if (unfavoriteItem) unfavoriteItem.style.display = 'none';
  if (deleteItem) deleteItem.style.display = '';
  if (divider) divider.style.display = 'none';

  _setupContextMenuCleanup(function () {
    menu.style.display = 'none';
    if (unfavoriteItem) unfavoriteItem.style.display = '';
    if (deleteItem) deleteItem.style.display = '';
    if (divider) divider.style.display = '';
  });
}

function showFavoriteCardSkillContextMenu(e, collectionId, skillId) {
  e.preventDefault();
  e.stopPropagation();
  _clearContextMenuCleanup();
  var menu = document.getElementById('favoriteCardContextMenu');
  if (!menu) return;
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  menu.setAttribute('data-collection-id', collectionId);
  menu.setAttribute('data-skill-id', skillId);
  positionMenuInViewport(menu);

  var unfavoriteItem = menu.querySelector('[data-action="unfavorite"]');
  var deleteItem = menu.querySelector('[data-action="deleteCollection"]');
  var divider = menu.querySelector('.context-menu__divider');
  if (unfavoriteItem) unfavoriteItem.style.display = '';
  if (deleteItem) deleteItem.style.display = 'none';
  if (divider) divider.style.display = 'none';

  _setupContextMenuCleanup(function () {
    menu.style.display = 'none';
    if (unfavoriteItem) unfavoriteItem.style.display = '';
    if (deleteItem) deleteItem.style.display = '';
    if (divider) divider.style.display = '';
  });
}

function positionMenuInViewport(menu) {
  var rect = menu.getBoundingClientRect();
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var left = parseInt(menu.style.left, 10);
  var top = parseInt(menu.style.top, 10);

  if (left + rect.width > vw) {
    left = vw - rect.width - 8;
    menu.style.left = left + 'px';
  }
  if (top + rect.height > vh) {
    top = vh - rect.height - 8;
    menu.style.top = top + 'px';
  }
  if (left < 0) {
    menu.style.left = '8px';
  }
  if (top < 0) {
    menu.style.top = '8px';
  }
}

async function handleAddToFavorite(skillId) {
  var favorites = await FavoritesManager.loadFavorites();

  if (favorites.length === 0) {
    await FavoritesManager.createCollection(t('favorites.defaultName'), '', [skillId]);
    renderFavorites();
    return;
  }

  pendingFavoriteSkillId = skillId;
  showFavoriteCollectionPopup();
}

function handleDeleteSkill(skillId) {
  var registry = window.__getSkillRegistry();
  registry.unregister(skillId);
  renderSkillsList();
  renderFavorites();
  showToast(t('skills.deleted') || '已删除');
}

function showFavoriteCollectionPopup() {
  var overlay = document.getElementById('favoriteCollectionPopup');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  renderFavoriteCollectionList();
}

function hideFavoriteCollectionPopup() {
  var overlay = document.getElementById('favoriteCollectionPopup');
  if (!overlay) return;
  overlay.classList.add('hidden');
  pendingFavoriteSkillId = null;
}

async function renderFavoriteCollectionList() {
  var listEl = document.getElementById('favoriteCollectionList');
  if (!listEl) return;

  var favorites = await FavoritesManager.loadFavorites();
  var html = '';
  for (var i = 0; i < favorites.length; i++) {
    var col = favorites[i];
    html += '<div class="favorite-collection-item" data-collection-id="' + col.id + '">';
    html += '<div class="favorite-collection-item-left">';
    html += '<span class="favorite-collection-item-name">' + escapeHtml(col.name) + '</span>';
    html += '<span class="favorite-collection-item-count">' + t('favorites.skillCount', { count: col.skillIds.length }) + '</span>';
    html += '</div>';
    html += '<div class="favorite-collection-item-actions">';
    html += '<button class="favorite-collection-rename-btn" data-collection-id="' + col.id + '" title="' + t('favorites.rename') + '">✎</button>';
    html += '</div>';
    html += '</div>';
  }
  listEl.innerHTML = html;

  listEl.querySelectorAll('.favorite-collection-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      var renameBtn = e.target.closest('.favorite-collection-rename-btn');
      if (renameBtn) return;
      var collectionId = item.getAttribute('data-collection-id');
      selectFavoriteCollection(collectionId);
    });
  });

  listEl.querySelectorAll('.favorite-collection-rename-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var collectionId = btn.getAttribute('data-collection-id');
      startFavoriteRename(collectionId);
    });
  });
}

async function selectFavoriteCollection(collectionId) {
  if (!pendingFavoriteSkillId) return;
  await FavoritesManager.addSkills(collectionId, [pendingFavoriteSkillId]);
  hideFavoriteCollectionPopup();
  renderFavorites();
}

async function handleNewFavoriteCollection() {
  var skillId = pendingFavoriteSkillId;
  await FavoritesManager.createCollection(t('favorites.defaultName'), '', skillId ? [skillId] : []);
  hideFavoriteCollectionPopup();
  renderFavorites();
}

function startFavoriteRename(collectionId) {
  var item = document.querySelector('.favorite-collection-item[data-collection-id="' + collectionId + '"]');
  if (!item) return;
  var nameEl = item.querySelector('.favorite-collection-item-name');
  if (!nameEl || nameEl.querySelector('input')) return;

  var currentName = nameEl.textContent;
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'favorite-collection-rename-input';
  input.value = currentName;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function saveRename() {
    var newName = input.value.trim();
    if (!newName) {
      newName = currentName;
    }
    input.replaceWith(nameEl);
    nameEl.textContent = newName;
    applyFavoriteRename(collectionId, newName);
  }

  function cancelRename() {
    input.replaceWith(nameEl);
  }

  input.addEventListener('blur', saveRename);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      input.removeEventListener('blur', saveRename);
      saveRename();
    } else if (e.key === 'Escape') {
      input.removeEventListener('blur', saveRename);
      cancelRename();
    }
  });
}

async function applyFavoriteRename(collectionId, newName) {
  var favorites = await FavoritesManager.loadFavorites();
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].id === collectionId) {
      favorites[i].name = newName;
      break;
    }
  }
  await FavoritesManager.saveFavorites(favorites);
  renderFavorites();
}

async function handleDeleteFavoriteCollection(collectionId) {
  var favorites = await FavoritesManager.loadFavorites();
  var collection = null;
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].id === collectionId) { collection = favorites[i]; break; }
  }
  if (!collection) return;
  if (!confirm(t('favorites.confirmDelete', { name: collection.name }))) return;
  await FavoritesManager.deleteCollection(collectionId);
  renderFavorites();
}

async function handleUnfavoriteSkill(collectionId, skillId) {
  await FavoritesManager.removeSkills(collectionId, [skillId]);
  renderFavorites();
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════════════
//  技能收藏 — 收藏卡渲染
// ═══════════════════════════════════════════════

async function renderFavorites() {
  var container = document.getElementById('favoritesContainer');
  if (!container) return;

  var favorites = await FavoritesManager.loadFavorites();
  if (favorites.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  var registry = window.__getSkillRegistry();
  var allSkills = registry.getAll();
  var html = '';

  for (var i = 0; i < favorites.length; i++) {
    var col = favorites[i];
    html += '<div class="favorite-card" data-collection-id="' + col.id + '">';
    html += '<div class="favorite-card-header">';
    html += '<span class="favorite-card-title" data-collection-id="' + col.id + '">' + escapeHtml(col.name) + '</span>';
    html += '</div>';
    html += '<div class="favorite-card-desc" data-collection-id="' + col.id + '" data-expanded="false">' + escapeHtml(col.description || t('favorites.defaultDescription')) + '</div>';
    html += '<div class="favorite-card-skills">';
    for (var j = 0; j < col.skillIds.length; j++) {
      var sid = col.skillIds[j];
      var skill = null;
      for (var k = 0; k < allSkills.length; k++) {
        if (allSkills[k].id === sid) { skill = allSkills[k]; break; }
      }
      if (skill) {
        html += '<span class="favorite-skill-tag" data-skill-id="' + sid + '" data-collection-id="' + col.id + '">' + escapeHtml(skill.name) + '</span>';
      }
    }
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;

  container.querySelectorAll('.favorite-card').forEach(function (card) {
    var collectionId = card.getAttribute('data-collection-id');
    card.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showFavoriteCardContextMenu(e, collectionId);
    });
  });

  container.querySelectorAll('.favorite-card-title').forEach(function (titleEl) {
    titleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var collectionId = titleEl.getAttribute('data-collection-id');
      startFavoriteCardTitleEdit(collectionId);
    });
  });

  container.querySelectorAll('.favorite-skill-tag').forEach(function (tag) {
    tag.addEventListener('click', function (e) {
      e.stopPropagation();
      var skillId = tag.getAttribute('data-skill-id');
      activateFavoriteSkill(skillId);
    });
    tag.addEventListener('contextmenu', function (e) {
      var skillId = tag.getAttribute('data-skill-id');
      var collectionId = tag.getAttribute('data-collection-id');
      showFavoriteCardSkillContextMenu(e, collectionId, skillId);
    });
  });

  container.querySelectorAll('.favorite-card-desc').forEach(function (descEl) {
    descEl.addEventListener('click', function (e) {
      e.stopPropagation();
      handleDescClick(descEl);
    });
  });
}

function handleDescClick(descEl) {
  var collectionId = descEl.getAttribute('data-collection-id');
  var expanded = descEl.getAttribute('data-expanded') === 'true';

  if (expanded) {
    startFavoriteDescEdit(collectionId);
  } else {
    descEl.setAttribute('data-expanded', 'true');
    descEl.classList.add('favorite-card-desc--expanded');
  }
}

function startFavoriteDescEdit(collectionId) {
  var descEl = document.querySelector('.favorite-card-desc[data-collection-id="' + collectionId + '"]');
  if (!descEl || descEl.querySelector('textarea')) return;

  var currentText = descEl.textContent;
  var textarea = document.createElement('textarea');
  textarea.className = 'favorite-card-desc-input';
  textarea.value = currentText;
  textarea.rows = 3;
  descEl.replaceWith(textarea);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  function saveDesc() {
    var newText = textarea.value.trim();
    textarea.replaceWith(descEl);
    descEl.textContent = newText || t('favorites.defaultDescription');
    descEl.setAttribute('data-expanded', 'false');
    descEl.classList.remove('favorite-card-desc--expanded');
    saveFavoriteDesc(collectionId, newText || '');
  }

  function cancelDesc() {
    textarea.replaceWith(descEl);
    descEl.setAttribute('data-expanded', 'false');
    descEl.classList.remove('favorite-card-desc--expanded');
  }

  textarea.addEventListener('blur', saveDesc);
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      textarea.removeEventListener('blur', saveDesc);
      saveDesc();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      textarea.removeEventListener('blur', saveDesc);
      cancelDesc();
    }
  });
}

async function saveFavoriteDesc(collectionId, description) {
  var favorites = await FavoritesManager.loadFavorites();
  for (var i = 0; i < favorites.length; i++) {
    if (favorites[i].id === collectionId) {
      favorites[i].description = description;
      break;
    }
  }
  await FavoritesManager.saveFavorites(favorites);
}

function startFavoriteCardTitleEdit(collectionId) {
  var titleEl = document.querySelector('.favorite-card-title[data-collection-id="' + collectionId + '"]');
  if (!titleEl || titleEl.querySelector('input')) return;

  var currentName = titleEl.textContent;
  var input = document.createElement('input');
  input.type = 'text';
  input.className = 'favorite-card-title-input';
  input.value = currentName;
  titleEl.replaceWith(input);
  input.focus();
  input.select();

  function saveRename() {
    var newName = input.value.trim();
    if (!newName) {
      newName = currentName;
    }
    input.replaceWith(titleEl);
    titleEl.textContent = newName;
    applyFavoriteRename(collectionId, newName);
  }

  function cancelRename() {
    input.replaceWith(titleEl);
  }

  input.addEventListener('blur', saveRename);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      input.removeEventListener('blur', saveRename);
      saveRename();
    } else if (e.key === 'Escape') {
      input.removeEventListener('blur', saveRename);
      cancelRename();
    }
  });
}

function activateFavoriteSkill(skillId) {
  var registry = window.__getSkillRegistry();
  var skill = registry.getAll().find(function (s) { return s.id === skillId; });
  if (skill) showSkillDetail(skill);
}

// 弹窗关闭事件
(function () {
  var overlay = document.getElementById('skillDetailOverlay');
  var closeBtn = document.getElementById('skillDetailCloseBtn');
  var useBtn = document.getElementById('skillDetailUseBtn');
  var editBtn = document.getElementById('skillDetailEditBtn');
  var saveBtn = document.getElementById('skillEditSaveBtn');
  var cancelBtn = document.getElementById('skillEditCancelBtn');
  var resetBtn = document.getElementById('skillDetailResetBtn');

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hideSkillDetail();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', hideSkillDetail);
  }
  if (useBtn) {
    useBtn.addEventListener('click', function () {
      var skillId = useBtn.getAttribute('data-skill-id');
      if (!skillId) return;
      switchTab('chat');
      activateSkill(skillId);
      var chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.value = '/' + skillId + ' ';
        chatInput.focus();
        chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
      }
      hideSkillDetail();
    });
  }
  if (editBtn) {
    editBtn.addEventListener('click', function () {
      var skillId = useBtn.getAttribute('data-skill-id');
      if (!skillId) return;
      var registry = window.__getSkillRegistry();
      var skill = registry.getAll().find(function (s) { return s.id === skillId; });
      if (skill) enterSkillEditMode(skill);
    });
  }
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSkillEdit);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      exitSkillEditMode();
      var skillId = _currentEditingSkillId || useBtn.getAttribute('data-skill-id');
      if (skillId) {
        var registry = window.__getSkillRegistry();
        var skill = registry.getAll().find(function (s) { return s.id === skillId; });
        if (skill) showSkillDetail(skill);
      }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      var skillId = useBtn.getAttribute('data-skill-id');
      if (skillId) resetSkillEdit(skillId);
    });
  }
})();

// ─── 收藏功能事件绑定 ───

var skillContextMenu = document.getElementById('skillContextMenu');
if (skillContextMenu) {
  skillContextMenu.addEventListener('click', function (e) {
    var item = e.target.closest('.context-menu__item');
    if (!item) return;
    var action = item.getAttribute('data-action');
    var skillId = skillContextMenu.getAttribute('data-skill-id');
    if (action === 'favorite') {
      _clearContextMenuCleanup();
      skillContextMenu.style.display = 'none';
      if (skillId) handleAddToFavorite(skillId);
    } else if (action === 'delete') {
      _clearContextMenuCleanup();
      skillContextMenu.style.display = 'none';
      if (skillId) handleDeleteSkill(skillId);
    }
  });
}

var favoriteCardCtxMenu = document.getElementById('favoriteCardContextMenu');
if (favoriteCardCtxMenu) {
  favoriteCardCtxMenu.addEventListener('click', async function (e) {
    var item = e.target.closest('.context-menu__item');
    if (!item) return;
    var action = item.getAttribute('data-action');
    var collectionId = favoriteCardCtxMenu.getAttribute('data-collection-id');
    var skillId = favoriteCardCtxMenu.getAttribute('data-skill-id');
    _clearContextMenuCleanup();
    favoriteCardCtxMenu.style.display = 'none';

    if (action === 'unfavorite' && skillId && collectionId) {
      await handleUnfavoriteSkill(collectionId, skillId);
    } else if (action === 'deleteCollection' && collectionId) {
      await handleDeleteFavoriteCollection(collectionId);
    }
  });
}

var favoritePopup = document.getElementById('favoriteCollectionPopup');
if (favoritePopup) {
  var popupClose = favoritePopup.querySelector('.favorite-popup-close');
  if (popupClose) {
    popupClose.addEventListener('click', hideFavoriteCollectionPopup);
  }
  favoritePopup.addEventListener('click', function (e) {
    if (e.target === favoritePopup) hideFavoriteCollectionPopup();
  });

  var newBtn = document.getElementById('favoriteNewCollectionBtn');
  if (newBtn) {
    newBtn.addEventListener('click', handleNewFavoriteCollection);
  }
}

window.__getSkillRegistry().onSkillEvent(function () {
  if (tabSkills && tabSkills.classList.contains('active')) {
    renderSkillsList();
    renderFavorites();
  }
});

function switchSettingsSection(section) {
  settingsNavItems.forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-section') === section);
  });
  if (settingsProvider) {
    settingsProvider.classList.toggle('active', section === 'provider');
  }
  if (settingsBasic) {
    settingsBasic.classList.toggle('active', section === 'basic');
  }
  if (settingsAdvanced) {
    settingsAdvanced.classList.toggle('active', section === 'advanced');
  }
}

settingsNavItems.forEach((item) => {
  item.addEventListener('click', () => {
    const section = item.getAttribute('data-section');
    switchSettingsSection(section);
  });
});

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return result[SETTINGS_KEY] || { maxToolRounds: 5000, debugMode: false };
  } catch {
    return { maxToolRounds: 5000, debugMode: false };
  }
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

function applyDebugMode(debugMode) {
  currentDebugMode = debugMode;
  if (tabMonitorBtn) {
    tabMonitorBtn.style.display = debugMode ? '' : 'none';
  }
  if (agentsMdField) {
    agentsMdField.style.display = debugMode ? '' : 'none';
  }
  if (tabSkills && tabSkills.classList.contains('active')) {
    renderSkillsList();
  }
}

function populateBasicConfigForm(settings) {
  if (languageSelectEl) {
    languageSelectEl.value = window.__i18nMessages._storedLang || 'auto';
  }
}

function populateAdvancedConfigForm(settings) {
  if (maxToolRoundsEl) {
    maxToolRoundsEl.value = settings.maxToolRounds ?? 5000;
  }
  if (debugModeToggleEl) {
    debugModeToggleEl.checked = settings.debugMode === true;
  }
}

if (languageSelectEl) {
  languageSelectEl.addEventListener('change', async () => {
    var lang = languageSelectEl.value;
    await setLanguage(lang);
    updatePageLanguage();
    await skillRegistry.loadAllSkills();
    renderSkillsList();
    if (typeof window.ensureAgentsMdForLang === 'function') {
      var resolvedLang = window.resolveLanguage(lang);
      window.ensureAgentsMdForLang(resolvedLang).catch(function () {});
    }
  });
}

if (debugModeToggleEl) {
  debugModeToggleEl.addEventListener('change', async () => {
    const settings = await loadSettings();
    settings.debugMode = debugModeToggleEl.checked;
    await saveSettings(settings);
    applyDebugMode(settings.debugMode);
  });
}

if (themeToggleEl) {
  themeToggleEl.addEventListener('change', async () => {
    const theme = themeToggleEl.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    try {
      await chrome.storage.local.set({ [THEME_KEY]: theme });
    } catch {
      // 静默失败
    }
  });
}

if (advancedConfigSaveBtn) {
  advancedConfigSaveBtn.addEventListener('click', async () => {
    const raw = maxToolRoundsEl.value.trim();
    const num = parseInt(raw, 10);

    if (maxToolRoundsErrorEl) {
      maxToolRoundsErrorEl.textContent = '';
    }

    if (!raw || isNaN(num) || num < 1 || num !== Number(raw)) {
      if (maxToolRoundsErrorEl) {
        maxToolRoundsErrorEl.textContent = t('settings.invalidNumber');
      }
      return;
    }

    const settings = await loadSettings();
    settings.maxToolRounds = num;
    await saveSettings(settings);
  });
}

if (viewAgentsMdBtn && fileModalOverlay) {
  var agentsMdModalMarkdown = '';
  var agentsMdModalRaw = '';
  var agentsMdModalMode = 'preview'; // 'preview' or 'edit'

  var fileModalPath = fileModalOverlay.querySelector('.file-modal-path');
  var fileModalContent = fileModalOverlay.querySelector('.file-modal-content');
  var fileModalClose = fileModalOverlay.querySelector('.file-modal-close');

  function showAgentsMdPreview() {
    agentsMdModalMode = 'preview';
    if (fileModalPath) {
      fileModalPath.textContent = t('settings.systemPromptTitle');
    }
    fileModalContent.style.fontFamily = '';
    fileModalContent.style.fontSize = '';
    fileModalContent.style.whiteSpace = '';
    var html = '';
    if (typeof marked !== 'undefined' && marked.parse) {
      try {
        html = marked.parse(agentsMdModalMarkdown);
      } catch (e) {
        html = '<pre>' + escHtml(agentsMdModalMarkdown) + '</pre>';
      }
    } else {
      html = '<pre>' + escHtml(agentsMdModalMarkdown) + '</pre>';
    }
    fileModalContent.innerHTML = html +
      '<div class="agents-md-modal-actions">' +
      '<button id="agentsMdEditBtn" class="agents-md-btn">' + t('settings.editSystemPrompt') + '</button>' +
      '</div>';
    fileModalOverlay.classList.remove('hidden');
    bindAgentsMdModalButtons();
  }

  function showAgentsMdEdit() {
    agentsMdModalMode = 'edit';
    if (fileModalPath) {
      fileModalPath.textContent = t('settings.editSystemPrompt');
    }
    fileModalContent.style.fontFamily = 'monospace';
    fileModalContent.style.fontSize = '13px';
    fileModalContent.style.whiteSpace = 'pre-wrap';
    fileModalContent.innerHTML =
      '<textarea id="agentsMdTextarea" style="width:100%;min-height:300px;font-family:monospace;font-size:13px;padding:8px;border:1px solid var(--border-color, #ccc);border-radius:4px;background:var(--bg-primary, #fff);color:var(--text-primary, #333);resize:vertical;">' +
      escHtml(agentsMdModalRaw) +
      '</textarea>' +
      '<div class="agents-md-modal-actions">' +
      '<button id="agentsMdSaveBtn" class="agents-md-btn agents-md-btn--primary">' + t('settings.saveSystemPrompt') + '</button>' +
      '<button id="agentsMdResetBtn" class="agents-md-btn agents-md-btn--secondary">' + t('settings.resetSystemPrompt') + '</button>' +
      '<button id="agentsMdCancelBtn" class="agents-md-btn agents-md-btn--secondary">' + t('settings.cancelEditSystemPrompt') + '</button>' +
      '</div>';
    bindAgentsMdModalButtons();
  }

  function bindAgentsMdModalButtons() {
    var editBtn = document.getElementById('agentsMdEditBtn');
    var saveBtn = document.getElementById('agentsMdSaveBtn');
    var resetBtn = document.getElementById('agentsMdResetBtn');
    var cancelBtn = document.getElementById('agentsMdCancelBtn');

    if (editBtn) {
      editBtn.addEventListener('click', function () {
        agentsMdModalRaw = agentsMdModalMarkdown;
        showAgentsMdEdit();
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', async function () {
        var textarea = document.getElementById('agentsMdTextarea');
        if (!textarea) return;
        agentsMdModalRaw = textarea.value;
        agentsMdModalMarkdown = textarea.value;
        if (typeof window.saveAgentsMd === 'function') {
          await window.saveAgentsMd(agentsMdModalRaw);
        }
        showAgentsMdPreview();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (typeof window.buildAgentsMdContent === 'function') {
          var lang = window.resolveLanguage(window.__i18nMessages._storedLang || 'auto');
          agentsMdModalRaw = window.buildAgentsMdContent(lang);
          var textarea = document.getElementById('agentsMdTextarea');
          if (textarea) {
            textarea.value = agentsMdModalRaw;
          }
        }
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        showAgentsMdPreview();
      });
    }
  }

  var origFileModalCloseClick = fileModalClose ? fileModalClose.onclick : null;
  if (fileModalClose) {
    fileModalClose.addEventListener('click', function () {
      fileModalOverlay.classList.add('hidden');
      fileModalContent.innerHTML = '';
      fileModalContent.style.fontFamily = '';
      fileModalContent.style.fontSize = '';
      fileModalContent.style.whiteSpace = '';
      agentsMdModalMarkdown = '';
      agentsMdModalRaw = '';
      agentsMdModalMode = 'preview';
    });
  }

  fileModalOverlay.addEventListener('click', function (e) {
    if (e.target === fileModalOverlay) {
      fileModalOverlay.classList.add('hidden');
      fileModalContent.innerHTML = '';
      fileModalContent.style.fontFamily = '';
      fileModalContent.style.fontSize = '';
      fileModalContent.style.whiteSpace = '';
      agentsMdModalMarkdown = '';
      agentsMdModalRaw = '';
      agentsMdModalMode = 'preview';
    }
  });

  viewAgentsMdBtn.addEventListener('click', async function () {
    if (typeof window.getAgentsMd === 'function') {
      var record = await window.getAgentsMd();
      if (record && record.content) {
        agentsMdModalMarkdown = record.content;
        agentsMdModalRaw = record.content;
        showAgentsMdPreview();
      }
    }
  });
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openBatchDeleteDialog() {
  SessionManager.loadSessions().then(function (sessions) {
    var listEl = document.getElementById('batchDeleteList');
    var overlay = document.getElementById('batchDeleteOverlay');
    var selectAllCheckbox = document.getElementById('batchDeleteSelectAll');
    var dialog = document.getElementById('batchDeleteDialog');
    if (!listEl || !overlay) return;

    if (dialog) dialog.dataset.confirmed = 'false';

    var html = '';
    for (var i = 0; i < sessions.length; i++) {
      var title = sessions[i].title || t('session.untitled');
      html += '<label class="batch-delete__item">'
        + '<input type="checkbox" class="batch-delete__checkbox" data-session-id="' + sessions[i].id + '">'
        + '<span class="batch-delete__title">' + htmlEscapeStr(title) + '</span>'
        + '</label>';
    }
    listEl.innerHTML = html;

    // 仅会话数大于1时显示全选
    if (selectAllCheckbox.parentElement) {
      selectAllCheckbox.parentElement.style.display = sessions.length > 1 ? '' : 'none';
    }
    selectAllCheckbox.checked = false;
    updateBatchDeleteCount();

    // 全选逻辑
    selectAllCheckbox.onchange = function () {
      var checkboxes = listEl.querySelectorAll('.batch-delete__checkbox');
      var checked = selectAllCheckbox.checked;
      for (var i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = checked;
      }
      updateBatchDeleteCount();
    };

    // 单选框变更时更新全选状态
    var checkboxes = listEl.querySelectorAll('.batch-delete__checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].onchange = function () {
        var allCheckboxes = listEl.querySelectorAll('.batch-delete__checkbox');
        var allChecked = true;
        for (var j = 0; j < allCheckboxes.length; j++) {
          if (!allCheckboxes[j].checked) { allChecked = false; break; }
        }
        selectAllCheckbox.checked = allChecked;
        updateBatchDeleteCount();
      };
    }

    overlay.style.display = '';
  });
}

function closeBatchDeleteDialog() {
  var overlay = document.getElementById('batchDeleteOverlay');
  if (overlay) overlay.style.display = 'none';
}

function updateBatchDeleteCount() {
  var count = document.querySelectorAll('.batch-delete__checkbox:checked').length;
  var btn = document.getElementById('batchDeleteConfirm');
  var dialog = document.getElementById('batchDeleteDialog');
  if (!btn) return;
  if (count === 0) {
    btn.textContent = '确定（0）';
    btn.classList.remove('batch-delete-dialog__btn--confirming');
    btn.classList.add('batch-delete-dialog__btn--disabled');
  } else if (dialog && dialog.dataset.confirmed === 'true') {
    btn.textContent = '确定删除';
    btn.classList.add('batch-delete-dialog__btn--confirming');
    btn.classList.remove('batch-delete-dialog__btn--disabled');
  } else {
    btn.textContent = '确定（' + count + '）';
    btn.classList.remove('batch-delete-dialog__btn--confirming');
    btn.classList.remove('batch-delete-dialog__btn--disabled');
  }
}

async function handleBatchDeleteSessions() {
  var checkboxes = document.querySelectorAll('.batch-delete__checkbox:checked');
  if (checkboxes.length === 0) { closeBatchDeleteDialog(); return; }

  var activeId = window.currentSessionId;
  var selectedIds = [];
  for (var i = 0; i < checkboxes.length; i++) {
    selectedIds.push(checkboxes[i].dataset.sessionId);
  }
  var isActiveDeleted = activeId && selectedIds.indexOf(activeId) !== -1;

  for (var j = 0; j < selectedIds.length; j++) {
    await SessionManager.deleteSession(selectedIds[j]);
  }

  if (isActiveDeleted) {
    if (typeof SessionManager !== 'undefined') {
      SessionManager.setActiveSessionId(null);
    }
    currentSessionId = null;
    window.currentSessionId = null;
    window.currentSessionMessages = [];
    window.chatMessages = [];
    showWelcomePage();
    updateSessionTitleDisplay('');
  }

  var deletedCount = selectedIds.length;
  closeBatchDeleteDialog();
  renderSessionList();
  refreshWelcomeRecentIfVisible();
  showToast('成功删除 ' + deletedCount + ' 条会话');
}

// 绑定对话框事件（在 init 中调用）
function initBatchDeleteDialog() {
  var confirmBtn = document.getElementById('batchDeleteConfirm');
  var cancelBtn = document.getElementById('batchDeleteCancel');
  var overlay = document.getElementById('batchDeleteOverlay');
  var dialog = document.getElementById('batchDeleteDialog');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', function () {
      var checked = document.querySelectorAll('.batch-delete__checkbox:checked');
      if (checked.length === 0) {
        showToast('请选择要删除的会话');
        return;
      }
      if (dialog && dialog.dataset.confirmed === 'true') {
        handleBatchDeleteSessions();
      } else {
        if (dialog) dialog.dataset.confirmed = 'true';
        updateBatchDeleteCount();
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      if (dialog) dialog.dataset.confirmed = 'false';
      closeBatchDeleteDialog();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        if (dialog) dialog.dataset.confirmed = 'false';
        closeBatchDeleteDialog();
      }
    });
  }
}

// ═══════════════════════════════════════════════

init();

const deepSeekApiKeyBtn = document.getElementById('getDeepSeekApiKeyBtn');
if (deepSeekApiKeyBtn) {
  deepSeekApiKeyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://platform.deepseek.com/' });
  });
}

window.__runPanelTests = function () {
  var passed = 0;
  var failed = 0;
  var results = [];

  function ok(cond, name) {
    if (cond) { results.push('  PASS: ' + name); passed++; }
    else { results.push('  FAIL: ' + name); failed++; }
  }
  function eq(a, b, name) {
    var r = a === b;
    if (r) { results.push('  PASS: ' + name + ' (=' + JSON.stringify(b) + ')'); passed++; }
    else { results.push('  FAIL: ' + name + ' (got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b) + ')'); failed++; }
  }

  console.log('═══════════════════════════════════════');
  console.log('  Panel 函数自测');
  console.log('═══════════════════════════════════════');

  // escapeHtml
  console.log('\n── escapeHtml ──');
  eq(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert("x")&lt;/script&gt;', 'P1 escapeHtml escapes tags');
  eq(escapeHtml('hello & world'), 'hello &amp; world', 'P2 escapeHtml escapes amp');
  eq(escapeHtml(''), '', 'P3 escapeHtml empty string');

  // getCurrentLangSuffix
  console.log('\n── getCurrentLangSuffix ──');
  if (typeof getCurrentLangSuffix === 'function') {
    ok(typeof getCurrentLangSuffix() === 'string', 'P4 returns string');
    ok(getCurrentLangSuffix() === 'cn' || getCurrentLangSuffix() === 'en', 'P5 returns cn or en');
  }

  // showToast (验证 toast 元素创建)
  console.log('\n── showToast ──');
  if (typeof showToast === 'function') {
    var container = document.getElementById('toastContainer');
    if (container) {
      var before = container.children.length;
      showToast('测试消息');
      var after = container.children.length;
      eq(after, before + 1, 'P6 showToast creates toast element');
    }
  }

  // showSkillDetail / hideSkillDetail / enterSkillEditMode / exitSkillEditMode
  console.log('\n── 技能详情弹窗 ──');
  ok(typeof showSkillDetail === 'function', 'P7 showSkillDetail exists');
  ok(typeof hideSkillDetail === 'function', 'P8 hideSkillDetail exists');
  ok(typeof enterSkillEditMode === 'function', 'P9 enterSkillEditMode exists');
  ok(typeof exitSkillEditMode === 'function', 'P10 exitSkillEditMode exists');
  ok(typeof saveSkillEdit === 'function', 'P11 saveSkillEdit exists');
  ok(typeof resetSkillEdit === 'function', 'P12 resetSkillEdit exists');
  ok(typeof handleDeleteSkill === 'function', 'P13 handleDeleteSkill exists');

  console.log('\n═══════════════════════════════════════');
  console.log('  最终结果: ' + passed + ' 通过 / ' + (passed + failed) + ' 总计');
  console.log(failed > 0 ? '  ❌ ' + failed + ' 个测试失败' : '  ✅ 全部通过');
  console.log('═══════════════════════════════════════');
  results.forEach(function (r) { console.log(r); });
  return { passed: passed, failed: failed, total: passed + failed };
};

