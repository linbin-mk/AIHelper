// ============================================================
// 知识管理 - 本地文件导入、IndexedDB缓存、AI上下文
// ============================================================

const KNOWLEDGE_KEY = 'ai_helper_knowledge_items';
const DB_NAME = 'ai_helper_code_cache';
const DB_VERSION = 4;

const SOURCE_EXTENSIONS = [
  '.js', '.ts', '.tsx', '.jsx', '.vue', '.java', '.xml', '.json',
  '.yaml', '.yml', '.md', '.css', '.scss', '.less', '.html',
  '.py', '.go', '.rs', '.sql', '.properties', '.gradle', '.proto',
  '.txt', '.env', '.cfg', '.ini', '.toml',
  '.sh', '.bash', '.zsh', '.bat', '.ps1', '.cmake', '.conf'
];

const SKIP_DIRS = [
  'node_modules', 'dist', 'build', '.git', 'target', 'vendor',
  '__pycache__', '.idea', '.vscode', '.svn', 'coverage', '.nyc_output',
  '.next', '.nuxt', 'tmp', 'temp', 'cache'
];

const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2',
  '.ttf', '.eot', '.mp4', '.mp3', '.webm', '.pdf', '.zip', '.tar', '.gz',
  '.rar', '.7z', '.exe', '.dll', '.so', '.dylib', '.class', '.o', '.obj',
  '.wasm', '.map'
];

const FILE_IMPORT_BATCH_SIZE = 50;

// ============================================================
// 知识条目配置层
// ============================================================

