// ============================================================
// AGENTS.md 缓存管理 - 从 i18n 生成系统提示词，存入 IndexedDB
// ============================================================

const AGENTS_MD_CACHE_STORE = 'agents_md_cache';

function getAgentsMdKey(lang) {
  return 'agents_md_' + lang;
}

window.buildAgentsMdContent = function (lang) {
  var msgs = window.__i18nMessages;
  var map = msgs[lang] || msgs['en'];
  var sp = map.systemPrompt || msgs['en'].systemPrompt;

  return sp.role + '\n\n' +
    sp.contextInfo + '\n\n' +
    '## ' + sp.rulesLabel + '\n\n' +
    '1. ' + sp.rule1 + '\n' +
    '2. ' + sp.rule2 + '\n' +
    '3. ' + sp.rule3 + '\n' +
    '4. ' + sp.rule4 + '\n' +
    '5. ' + sp.rule5 + '\n' +
    '6. ' + sp.rule6 + '\n' +
    '7. ' + sp.rule7;
}

function getAgentsMdDB() {
  return new Promise(function (resolve, reject) {
    if (typeof openDB !== 'function') {
      reject(new Error('openDB not available'));
      return;
    }
    openDB().then(resolve).catch(reject);
  });
}

window.ensureAgentsMdForLang = async function (lang) {
  var key = getAgentsMdKey(lang);
  try {
    var database = await getAgentsMdDB();
    var existing = await new Promise(function (resolve, reject) {
      var tx = database.transaction(AGENTS_MD_CACHE_STORE, 'readonly');
      var store = tx.objectStore(AGENTS_MD_CACHE_STORE);
      var req = store.get(key);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    if (existing) return existing;
  } catch (e) {
    // store 可能还不存在，继续生成
  }

  var content = window.buildAgentsMdContent(lang);
  var record = { id: key, content: content, lang: lang, updatedAt: Date.now() };
  try {
    var database2 = await getAgentsMdDB();
    await new Promise(function (resolve, reject) {
      var tx = database2.transaction(AGENTS_MD_CACHE_STORE, 'readwrite');
      var store = tx.objectStore(AGENTS_MD_CACHE_STORE);
      var req = store.put(record);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (e) {
    console.error('ensureAgentsMdForLang: failed to save', e);
  }
  return record;
};

window.getAgentsMd = async function () {
  var lang = window.resolveLanguage(window.__i18nMessages._storedLang || 'auto');
  return await window.ensureAgentsMdForLang(lang);
};

window.saveAgentsMd = async function (content, lang) {
  if (!lang) {
    lang = window.resolveLanguage(window.__i18nMessages._storedLang || 'auto');
  }
  var key = getAgentsMdKey(lang);
  var record = { id: key, content: content, lang: lang, updatedAt: Date.now() };
  try {
    var database = await getAgentsMdDB();
    await new Promise(function (resolve, reject) {
      var tx = database.transaction(AGENTS_MD_CACHE_STORE, 'readwrite');
      var store = tx.objectStore(AGENTS_MD_CACHE_STORE);
      var req = store.put(record);
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  } catch (e) {
    console.error('saveAgentsMd: failed', e);
  }
};

window.regenerateAgentsMd = async function (lang) {
  if (!lang) {
    lang = window.resolveLanguage(window.__i18nMessages._storedLang || 'auto');
  }
  var content = window.buildAgentsMdContent(lang);
  await window.saveAgentsMd(content, lang);
  return content;
};
