var SKILL_HISTORY_KEY = 'ai_helper_skill_history';
var MAX_HISTORY_ENTRIES = 20;

var _historyCache = {};

async function loadHistory() {
  try {
    var result = await chrome.storage.local.get(SKILL_HISTORY_KEY);
    _historyCache = result[SKILL_HISTORY_KEY] || {};
    return _historyCache;
  } catch (e) {
    _historyCache = {};
    return _historyCache;
  }
}

function getHistoryData() {
  return _historyCache;
}

async function saveHistory() {
  try {
    await chrome.storage.local.set({ [SKILL_HISTORY_KEY]: _historyCache });
  } catch (e) {
    // silently ignore
  }
}

function addHistoryEntry(skillId, langSuffix, entry) {
  var key = skillId + ':' + langSuffix;
  if (!_historyCache[key]) {
    _historyCache[key] = [];
  }
  _historyCache[key].push(entry);
  if (_historyCache[key].length > MAX_HISTORY_ENTRIES) {
    _historyCache[key].shift();
  }
}

function getHistory(skillId, langSuffix) {
  var key = skillId + ':' + langSuffix;
  return _historyCache[key] || [];
}

function clearHistory(skillId, langSuffix) {
  if (langSuffix) {
    var key = skillId + ':' + langSuffix;
    delete _historyCache[key];
  } else {
    var prefix = skillId + ':';
    Object.keys(_historyCache).forEach(function (k) {
      if (k.indexOf(prefix) === 0) {
        delete _historyCache[k];
      }
    });
  }
}