function generateKnowledgeId() {
  return crypto.randomUUID ? crypto.randomUUID() : 'kid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

async function loadKnowledgeItems() {
  try {
    const result = await chrome.storage.local.get(KNOWLEDGE_KEY);
    const items = result[KNOWLEDGE_KEY] || [];

    if (typeof loadOutputItem === 'function') {
      const outputItem = await loadOutputItem();
      if (outputItem) {
        items.unshift(outputItem);
      }
    }

    if (typeof loadMemoryItem === 'function') {
      const memoryItem = await loadMemoryItem();
      if (memoryItem) {
        items.unshift(memoryItem);
      }
    }

    if (typeof loadUserSubmitItem === 'function') {
      const userSubmitItem = await loadUserSubmitItem();
      if (userSubmitItem) {
        items.unshift(userSubmitItem);
      }
    }
    return items;
  } catch {
    return [];
  }
}

async function saveKnowledgeItems(items) {
  try {
    const clean = items.filter(function(item) {
      return item.type !== 'memory' && item.type !== 'output' && item.type !== 'user_submit';
    });
    await chrome.storage.local.set({ [KNOWLEDGE_KEY]: clean });
  } catch {
    throw new Error(t('knowledge.validation.saveFailed'));
  }
}

async function addKnowledgeItem(item) {
  if (item.type === 'memory') {
    if (typeof saveMemoryItem === 'function') {
      await saveMemoryItem(item);
      return item;
    }
  }
  const items = await loadKnowledgeItems();
  items.push(item);
  await saveKnowledgeItems(items);
  return item;
}

async function updateKnowledgeItem(id, updates) {
  const items = await loadKnowledgeItems();
  const idx = items.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(t('knowledge.notFound'));
  items[idx] = { ...items[idx], ...updates };
  await saveKnowledgeItems(items);
  return items[idx];
}

async function deleteKnowledgeItem(id) {
  const items = await loadKnowledgeItems();
  const filtered = items.filter(p => p.id !== id);
  await saveKnowledgeItems(filtered);
}

// ============================================================
// IndexedDB 缓存层
// ============================================================

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (event.oldVersion < 3) {
        if (database.objectStoreNames.contains('files')) {
          database.deleteObjectStore('files');
        }
        if (database.objectStoreNames.contains('trees')) {
          database.deleteObjectStore('trees');
        }
      }
      if (!database.objectStoreNames.contains('files')) {
        const filesStore = database.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('knowledgeId', 'knowledgeId', { unique: false });
        filesStore.createIndex('path', 'path', { unique: false });
      }
      if (!database.objectStoreNames.contains('trees')) {
        const treesStore = database.createObjectStore('trees', { keyPath: 'knowledgeId' });
        treesStore.createIndex('knowledgeId', 'knowledgeId', { unique: true });
      }
      if (event.oldVersion < 4) {
        if (!database.objectStoreNames.contains('agents_md_cache')) {
          database.createObjectStore('agents_md_cache', { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(new Error(t('knowledge.dbOpenFailed') + event.target.error.message));
    };
  });
}

const FileCacheManager = {
  async addFiles(knowledgeId, files) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readwrite');
      const store = tx.objectStore('files');

      for (const file of files) {
        store.put({
          id: knowledgeId + '::' + file.path,
          knowledgeId,
          path: file.path,
          content: file.content,
          updatedAt: file.updatedAt || Date.now()
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getFile(knowledgeId, path) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const request = store.get(knowledgeId + '::' + path);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getFilesByKnowledge(knowledgeId) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const index = store.index('knowledgeId');
      const request = index.getAll(knowledgeId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteKnowledgeFiles(knowledgeId) {
    const database = await openDB();
    const files = await this.getFilesByKnowledge(knowledgeId);
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      for (const file of files) {
        store.delete(file.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async searchFiles(knowledgeId, keyword) {
    const database = await openDB();
    const files = await this.getFilesByKnowledge(knowledgeId);
    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (const file of files) {
      const lowerContent = file.content.toLowerCase();
      const idx = lowerContent.indexOf(lowerKeyword);
      if (idx !== -1) {
        const lines = file.content.split('\n');
        let lineNum = 0;
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
          if (charCount + lines[i].length >= idx) {
            lineNum = i;
            break;
          }
          charCount += lines[i].length + 1;
        }
        const startLine = Math.max(0, lineNum - 2);
        const endLine = Math.min(lines.length, lineNum + 3);
        const snippet = lines.slice(startLine, endLine).map((l, i) =>
          `${startLine + i + 1}: ${l}`
        ).join('\n');

        results.push({
          filePath: file.path,
          lineNumber: lineNum + 1,
          snippet
        });
      }
    }

    return results.slice(0, 5);
  },

  async getKnowledgeFilesCount(knowledgeId) {
    const files = await this.getFilesByKnowledge(knowledgeId);
    return files.length;
  }
};

const TreeCacheManager = {
  async saveTree(knowledgeId, tree) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readwrite');
      const store = tx.objectStore('trees');
      store.put({ knowledgeId, tree, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getTree(knowledgeId) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readonly');
      const store = tx.objectStore('trees');
      const request = store.get(knowledgeId);
      request.onsuccess = () => resolve(request.result ? request.result.tree : null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteTree(knowledgeId) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readwrite');
      const store = tx.objectStore('trees');
      store.delete(knowledgeId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};

// ============================================================
// 文件过滤工具
// ============================================================

function isSourceFile(filePath) {
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];
  const extIdx = fileName.lastIndexOf('.');
  if (extIdx === -1) return false;
  const ext = fileName.substring(extIdx).toLowerCase();

  if (BINARY_EXTENSIONS.includes(ext)) return false;
  if (SOURCE_EXTENSIONS.includes(ext)) return true;
  return false;
}

function shouldSkipDirectory(filePath) {
  const parts = filePath.split('/');
  for (const part of parts) {
    if (SKIP_DIRS.includes(part)) return true;
  }
  return false;
}

// ============================================================
// 文件导入引擎
// ============================================================

async function importFiles(files, knowledgeId, onProgress) {
  const sourceFiles = [];
  const allPaths = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relativePath = file._relativePath || file.webkitRelativePath || file.name;

    if (shouldSkipDirectory(relativePath)) continue;
    if (!isSourceFile(relativePath)) continue;

    sourceFiles.push({ file, path: relativePath });
    allPaths.push(relativePath);
  }

  const totalFiles = sourceFiles.length;
  let processedCount = 0;
  const contentFiles = [];

  for (let i = 0; i < sourceFiles.length; i += FILE_IMPORT_BATCH_SIZE) {
    const batch = sourceFiles.slice(i, i + FILE_IMPORT_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (sf) => {
        try {
          const content = await readFileAsText(sf.file);
          return { path: sf.path, content, updatedAt: Date.now() };
        } catch {
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result) {
        contentFiles.push(result);
      }
      processedCount++;
      if (onProgress) {
        onProgress({ loaded: processedCount, total: totalFiles, message: t('knowledge.importing', { loaded: processedCount, total: totalFiles }) });
      }
    }

    if (contentFiles.length >= FILE_IMPORT_BATCH_SIZE) {
      const toWrite = contentFiles.splice(0, contentFiles.length);
      await FileCacheManager.addFiles(knowledgeId, toWrite);
    }
  }

  if (contentFiles.length > 0) {
    await FileCacheManager.addFiles(knowledgeId, contentFiles);
  }

  const tree = { root: '', children: buildTreeStructure(allPaths) };
  await TreeCacheManager.saveTree(knowledgeId, tree);

  if (onProgress) {
    onProgress({ loaded: totalFiles, total: totalFiles, message: t('knowledge.importDone', { n: allPaths.length }), done: true });
  }

  return { fileCount: allPaths.length };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// ============================================================
// 文件树构建和渲染
// ============================================================

function buildTreeStructure(filePaths) {
  const root = {};

  for (const filePath of filePaths) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        if (!current._files) current._files = [];
        current._files.push(part);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  return root;
}

const FILE_ICON_MAP = {
  '.js': '📜', '.ts': '🔷', '.tsx': '🔷', '.jsx': '📜',
  '.vue': '💚', '.json': '📋', '.yaml': '⚙️', '.yml': '⚙️',
  '.md': '📝', '.css': '🎨', '.scss': '🎨', '.less': '🎨',
  '.html': '🌐', '.py': '🐍', '.go': '🔵', '.rs': '🦀',
  '.java': '☕', '.sql': '🗄️', '.xml': '📰',
  '.properties': '⚙️', '.gradle': '🐘', '.proto': '📦',
  '.txt': '📄', '.env': '🔒', '.cfg': '⚙️', '.ini': '⚙️', '.toml': '⚙️'
};

function getFileIcon(filename) {
  const extIdx = filename.lastIndexOf('.');
  if (extIdx === -1) return '📄';
  const ext = filename.substring(extIdx).toLowerCase();
  return FILE_ICON_MAP[ext] || '📄';
}

function isBinaryFile(filename) {
  const extIdx = filename.lastIndexOf('.');
  if (extIdx === -1) return false;
  const ext = filename.substring(extIdx).toLowerCase();
  if (SOURCE_EXTENSIONS.includes(ext)) return false;
  if (BINARY_EXTENSIONS.includes(ext)) return true;
  return false;
}

// ============================================================
// 文件管理悬浮框
// ============================================================

let fileManagerKnowledgeId = null;

function openFileManager(knowledgeId) {
  fileManagerKnowledgeId = knowledgeId;
  const overlay = document.getElementById('fileManagerOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  refreshFileManagerTree();
}

function closeFileManager() {
  const overlay = document.getElementById('fileManagerOverlay');
  if (overlay) overlay.classList.add('hidden');
  fileManagerKnowledgeId = null;
}

async function refreshFileManagerTree() {
  const treeEl = document.getElementById('fileManagerTree');
  if (!treeEl || !fileManagerKnowledgeId) return;

  const items = await loadKnowledgeItems();
  const item = items.find(p => p.id === fileManagerKnowledgeId);
  const rootName = item ? item.displayName : 'root';

  const tree = await TreeCacheManager.getTree(fileManagerKnowledgeId);
  if (!tree || !tree.children || (Object.keys(tree.children).length === 0 && !tree.children._files)) {
    treeEl.innerHTML = '<div class="file-tree-empty">' + t('knowledge.noFiles') + '</div>';
    return;
  }

  treeEl.innerHTML = '';

  const rootUl = document.createElement('ul');
  rootUl.className = 'file-tree-list';

  const rootLi = document.createElement('li');
  rootLi.className = 'file-tree-item file-tree-collapsed';

  const rootRow = document.createElement('div');
  rootRow.className = 'file-mgr-row';

  const rootDirSpan = document.createElement('span');
  rootDirSpan.className = 'file-tree-dir';
  rootDirSpan.innerHTML = '<span class="file-tree-dir-icon">📁</span> ' + rootName + '/';
  rootRow.appendChild(rootDirSpan);

  const rootActions = document.createElement('span');
  rootActions.className = 'file-mgr-actions';

  const rootAddFileBtn = document.createElement('button');
  rootAddFileBtn.className = 'file-mgr-btn';
  rootAddFileBtn.title = t('knowledge.addFileToFolder');
  rootAddFileBtn.textContent = '+';
  rootAddFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleAddFileToFolder(fileManagerKnowledgeId, '');
  });
  rootActions.appendChild(rootAddFileBtn);

  rootRow.appendChild(rootActions);
  rootLi.appendChild(rootRow);

  rootDirSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    const isCollapsed = rootLi.classList.contains('file-tree-collapsed');
    if (isCollapsed) {
      rootLi.classList.remove('file-tree-collapsed');
      rootLi.classList.add('file-tree-expanded');
      rootDirSpan.querySelector('.file-tree-dir-icon').textContent = '📂';
    } else {
      rootLi.classList.add('file-tree-collapsed');
      rootLi.classList.remove('file-tree-expanded');
      rootDirSpan.querySelector('.file-tree-dir-icon').textContent = '📁';
    }
  });

  const rootSubContainer = document.createElement('div');
  const childUl = renderFileManagerNode(tree.children, '', fileManagerKnowledgeId);
  rootSubContainer.appendChild(childUl);
  rootLi.appendChild(rootSubContainer);
  rootUl.appendChild(rootLi);

  treeEl.appendChild(rootUl);

  const fileSpans = treeEl.querySelectorAll('.file-tree-file:not(.is-binary)');
  fileSpans.forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const filePath = span.getAttribute('data-file-path');
      if (filePath) openFileModal(fileManagerKnowledgeId, filePath);
    });
  });
}

function renderFileManagerNode(node, basePath, knowledgeId) {
  const ul = document.createElement('ul');
  ul.className = 'file-tree-list';

  const dirs = Object.keys(node).filter(k => k !== '_files').sort();
  const files = (node._files || []).sort();

  for (const dir of dirs) {
    const li = document.createElement('li');
    li.className = 'file-tree-item file-tree-collapsed';

    const row = document.createElement('div');
    row.className = 'file-mgr-row';

    const dirSpan = document.createElement('span');
    dirSpan.className = 'file-tree-dir';
    dirSpan.innerHTML = '<span class="file-tree-dir-icon">📁</span> ' + dir + '/';
    row.appendChild(dirSpan);

    const actions = document.createElement('span');
    actions.className = 'file-mgr-actions';

    const addFileBtn = document.createElement('button');
    addFileBtn.className = 'file-mgr-btn';
    addFileBtn.title = t('knowledge.addFileToFolder');
    addFileBtn.textContent = '+';
    addFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleAddFileToFolder(knowledgeId, basePath ? basePath + '/' + dir : dir);
    });
    actions.appendChild(addFileBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'file-mgr-btn file-mgr-btn-danger';
    deleteBtn.title = t('knowledge.deleteFolder');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteFolder(knowledgeId, basePath ? basePath + '/' + dir : dir);
    });
    actions.appendChild(deleteBtn);

    row.appendChild(actions);
    li.appendChild(row);

    const subContainer = document.createElement('div');
    subContainer.setAttribute('data-node', dir);
    const childUl = renderFileManagerNode(node[dir], (basePath ? basePath + '/' : '') + dir, knowledgeId);
    subContainer.appendChild(childUl);
    li.appendChild(subContainer);

    dirSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCollapsed = li.classList.contains('file-tree-collapsed');
      if (isCollapsed) {
        li.classList.remove('file-tree-collapsed');
        li.classList.add('file-tree-expanded');
        dirSpan.querySelector('.file-tree-dir-icon').textContent = '📂';
      } else {
        li.classList.add('file-tree-collapsed');
        li.classList.remove('file-tree-expanded');
        dirSpan.querySelector('.file-tree-dir-icon').textContent = '📁';
      }
    });

    ul.appendChild(li);
  }

  for (const file of files) {
    const li = document.createElement('li');
    li.className = 'file-tree-item';

    const row = document.createElement('div');
    row.className = 'file-mgr-row';

    const fullPath = (basePath ? basePath + '/' : '') + file;
    const binary = isBinaryFile(file);

    const fileSpan = document.createElement('span');
    fileSpan.className = 'file-tree-file' + (binary ? ' is-binary' : '');
    fileSpan.textContent = getFileIcon(file) + ' ' + file;
    fileSpan.setAttribute('data-file-path', fullPath);
    row.appendChild(fileSpan);

    const actions = document.createElement('span');
    actions.className = 'file-mgr-actions';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'file-mgr-btn file-mgr-btn-danger';
    deleteBtn.title = t('knowledge.deleteFile');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteFile(knowledgeId, fullPath);
    });
    actions.appendChild(deleteBtn);

    row.appendChild(actions);
    li.appendChild(row);

    ul.appendChild(li);
  }

  return ul;
}

