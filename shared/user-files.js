// ============================================================
// 用户提交管理 - 存储用户通过聊天附件功能提交的文件
// 与工作产物卡片、记忆卡片完全独立，有且仅有一张"用户提交"卡片
// 文件路径示例：<sessionId>/<文件名>
// ============================================================

const USER_SUBMIT_KEY = 'ai_helper_user_submit_item';

let userSubmitCache = null;

async function loadUserSubmitItem() {
  try {
    const result = await chrome.storage.local.get(USER_SUBMIT_KEY);
    return result[USER_SUBMIT_KEY] || null;
  } catch {
    return null;
  }
}

async function saveUserSubmitItem(item) {
  try {
    await chrome.storage.local.set({ [USER_SUBMIT_KEY]: item });
    userSubmitCache = item;
  } catch {
    throw new Error('保存用户提交卡片失败');
  }
}

async function initUserSubmitCard() {
  if (userSubmitCache) return userSubmitCache;

  let item = await loadUserSubmitItem();
  if (!item) {
    item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : 'us_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)),
      displayName: '用户聊天提交文件',
      type: 'user_submit',
      description: '',
      createdAt: Date.now(),
      fileCount: 0
    };
    await saveUserSubmitItem(item);
  }
  userSubmitCache = item;
  return item;
}

async function getUserSubmitItem() {
  if (userSubmitCache) return userSubmitCache;
  return loadUserSubmitItem();
}

async function saveUserFile(filePath, content) {
  var item = await initUserSubmitCard();

  var cleaned = (filePath || '').replace(/\\/g, '/');
  cleaned = cleaned.replace(/\/+/g, '/');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');
  if (!cleaned) {
    throw new Error('文件路径不能为空');
  }

  await FileCacheManager.addFiles(item.id, [{
    path: cleaned,
    content: content,
    updatedAt: Date.now()
  }]);

  var updatedFiles = await FileCacheManager.getFilesByKnowledge(item.id);
  var children = buildUserSubmitTree(updatedFiles);
  await TreeCacheManager.saveTree(item.id, { root: '', children: children });

  item.fileCount = updatedFiles.length;
  await saveUserSubmitItem(item);

  return cleaned;
}

function buildUserSubmitTree(files) {
  var tree = {};
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var parts = f.path.split('/');
    var current = tree;
    for (var j = 0; j < parts.length - 1; j++) {
      if (!current[parts[j]]) {
        current[parts[j]] = {};
      }
      current = current[parts[j]];
    }
    if (!current._files) current._files = [];
    current._files.push(parts[parts.length - 1]);
  }
  return tree;
}

async function getUserFile(path) {
  var item = await loadUserSubmitItem();
  if (!item) {
    return JSON.stringify({ error: '用户提交卡片不存在' });
  }

  try {
    var file = await FileCacheManager.getFile(item.id, path);
    if (!file) {
      return JSON.stringify({ error: '用户提交文件未找到: ' + path });
    }
    return file.content || '';
  } catch (err) {
    return JSON.stringify({ error: '读取用户提交文件失败: ' + (err.message || '') });
  }
}

async function searchUserFiles(pathPrefix) {
  var item = await loadUserSubmitItem();
  if (!item) return [];

  var files = await FileCacheManager.getFilesByKnowledge(item.id);

  var filtered = files;
  if (pathPrefix) {
    var prefix = pathPrefix.replace(/^\/+/, '');
    filtered = files.filter(function (f) {
      return f.path.startsWith(prefix);
    });
  }

  var result = [];
  var seenDirs = {};

  for (var i = 0; i < filtered.length; i++) {
    var f = filtered[i];
    result.push({
      path: f.path,
      type: 'file',
      content_preview: (f.content || '').substring(0, 200)
    });

    if (pathPrefix) {
      var relativePath = f.path.substring(prefix.length);
      var slashIdx = relativePath.indexOf('/');
      if (slashIdx > 0) {
        var dirName = prefix + relativePath.substring(0, slashIdx);
        if (!seenDirs[dirName]) {
          seenDirs[dirName] = true;
          result.push({ path: dirName, type: 'directory' });
        }
      }
    }
  }

  return result;
}

async function deleteUserSubmitCard() {
  var item = await loadUserSubmitItem();
  if (!item) return;

  await FileCacheManager.deleteKnowledgeFiles(item.id).catch(function () {});
  await TreeCacheManager.deleteTree(item.id).catch(function () {});

  await chrome.storage.local.remove(USER_SUBMIT_KEY);
  userSubmitCache = null;

  if (typeof renderKnowledgeList === 'function') {
    try { await renderKnowledgeList(); } catch {}
  }
}
