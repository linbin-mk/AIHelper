// ============================================================
// 工作产物管理 - 存储 OpenSpec 产出、生成的代码文件等
// 与记忆卡片完全独立，有且仅有一张"工作产物"卡片
// 文件路径无需域名前缀，如 openspec/changes/{name}/proposal.md
// ============================================================

const OUTPUT_KEY = 'ai_helper_output_item';

let outputItemCache = null;

async function loadOutputItem() {
  try {
    const result = await chrome.storage.local.get(OUTPUT_KEY);
    return result[OUTPUT_KEY] || null;
  } catch {
    return null;
  }
}

async function saveOutputItem(item) {
  try {
    await chrome.storage.local.set({ [OUTPUT_KEY]: item });
    outputItemCache = item;
  } catch {
    throw new Error('保存工作产物卡片失败');
  }
}

async function initOutputCard() {
  if (outputItemCache) return outputItemCache;

  let item = await loadOutputItem();
  if (!item) {
    item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : 'out_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)),
      displayName: '工作产物',
      type: 'output',
      description: '',
      createdAt: Date.now(),
      fileCount: 0
    };
    await saveOutputItem(item);
  }
  outputItemCache = item;
  return item;
}

async function getOutputItem() {
  if (outputItemCache) return outputItemCache;
  return loadOutputItem();
}

function sanitizePath(filePath) {
  var cleaned = (filePath || '').replace(/\\/g, '/');
  cleaned = cleaned.replace(/\/+/g, '/');
  cleaned = cleaned.replace(/^\/+|\/+$/g, '');
  return cleaned || 'untitled.md';
}

async function saveOutputFile(filePath, content) {
  const outputItem = await initOutputCard();

  var normalizedPath = sanitizePath(filePath);
  if (!normalizedPath) {
    throw new Error('文件路径不能为空');
  }

  await FileCacheManager.addFiles(outputItem.id, [{
    path: normalizedPath,
    content: content,
    updatedAt: Date.now()
  }]);

  const updatedFiles = await FileCacheManager.getFilesByKnowledge(outputItem.id);
  const children = buildOutputTree(updatedFiles);
  const tree = { root: '', children: children };
  await TreeCacheManager.saveTree(outputItem.id, tree);

  outputItem.fileCount = updatedFiles.length;
  await saveOutputItem(outputItem);

  return normalizedPath;
}

function buildOutputTree(files) {
  const tree = {};
  for (const f of files) {
    const parts = f.path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    if (!current._files) current._files = [];
    current._files.push(parts[parts.length - 1]);
  }
  return tree;
}

async function searchOutputFiles(pathPrefix) {
  const outputItem = await loadOutputItem();
  if (!outputItem) return [];

  const files = await FileCacheManager.getFilesByKnowledge(outputItem.id);

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

async function getOutputFile(path) {
  const outputItem = await loadOutputItem();
  if (!outputItem) {
    return JSON.stringify({ error: '工作产物卡片不存在' });
  }

  try {
    const file = await FileCacheManager.getFile(outputItem.id, path);
    if (!file) {
      return JSON.stringify({ error: '产物文件未找到: ' + path });
    }
    return file.content || '';
  } catch (err) {
    return JSON.stringify({ error: '读取产物文件失败: ' + (err.message || '') });
  }
}

async function deleteOutputCard() {
  const outputItem = await loadOutputItem();
  if (!outputItem) return;

  await FileCacheManager.deleteKnowledgeFiles(outputItem.id).catch(function () {});
  await TreeCacheManager.deleteTree(outputItem.id).catch(function () {});

  await chrome.storage.local.remove(OUTPUT_KEY);
  outputItemCache = null;

  if (typeof renderKnowledgeList === 'function') {
    try { await renderKnowledgeList(); } catch {}
  }
}