async function handleDeleteFile(knowledgeId, filePath) {
  if (!confirm(t('knowledge.confirmDeleteFile', { path: filePath }))) return;

  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    store.delete(knowledgeId + '::' + filePath);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  await rebuildTreeFromFiles(knowledgeId);
  refreshFileManagerTree();
  refreshKnowledgeCardCount(knowledgeId);
}

async function handleDeleteFolder(knowledgeId, folderPath) {
  if (!confirm(t('knowledge.confirmDeleteFolder', { path: folderPath }))) return;

  const allFiles = await FileCacheManager.getFilesByKnowledge(knowledgeId);
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    for (const file of allFiles) {
      if (file.path === folderPath || file.path.startsWith(folderPath + '/')) {
        store.delete(file.id);
      }
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  await rebuildTreeFromFiles(knowledgeId);
  refreshFileManagerTree();
  refreshKnowledgeCardCount(knowledgeId);
}

async function handleAddFileToFolder(knowledgeId, folderPath) {
  const input = document.getElementById('knowledgeFileInput');
  if (!input) return;

  const files = await new Promise((resolve) => {
    input.value = '';
    input.onchange = (e) => resolve(Array.from(e.target.files));
    input.click();
  });

  if (files.length === 0) return;

  const processedFiles = [];
  for (const file of files) {
    file._relativePath = folderPath ? folderPath + '/' + file.name : file.name;
    processedFiles.push(file);
  }

  const sourceFiles = [];
  const newPaths = [];
  for (const f of processedFiles) {
    const path = f._relativePath;
    if (!isSourceFile(path)) continue;
    sourceFiles.push({ file: f, path });
    newPaths.push(path);
  }

  const contentFiles = [];
  for (const sf of sourceFiles) {
    try {
      const content = await readFileAsText(sf.file);
      contentFiles.push({ path: sf.path, content, updatedAt: Date.now() });
    } catch {}
  }

  if (contentFiles.length > 0) {
    await FileCacheManager.addFiles(knowledgeId, contentFiles);
  }

  await rebuildTreeFromFiles(knowledgeId);
  refreshFileManagerTree();
  refreshKnowledgeCardCount(knowledgeId);
}

async function rebuildTreeFromFiles(knowledgeId) {
  const allFiles = await FileCacheManager.getFilesByKnowledge(knowledgeId);
  const allPaths = allFiles.map(f => f.path);
  const tree = { root: '', children: buildTreeStructure(allPaths) };
  await TreeCacheManager.saveTree(knowledgeId, tree);
}

async function refreshKnowledgeCardCount(knowledgeId) {
  const count = await FileCacheManager.getKnowledgeFilesCount(knowledgeId);
  await updateKnowledgeItem(knowledgeId, { fileCount: count });
  const card = document.querySelector('.knowledge-card[data-knowledge-id="' + knowledgeId + '"]');
  if (card) {
    const countEl = card.querySelector('.knowledge-card-count');
    if (countEl) countEl.textContent = count + ' ' + t('knowledge.fileCount');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fmOverlay = document.getElementById('fileManagerOverlay');
  if (fmOverlay) {
    fmOverlay.querySelector('.file-manager-close').addEventListener('click', closeFileManager);
    fmOverlay.addEventListener('click', (e) => {
      if (e.target === fmOverlay) closeFileManager();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const fmOv = document.getElementById('fileManagerOverlay');
      if (fmOv && !fmOv.classList.contains('hidden')) {
        closeFileManager();
        return;
      }
    }
  });
});

// ============================================================
// 文件内容模态框
// ============================================================

async function openFileModal(knowledgeId, filePath) {
  const file = await FileCacheManager.getFile(knowledgeId, filePath);
  const overlay = document.getElementById('fileModalOverlay');
  const pathEl = overlay.querySelector('.file-modal-path');
  const contentEl = overlay.querySelector('.file-modal-content');

  if (!file) {
    contentEl.textContent = t('knowledge.fileNotCached');
    pathEl.textContent = filePath;
    overlay.classList.remove('hidden');
    return;
  }

  pathEl.textContent = filePath;
  let content = file.content;
  const MAX_CHARS = 8000;
  if (content.length > MAX_CHARS) {
    content = content.substring(0, MAX_CHARS);
    content += '\n\n' + t('knowledge.contentTruncated', { len: file.content.length });
  }
  contentEl.textContent = content;
  overlay.classList.remove('hidden');
}

function closeFileModal() {
  const overlay = document.getElementById('fileModalOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.querySelector('.file-modal-content').textContent = '';
    overlay.querySelector('.file-modal-path').textContent = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('fileModalOverlay');
  if (overlay) {
    overlay.querySelector('.file-modal-close').addEventListener('click', closeFileModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeFileModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const ov = document.getElementById('fileModalOverlay');
      if (ov && !ov.classList.contains('hidden')) {
        closeFileModal();
      }
    }
  });
});

// ============================================================
// 知识管理 UI
// ============================================================

function initKnowledgeManager() {
  renderKnowledgeList();
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function renderKnowledgeList() {
  const listEl = document.getElementById('knowledgeList');
  if (!listEl) return;
  const items = await loadKnowledgeItems();

  if (items.length === 0) {
    listEl.innerHTML = '<div class="empty-hint">' + t('knowledge.emptyHint') + '</div>';
  } else {
    listEl.innerHTML = '';
    for (const item of items) {
      listEl.appendChild(createKnowledgeCard(item));
    }
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createKnowledgeCard(item) {
  const card = document.createElement('div');
  card.className = 'knowledge-card';
  if (item.type === 'memory') {
    card.classList.add('knowledge-card--memory');
  }
  if (item.type === 'output') {
    card.classList.add('knowledge-card--output');
  }
  if (item.type === 'user_submit') {
    card.classList.add('knowledge-card--user-submit');
  }
  card.setAttribute('data-knowledge-id', item.id);

  const isMemory = item.type === 'memory';
  const isOutput = item.type === 'output';
  const isUserSubmit = item.type === 'user_submit';
  const displayName = isMemory ? '🧠 记忆' : (isOutput ? '📦 工作产物' : (isUserSubmit ? '📤 用户聊天提交文件' : escapeHtml(item.displayName)));

  card.innerHTML = `
    <div class="knowledge-card-header">
      <span class="knowledge-card-name" data-action="edit-name">${displayName}</span>
      <button class="knowledge-card-delete" data-action="delete" title="${t('knowledge.delete')}">✕</button>
    </div>
    <div class="knowledge-card-desc" data-action="edit-desc">
      <span class="knowledge-card-desc-text">${item.description ? escapeHtml(item.description) : (isMemory ? '暂无记忆，完成 AI 对话后将自动生成' : (isOutput ? '暂无产物，AI 工作后将自动生成' : (isUserSubmit ? '用户在聊天中提交的文件' : '<span class="knowledge-card-desc-placeholder">' + t('knowledge.noDescription') + '</span>')))}</span>
    </div>
    <div class="knowledge-card-meta">
      <span class="knowledge-card-time">${formatTime(item.createdAt)}</span>
      <span class="knowledge-card-count">${isMemory ? '记忆: ' + (item.fileCount || 0) + '个文件 / ' + (item.domainCount || 0) + '个域名' : (isOutput ? '产物: ' + (item.fileCount || 0) + '个文件' : (isUserSubmit ? '提交: ' + (item.fileCount || 0) + '个文件' : (item.fileCount || 0) + ' ' + t('knowledge.fileCount')))}</span>
    </div>
    <div class="knowledge-card-actions">
      <button class="knowledge-card-file-btn" data-action="manage-files">${t('knowledge.fileTree')}</button>
    </div>
  `;

  const nameEl = card.querySelector('.knowledge-card-name');
  if (!isMemory && !isOutput && !isUserSubmit) {
    nameEl.addEventListener('click', () => startEditName(item.id, nameEl));
  }

  const descEl = card.querySelector('.knowledge-card-desc');
  if (!isMemory && !isOutput && !isUserSubmit) {
    descEl.addEventListener('click', () => startEditDesc(item.id, descEl));
  }

  card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMemory) {
      handleDeleteMemory();
    } else if (isOutput) {
      handleDeleteOutput();
    } else if (isUserSubmit) {
      handleDeleteUserSubmit();
    } else {
      handleDeleteKnowledge(item);
    }
  });

  const fileBtn = card.querySelector('[data-action="manage-files"]');
  if (fileBtn) {
    fileBtn.addEventListener('click', () => openFileManager(item.id));
  }

  return card;
}

async function startEditName(knowledgeId, nameEl) {
  const currentName = nameEl.textContent;
  const input = document.createElement('input');
  input.className = 'knowledge-card-name-input';
  input.value = currentName;
  input.setAttribute('data-knowledge-id', knowledgeId);

  nameEl.replaceWith(input);
  input.focus();
  input.select();

  async function finishEdit() {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      try {
        await updateKnowledgeItem(knowledgeId, { displayName: newName });
      } catch {}
    }
    const restoreEl = document.createElement('span');
    restoreEl.className = 'knowledge-card-name';
    restoreEl.setAttribute('data-action', 'edit-name');
    restoreEl.textContent = newName || currentName;
    restoreEl.addEventListener('click', () => startEditName(knowledgeId, restoreEl));
    input.replaceWith(restoreEl);
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') {
      e.preventDefault();
      const restoreEl = document.createElement('span');
      restoreEl.className = 'knowledge-card-name';
      restoreEl.setAttribute('data-action', 'edit-name');
      restoreEl.textContent = currentName;
      restoreEl.addEventListener('click', () => startEditName(knowledgeId, restoreEl));
      input.replaceWith(restoreEl);
    }
  });
}

async function startEditDesc(knowledgeId, descEl) {
  // 防重入：如果已在编辑中（textarea 已存在），不再重复创建
  if (descEl.querySelector('.knowledge-card-desc-input')) return;

  const items = await loadKnowledgeItems();
  const item = items.find(p => p.id === knowledgeId);
  if (!item) return;

  const textEl = descEl.querySelector('.knowledge-card-desc-text');
  const currentDesc = (item.description || '');

  const input = document.createElement('textarea');
  input.className = 'knowledge-card-desc-input';
  input.value = currentDesc;
  input.placeholder = t('knowledge.descriptionPlaceholder');
  input.setAttribute('data-knowledge-id', knowledgeId);

  if (textEl) textEl.replaceWith(input);
  else descEl.appendChild(input);
  input.focus();

  async function finishEdit() {
    const newDesc = input.value.trim().slice(0, 200);
    if (newDesc !== currentDesc) {
      try {
        await updateKnowledgeItem(knowledgeId, { description: newDesc });
      } catch {}
    }
    const restoreEl = document.createElement('span');
    restoreEl.className = 'knowledge-card-desc-text';
    restoreEl.innerHTML = newDesc ? escapeHtml(newDesc) : '<span class="knowledge-card-desc-placeholder">' + t('knowledge.noDescription') + '</span>';
    input.replaceWith(restoreEl);
  }

  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      const restoreEl = document.createElement('span');
      restoreEl.className = 'knowledge-card-desc-text';
      restoreEl.innerHTML = currentDesc ? escapeHtml(currentDesc) : '<span class="knowledge-card-desc-placeholder">' + t('knowledge.noDescription') + '</span>';
      input.replaceWith(restoreEl);
    }
  });
}

async function handleDeleteKnowledge(item) {
  if (!confirm(t('knowledge.confirmDelete', { name: item.displayName }))) return;

  await FileCacheManager.deleteKnowledgeFiles(item.id).catch(() => {});
  await TreeCacheManager.deleteTree(item.id).catch(() => {});
  await deleteKnowledgeItem(item.id);
  renderKnowledgeList();
}

async function handleDeleteMemory() {
  if (!confirm('确定清空所有记忆文件并删除记忆卡片吗？')) return;
  if (typeof deleteMemoryCard === 'function') {
    await deleteMemoryCard();
  }
  renderKnowledgeList();
}

async function handleDeleteOutput() {
  if (!confirm('确定清空所有工作产物文件并删除产物卡片吗？')) return;
  if (typeof deleteOutputCard === 'function') {
    await deleteOutputCard();
  }
  renderKnowledgeList();
}

async function handleDeleteUserSubmit() {
  if (!confirm('确定清空所有用户提交文件并删除卡片吗？')) return;
  if (typeof deleteUserSubmitCard === 'function') {
    await deleteUserSubmitCard();
  }
  renderKnowledgeList();
}

// ============================================================
// 导入对话框和进度卡片
// ============================================================

function showAddKnowledgeDialog() {
  const picker = document.getElementById('knowledgePicker');
  if (picker) picker.classList.remove('hidden');
}

function hideAddKnowledgeDialog() {
  const picker = document.getElementById('knowledgePicker');
  if (picker) picker.classList.add('hidden');
}

async function handlePickFiles() {
  hideAddKnowledgeDialog();
  const input = document.getElementById('knowledgeFileInput');
  if (!input) return;

  const files = await new Promise((resolve) => {
    input.value = '';
    input.onchange = (e) => resolve(Array.from(e.target.files));
    input.click();
  });

  if (files.length === 0) return;
  const displayName = files[0].name || t('knowledge.defaultName');
  await doImportFiles(files, displayName);
}

async function handlePickFolder() {
  hideAddKnowledgeDialog();

  if (typeof window.showDirectoryPicker === 'function') {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = await readDirectoryRecursive(dirHandle, '');
      const dirName = dirHandle.name;

      if (files.length === 0) {
        alert(t('knowledge.noFiles'));
        return;
      }

      await doImportFiles(files, dirName || t('knowledge.defaultName'));
      return;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[handlePickFolder] error:', err);
      }
      return;
    }
  }

  const folderInput = document.getElementById('knowledgeFolderInput');
  if (!folderInput) {
    handlePickFiles();
    return;
  }

  try {
    const files = await new Promise((resolve) => {
      folderInput.value = '';
      folderInput.onchange = (e) => resolve(Array.from(e.target.files));
      folderInput.click();
    });

    if (files.length === 0) return;
    var firstPath = files[0].webkitRelativePath || files[0].name;
    var dirName = firstPath.indexOf('/') !== -1 ? firstPath.split('/')[0] : '';

    if (!dirName) {
      handlePickFiles();
      return;
    }

    await doImportFiles(files, dirName || t('knowledge.defaultName'));
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[handlePickFolder] error:', err);
    }
  }
}

async function readDirectoryRecursive(dirHandle, basePath) {
  const files = [];

  for await (const [name, handle] of dirHandle.entries()) {
    const fullPath = basePath ? basePath + '/' + name : name;

    if (handle.kind === 'file') {
      const file = await handle.getFile();
      file._relativePath = fullPath;
      files.push(file);
    } else if (handle.kind === 'directory') {
      if (shouldSkipDirectory(fullPath)) continue;
      const subFiles = await readDirectoryRecursive(handle, fullPath);
      files.push(...subFiles);
    }
  }

  return files;
}

function createImportProgressCard(knowledgeId, displayName) {
  const card = document.createElement('div');
  card.className = 'knowledge-card';
  card.id = 'importCard-' + knowledgeId;
  card.innerHTML = `
    <div class="knowledge-card-header">
      <span class="knowledge-card-name">${escapeHtml(displayName)}</span>
      <span class="knowledge-card-status-importing">${t('knowledge.importingLabel')}</span>
    </div>
    <div class="import-progress">
      <div class="progress-bar">
        <div class="progress-fill" style="width:0%"></div>
      </div>
      <div class="progress-text">${t('knowledge.preparing')}</div>
    </div>
  `;
  return card;
}

function updateImportProgressCard(knowledgeId, loaded, total, message) {
  const card = document.getElementById('importCard-' + knowledgeId);
  if (!card) return;
  const fill = card.querySelector('.progress-fill');
  const text = card.querySelector('.progress-text');
  const pct = total > 0 ? Math.floor((loaded / total) * 100) : 0;
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = message;
}

function removeImportProgressCard(knowledgeId) {
  const card = document.getElementById('importCard-' + knowledgeId);
  if (card) card.remove();
}

async function doImportFiles(files, displayName) {
  const knowledgeId = generateKnowledgeId();
  const item = {
    id: knowledgeId,
    displayName,
    description: '',
    createdAt: Date.now(),
    fileCount: 0
  };

  await addKnowledgeItem(item);

  const listEl = document.getElementById('knowledgeList');
  const emptyHint = listEl.querySelector('.empty-hint');
  if (emptyHint) emptyHint.remove();
  listEl.insertBefore(createImportProgressCard(knowledgeId, displayName), listEl.firstChild);

  const result = await importFiles(files, knowledgeId, (progress) => {
    updateImportProgressCard(knowledgeId, progress.loaded, progress.total, progress.message);
  });

  await updateKnowledgeItem(knowledgeId, { fileCount: result.fileCount });

  setTimeout(() => {
    removeImportProgressCard(knowledgeId);
    renderKnowledgeList();
  }, 1500);
}

// UI Event Bindings
document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addKnowledgeBtn');
  if (addBtn) addBtn.addEventListener('click', showAddKnowledgeDialog);

  const pickFilesBtn = document.getElementById('pickerPickFilesBtn');
  if (pickFilesBtn) pickFilesBtn.addEventListener('click', handlePickFiles);

  const pickFolderBtn = document.getElementById('pickerPickFolderBtn');
  if (pickFolderBtn) pickFolderBtn.addEventListener('click', handlePickFolder);

  const pickerCloseBtn = document.getElementById('pickerCloseBtn');
  if (pickerCloseBtn) pickerCloseBtn.addEventListener('click', hideAddKnowledgeDialog);

  const pickerOverlay = document.getElementById('knowledgePicker');
  if (pickerOverlay) {
    pickerOverlay.addEventListener('click', (e) => {
      if (e.target === pickerOverlay) hideAddKnowledgeDialog();
    });
  }
});

// ============================================================
// AI 上下文工具函数 (供 chat.js 调用)
// ============================================================

async function searchProjectCode(knowledgeId, keyword) {
  const items = await loadKnowledgeItems();
  const item = items.find(p => p.id === knowledgeId);
  if (!item) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: knowledgeId }) });

  const results = await FileCacheManager.searchFiles(item.id, keyword);
  if (results.length === 0) {
    return JSON.stringify({ message: t('aiContext.noMatch'), results: [] });
  }

  const fileCount = await FileCacheManager.getKnowledgeFilesCount(item.id);
  let output = t('aiContext.searchResultHeader', { name: item.displayName, keyword: keyword, count: fileCount }) + '\n\n';

  for (const r of results) {
    output += `### ${r.filePath}:${r.lineNumber}\n\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
  }

  if (results.length >= 5) {
    output += t('aiContext.searchTruncated');
  }

  return output;
}

async function getProjectFile(knowledgeId, filePath) {
  const items = await loadKnowledgeItems();
  const item = items.find(p => p.id === knowledgeId);
  if (!item) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: knowledgeId }) });

  const file = await FileCacheManager.getFile(item.id, filePath);
  if (!file) return JSON.stringify({ error: t('aiContext.fileNotCached', { path: filePath }) });

  let content = file.content;
  const MAX_CHARS = 8000;
  if (content.length > MAX_CHARS) {
    content = content.substring(0, MAX_CHARS);
    content += '\n\n' + t('knowledge.contentTruncated', { len: file.content.length });
  }

  return `### ${item.displayName}/${filePath}\n\n\`\`\`\n${content}\n\`\`\``;
}

async function listProjectFiles(knowledgeId, directoryPath, depth) {
  const items = await loadKnowledgeItems();
  const item = items.find(p => p.id === knowledgeId);
  if (!item) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: knowledgeId }) });
  directoryPath = directoryPath || '';

  const files = await FileCacheManager.getFilesByKnowledge(item.id);

  let filtered = files;
  if (directoryPath) {
    filtered = files.filter(f => f.path.startsWith(directoryPath + '/') || f.path === directoryPath);
  }

  const tree = {};
  for (const file of filtered) {
    let relativePath = file.path;
    if (directoryPath && relativePath.startsWith(directoryPath + '/')) {
      relativePath = relativePath.substring(directoryPath.length + 1);
    }

    const parts = relativePath.split('/');
    if (parts.length > depth) {
      const prefix = parts.slice(0, depth).join('/');
      if (!tree[prefix + '/...']) {
        tree[prefix + '/...'] = true;
      }
      continue;
    }

    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        if (!current._f) current._f = [];
        current._f.push(parts[i]);
      } else {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
    }
  }

  const lines = [];
  function printNode(node, prefix) {
    const dirs = Object.keys(node).filter(k => k !== '_f').sort();
    const files = (node._f || []).sort();

    for (const dir of dirs) {
      lines.push(prefix + '├── ' + dir + '/');
      printNode(node[dir], prefix + '│   ');
    }
    for (let i = 0; i < files.length; i++) {
      const p = (i === files.length - 1 && dirs.length === 0) ? '└── ' : '├── ';
      lines.push(prefix + p + files[i]);
    }
  }
  printNode(tree, '');

  if (lines.length > 500) {
    lines.splice(500);
    lines.push(t('knowledge.treeTruncated', { count: filtered.length }));
  }

  const rootLabel = directoryPath || t('knowledge.rootDir');
  return `### ${item.displayName}/${rootLabel} (${t('knowledge.depthLabel', { n: depth })})\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``;
}
