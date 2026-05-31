// ============================================================
// 资源管理 - 项目配置、Git同步、代码缓存
// ============================================================

const PROJECTS_KEY = 'ai_helper_git_projects';
const DB_NAME = 'ai_helper_code_cache';
const DB_VERSION = 2;

const SOURCE_EXTENSIONS = [
  '.js', '.ts', '.tsx', '.jsx', '.vue', '.java', '.xml', '.json',
  '.yaml', '.yml', '.md', '.css', '.scss', '.less', '.html',
  '.py', '.go', '.rs', '.sql', '.properties', '.gradle', '.proto'
];

const SKIP_DIRS = [
  'node_modules', 'dist', 'build', '.git', 'target', 'vendor',
  '__pycache__', '.idea', '.vscode', '.svn', 'coverage', '.nyc_output'
];

const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2',
  '.ttf', '.eot', '.mp4', '.mp3', '.webm', '.pdf', '.zip', '.tar', '.gz'
];

const MAX_SYNC_CONCURRENCY = 3;

// ============================================================
// Group 2: 项目配置数据层
// ============================================================

function generateId() {
  return 'proj_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

function parseGitUrl(gitUrl) {
  let cleaned = gitUrl.trim();

  let url = cleaned;
  let platform = 'unknown';

  if (cleaned.startsWith('https://') || cleaned.startsWith('http://')) {
    const parsed = new URL(cleaned);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('github.com')) platform = 'github';
    else if (host.includes('gitlab')) platform = 'gitlab';
    else if (host.includes('bitbucket')) platform = 'bitbucket';
    else if (host.includes('gitee.com')) platform = 'gitee';
    url = cleaned;
  } else if (cleaned.startsWith('ssh://')) {
    const match = cleaned.match(/^ssh:\/\/[^@]+@([^:]+):\d+\/(.+)$/);
    if (match) {
      url = 'https://' + match[1] + '/' + match[2];
      const host = match[1].toLowerCase();
      if (host.includes('github.com')) platform = 'github';
      else if (host.includes('gitlab')) platform = 'gitlab';
      else if (host.includes('bitbucket')) platform = 'bitbucket';
      else if (host.includes('gitee.com')) platform = 'gitee';
    }
  } else if (cleaned.startsWith('git@')) {
    const match = cleaned.match(/^git@([^:]+):(.+)$/);
    if (match) {
      url = 'https://' + match[1] + '/' + match[2];
      const host = match[1].toLowerCase();
      if (host.includes('github.com')) platform = 'github';
      else if (host.includes('gitlab')) platform = 'gitlab';
      else if (host.includes('bitbucket')) platform = 'bitbucket';
      else if (host.includes('gitee.com')) platform = 'gitee';
    }
  }

  return { url, platform };
}

function validateProjectConfig(name, gitUrl, authType, credential, isEdit, description) {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = t('resource.validation.nameRequired');
  } else if (name.trim().length > 100) {
    errors.name = t('resource.validation.nameTooLong');
  } else if (!/^[a-zA-Z0-9][-a-zA-Z0-9_.]*$/.test(name.trim())) {
    errors.name = t('resource.validation.nameFormat');
  }

  if (!gitUrl || !gitUrl.trim()) {
    errors.gitUrl = t('resource.validation.gitUrlRequired');
  } else {
    const trimmed = gitUrl.trim();
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://') &&
        !trimmed.startsWith('ssh://') && !trimmed.startsWith('git@')) {
      errors.gitUrl = t('resource.validation.gitUrlInvalid');
    }
  }

  if (description && description.trim().length > 100) {
    errors.description = t('resource.validation.descriptionTooLong');
  }

  if (!isEdit) {
    if (!credential || (!credential.password && !credential.username)) {
      errors.credential = t('resource.validation.passwordRequired');
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

async function loadProjects() {
  try {
    const result = await chrome.storage.local.get(PROJECTS_KEY);
    return result[PROJECTS_KEY] || [];
  } catch {
    return [];
  }
}

async function saveProjects(projects) {
  try {
    await chrome.storage.local.set({ [PROJECTS_KEY]: projects });
  } catch {
    throw new Error(t('resource.validation.saveFailed'));
  }
}

async function addProject(name, gitUrl, authType, credential, branch, description) {
  const projects = await loadProjects();
  const project = {
    id: generateId(),
    name: name.trim(),
    gitUrl: gitUrl.trim(),
    authType,
    credential: { ...credential },
    branch: branch ? branch.trim() : '',
    description: description ? description.trim() : '',
    createdAt: Date.now(),
    lastSyncAt: null,
    syncStatus: 'pending'
  };
  projects.push(project);
  await saveProjects(projects);
  return project;
}

async function updateProject(projectId, updates) {
  const projects = await loadProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) throw new Error(t('resource.projectNotFound'));

  const existing = projects[idx];
  projects[idx] = {
    ...existing,
    name: updates.name !== undefined ? updates.name : existing.name,
    gitUrl: updates.gitUrl !== undefined ? updates.gitUrl : existing.gitUrl,
    authType: updates.authType !== undefined ? updates.authType : existing.authType,
    credential: updates.credential ? { ...updates.credential } : existing.credential,
    branch: updates.branch !== undefined ? updates.branch : existing.branch,
    description: updates.description !== undefined ? updates.description : existing.description,
  };
  await saveProjects(projects);
  return projects[idx];
}

async function deleteProject(projectId) {
  const projects = await loadProjects();
  const filtered = projects.filter(p => p.id !== projectId);
  await saveProjects(filtered);
}

async function updateProjectSyncStatus(projectId, status, lastSyncAt, lastCommitHash, errorMsg) {
  const projects = await loadProjects();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.syncStatus = status;
    if (lastSyncAt) project.lastSyncAt = lastSyncAt;
    if (lastCommitHash) project.lastCommitHash = lastCommitHash;
    if (errorMsg !== undefined) project.lastSyncError = errorMsg;
    if (status === 'syncing') project.lastSyncError = null;
    await saveProjects(projects);
  }
}

function maskCredential(project) {
  if (project.credential && project.credential.password) {
    return '****';
  }
  return t('resource.notSet');
}

// ============================================================
// Group 3: IndexedDB 缓存层
// ============================================================

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (event.oldVersion < 2) {
        if (database.objectStoreNames.contains('files')) {
          database.deleteObjectStore('files');
        }
        if (database.objectStoreNames.contains('trees')) {
          database.deleteObjectStore('trees');
        }
      }
      if (!database.objectStoreNames.contains('files')) {
        const filesStore = database.createObjectStore('files', { keyPath: 'id' });
        filesStore.createIndex('projectName', 'projectName', { unique: false });
        filesStore.createIndex('path', 'path', { unique: false });
      }
      if (!database.objectStoreNames.contains('trees')) {
        const treesStore = database.createObjectStore('trees', { keyPath: 'projectName' });
        treesStore.createIndex('projectName', 'projectName', { unique: true });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject(new Error(t('resource.dbOpenFailed') + event.target.error.message));
    };
  });
}

const FileCacheManager = {
  async addFiles(projectName, files) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readwrite');
      const store = tx.objectStore('files');

      for (const file of files) {
        store.put({
          id: projectName + '::' + file.path,
          projectName,
          path: file.path,
          content: file.content,
          updatedAt: file.updatedAt || Date.now()
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getFile(projectName, path) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const request = store.get(projectName + '::' + path);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async getFilesByProject(projectName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const index = store.index('projectName');
      const request = index.getAll(projectName);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteProjectFiles(projectName) {
    const database = await openDB();
    const files = await this.getFilesByProject(projectName);
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

  async searchFiles(projectName, keyword) {
    const database = await openDB();
    const files = await this.getFilesByProject(projectName);
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

  async getProjectFilesCount(projectName) {
    const files = await this.getFilesByProject(projectName);
    return files.length;
  }
};

const TreeCacheManager = {
  async saveTree(projectName, tree) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readwrite');
      const store = tx.objectStore('trees');
      store.put({ projectName, tree, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getTree(projectName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readonly');
      const store = tx.objectStore('trees');
      const request = store.get(projectName);
      request.onsuccess = () => resolve(request.result ? request.result.tree : null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteTree(projectName) {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('trees', 'readwrite');
      const store = tx.objectStore('trees');
      store.delete(projectName);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};

// ============================================================
// Group 4: Git 同步引擎 (isomorphic-git)
// ============================================================

function isSourceFile(filePath) {
  const ext = '.' + filePath.split('.').pop().toLowerCase();
  if (BINARY_EXTENSIONS.includes(ext)) return false;
  if (SOURCE_EXTENSIONS.includes(ext)) return true;

  const parts = filePath.split('/');
  for (const part of parts) {
    if (SKIP_DIRS.includes(part)) return false;
  }
  return true;
}

function shouldSkipDirectory(dirName) {
  return SKIP_DIRS.includes(dirName);
}

async function syncProject(projectId, onProgress) {
  const projects = await loadProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) throw new Error(t('resource.projectNotFound'));

  const projectName = project.name;
  console.log('[syncProject] 开始同步:', projectName, 'URL:', project.gitUrl);

  const parsed = parseGitUrl(project.gitUrl);
  const url = parsed.url;
  console.log('[syncProject] 解析 URL:', url, '平台:', parsed.platform);

  onProgress && onProgress({ phase: 'connecting', message: t('resource.syncConnecting'), progress: 5 });

  if (project.lastCommitHash) {
    try {
      const remoteHead = await GitOps.getRemoteHead({ gitUrl: url, authType: project.authType, credential: project.credential });
      if (remoteHead && remoteHead === project.lastCommitHash) {
        console.log('[syncProject] 已是最新代码, commit:', remoteHead);
        onProgress && onProgress({ phase: 'done', message: t('resource.syncUpToDate'), progress: 100 });
        return;
      }
    } catch (e) {
      console.warn('[syncProject] 检查远程HEAD失败，继续全量同步:', e.message);
    }
  }

  onProgress && onProgress({ phase: 'cloning', message: t('resource.syncCloning'), progress: 10 });

  let cloneResult;
  try {
    cloneResult = await GitOps.cloneRepo(
      { gitUrl: url, authType: project.authType, credential: project.credential },
      function(progress) {
        if (progress.phase === 'compressing' || progress.phase === 'counting' || progress.phase === 'receiving' || progress.phase === 'resolving') {
          var pct = progress.total ? Math.min(15 + Math.floor((progress.loaded / progress.total) * 70), 85) : 50;
          var msg = t('resource.syncPulling', { phase: progress.phase || '' });
          if (progress.total) msg += ' (' + progress.loaded + '/' + progress.total + ')';
          onProgress && onProgress({ phase: progress.phase, message: msg, progress: pct });
        }
      }
    );
  } catch (err) {
    console.error('[syncProject] 克隆失败:', err);
    const msg = err.message || t('resource.syncFailed');
    if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Authentication')) {
      throw new Error(t('resource.authFailed'));
    }
    if (msg.includes('fetch') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('NetworkError')) {
      throw new Error(t('resource.cannotConnect'));
    }
    throw new Error(t('resource.syncFailed') + msg);
  }

  const commitHash = cloneResult.commitHash;
  console.log('[syncProject] 克隆完成, commit:', commitHash);

  onProgress && onProgress({ phase: 'extract', message: t('resource.syncExtracting'), progress: 88 });

  let contentFiles;
  try {
    contentFiles = await GitOps.extractSourceFiles({
      fs: cloneResult.fs,
      dir: cloneResult.dir,
      filePaths: cloneResult.filePaths,
      commitHash: commitHash
    }, function(extProgress) {
      var pct = extProgress.total ? Math.min(88 + Math.floor((extProgress.loaded / extProgress.total) * 10), 98) : 90;
      onProgress && onProgress({ phase: 'files', message: extProgress.message, progress: pct });
    });
  } catch (err) {
    console.error('[syncProject] 提取文件失败:', err);
    throw new Error(t('resource.extractFailed') + err.message);
  }

  console.log('[syncProject] 提取完成, 文件数:', contentFiles.length);

  await FileCacheManager.deleteProjectFiles(projectName);
  await FileCacheManager.addFiles(projectName, contentFiles);

  const tree = { root: '', children: buildTreeStructure(cloneResult.filePaths) };
  await TreeCacheManager.saveTree(projectName, tree);

  await updateProjectSyncStatus(projectId, 'synced', Date.now(), commitHash);

  onProgress && onProgress({
    phase: 'done',
    message: t('resource.syncDone', { n: contentFiles.length }),
    progress: 100,
    totalFiles: cloneResult.filePaths.length,
    fetchedFiles: contentFiles.length
  });
}

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

function renderFileTree(node, indent) {
  const lines = [];
  indent = indent || '';

  const dirs = Object.keys(node).filter(k => k !== '_files').sort();
  const files = (node._files || []).sort();

  for (const dir of dirs) {
    lines.push(indent + '├── ' + dir + '/');
    lines.push(...renderFileTree(node[dir], indent + '│   '));
  }

  for (let i = 0; i < files.length; i++) {
    const prefix = (i === files.length - 1 && dirs.length === 0) ? '└── ' : '├── ';
    lines.push(indent + prefix + files[i]);
  }

  return lines;
}

const FILE_ICON_MAP = {
  '.js': '📜', '.ts': '🔷', '.tsx': '🔷', '.jsx': '📜',
  '.vue': '💚', '.json': '📋', '.yaml': '⚙️', '.yml': '⚙️',
  '.md': '📝', '.css': '🎨', '.scss': '🎨', '.less': '🎨',
  '.html': '🌐', '.py': '🐍', '.go': '🔵', '.rs': '🦀',
  '.java': '☕', '.sql': '🗄️', '.xml': '📰',
  '.properties': '⚙️', '.gradle': '🐘', '.proto': '📦'
};

function getFileIcon(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  if (filename.indexOf('.') === -1) return '📄';
  return FILE_ICON_MAP[ext] || '📄';
}

function isBinaryFile(filename) {
  const ext = '.' + filename.split('.').pop().toLowerCase();
  if (filename.indexOf('.') === -1) return false;
  if (SOURCE_EXTENSIONS.includes(ext)) return false;
  if (BINARY_EXTENSIONS.includes(ext)) return true;
  return false;
}

function renderFileTreeNode(node, basePath) {
  const ul = document.createElement('ul');
  ul.className = 'file-tree-list';

  const dirs = Object.keys(node).filter(k => k !== '_files').sort();
  const files = (node._files || []).sort();

  const MAX_FIRST_LEVEL = 50;
  const totalItems = dirs.length + files.length;
  let showMore = false;
  let displayDirs = dirs;
  let displayFiles = files;

  if (!basePath && totalItems > MAX_FIRST_LEVEL) {
    showMore = true;
    if (dirs.length > MAX_FIRST_LEVEL) {
      displayDirs = dirs.slice(0, MAX_FIRST_LEVEL);
      displayFiles = [];
    } else {
      displayDirs = dirs;
      displayFiles = files.slice(0, MAX_FIRST_LEVEL - dirs.length);
    }
  }

  for (const dir of displayDirs) {
    const li = document.createElement('li');
    li.className = 'file-tree-item file-tree-collapsed';

    const dirSpan = document.createElement('span');
    dirSpan.className = 'file-tree-dir';
    dirSpan.innerHTML = '<span class="file-tree-dir-icon">📁</span> ' + dir + '/';
    li.appendChild(dirSpan);

    const subContainer = document.createElement('div');
    subContainer.setAttribute('data-node', dir);
    const childUl = renderFileTreeNode(node[dir], (basePath ? basePath + '/' : '') + dir);
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

  for (const file of displayFiles) {
    const li = document.createElement('li');
    li.className = 'file-tree-item';
    const fullPath = (basePath ? basePath + '/' : '') + file;
    const binary = isBinaryFile(file);

    const fileSpan = document.createElement('span');
    fileSpan.className = 'file-tree-file' + (binary ? ' is-binary' : '');
    fileSpan.textContent = getFileIcon(file) + ' ' + file;
    fileSpan.setAttribute('data-file-path', fullPath);
    li.appendChild(fileSpan);

    ul.appendChild(li);
  }

  if (showMore) {
    const remaining = totalItems - displayDirs.length - displayFiles.length;
    const li = document.createElement('li');
    li.className = 'file-tree-item';
    const moreSpan = document.createElement('span');
    moreSpan.className = 'file-tree-more';
    moreSpan.textContent = t('resource.moreItems', { n: remaining });
    moreSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      moreSpan.textContent = t('resource.loading');
      const fullList = renderFileTreeNode(node, basePath);
      moreSpan.parentElement.replaceWith(fullList);
    });
    li.appendChild(moreSpan);
    ul.appendChild(li);
  }

  return ul;
}

async function loadAndRenderFileTree(projectName, containerEl) {
  const tree = await TreeCacheManager.getTree(projectName);
  if (!tree || !tree.children || (Object.keys(tree.children).length === 0 && !tree.children._files)) {
    containerEl.innerHTML = '<div class="file-tree-empty">' + t('resource.noCachedFiles') + '</div>';
    return;
  }

  containerEl.innerHTML = '';
  const rootUl = renderFileTreeNode(tree.children, '');
  const wrapper = document.createElement('div');
  wrapper.appendChild(rootUl);
  containerEl.appendChild(wrapper);

  const fileSpans = containerEl.querySelectorAll('.file-tree-file:not(.is-binary)');
  fileSpans.forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      const filePath = span.getAttribute('data-file-path');
      if (filePath) {
        openFileModal(projectName, filePath);
      }
    });
  });

  const binarySpans = containerEl.querySelectorAll('.file-tree-file.is-binary');
  binarySpans.forEach(span => {
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      alert(t('resource.binaryNotSupported'));
    });
  });
}

// ============================================================
// Group 5: 资源管理 UI
// ============================================================

let isSyncing = false;

function initResourceManager() {
  renderProjectList();
}

async function renderProjectList() {
  const listEl = document.getElementById('projectList');
  const projects = await loadProjects();

  if (projects.length === 0) {
    listEl.innerHTML = '<div class="empty-hint">' + t('resource.emptyHint') + '</div>';
  } else {
    listEl.innerHTML = '';
    for (const project of projects) {
      listEl.appendChild(createProjectCard(project));
    }
  }
}

function formatTime(timestamp) {
  if (!timestamp) return t('resource.neverSynced');
  const date = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getSyncStatusLabel(status) {
  const map = {
    pending: { text: t('resource.statusPending'), cls: 'sync-pending' },
    syncing: { text: t('resource.statusSyncing'), cls: 'sync-syncing' },
    synced: { text: t('resource.statusSynced'), cls: 'sync-synced' },
    failed: { text: t('resource.statusFailed'), cls: 'sync-failed' }
  };
  return map[status] || map.pending;
}

function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card';
  card.setAttribute('data-project-id', project.id);
  card.setAttribute('data-project-name', project.name);

  const displayUrl = project.gitUrl.length > 40
    ? project.gitUrl.substring(0, 40) + '...'
    : project.gitUrl;

  const status = getSyncStatusLabel(project.syncStatus);
  const credMask = maskCredential(project);

  let descHtml = '';
  if (project.description) {
    const descSummary = project.description.length > 30
      ? project.description.substring(0, 30) + '...'
      : project.description;
    descHtml = `<div class="project-card-desc">${escapeHtml(descSummary)}</div>`;
  }

  card.innerHTML = `
    <div class="project-card-header">
      <span class="project-card-name">${escapeHtml(project.name)}</span>
      <span class="project-card-status ${status.cls}">${status.text}</span>
    </div>
    <div class="project-card-url" title="${escapeHtml(project.gitUrl)}">${escapeHtml(displayUrl)}</div>
    ${descHtml}
    <div class="project-card-info">
      <span>${t('resource.authInfo', { mask: credMask })}${project.branch ? ' | ' + t('resource.branchName') + ': ' + escapeHtml(project.branch) : ''}</span>
    </div>
    <div class="project-card-info">
      <span>${t('resource.lastSync', { time: formatTime(project.lastSyncAt) })}</span>
    </div>
    ${project.syncStatus === 'failed' && project.lastSyncError ? `<div class="project-card-error">${escapeHtml(project.lastSyncError)}</div>` : ''}
    <div class="file-tree-section ${project.syncStatus === 'synced' ? '' : 'hidden'}">
      <button class="file-tree-toggle" data-action="toggle-tree" data-project-name="${escapeHtml(project.name)}">
        <span class="file-tree-arrow">▶</span> ${t('resource.fileTree')}
      </button>
      <div class="file-tree-container hidden" id="fileTree-${escapeHtml(project.name)}"></div>
    </div>
    <div class="project-card-actions">
      <button class="project-btn project-btn-sync" data-action="sync" data-id="${project.id}" ${isSyncing ? 'disabled' : ''}>${t('resource.syncBtn')}</button>
      <button class="project-btn project-btn-edit" data-action="edit" data-id="${project.id}">${t('resource.editBtn')}</button>
      <button class="project-btn project-btn-delete" data-action="delete" data-id="${project.id}">${t('resource.deleteBtn')}</button>
    </div>
    <div class="project-progress hidden" id="progress-${project.id}">
      <div class="progress-bar">
        <div class="progress-fill" style="width:0%"></div>
      </div>
      <div class="progress-text"></div>
    </div>
  `;

  card.querySelector('[data-action="sync"]').addEventListener('click', () => handleSyncProject(project.id));
  card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditForm(project));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => handleDeleteProject(project));

  const toggleBtn = card.querySelector('[data-action="toggle-tree"]');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => toggleFileTree(project.name, toggleBtn, card));
  }

  return card;
}

async function toggleFileTree(projectName, btnEl, cardEl) {
  const arrow = btnEl.querySelector('.file-tree-arrow');
  const container = cardEl.querySelector('#fileTree-' + projectName.replace(/\./g, '\\.'));
  if (!container) return;

  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    if (!container.hasAttribute('data-loaded')) {
      await loadAndRenderFileTree(projectName, container);
      container.setAttribute('data-loaded', 'true');
    }
    container.classList.remove('hidden');
    arrow.classList.add('expanded');
  } else {
    container.classList.add('hidden');
    arrow.classList.remove('expanded');
  }
}

async function openFileModal(projectName, filePath) {
  const file = await FileCacheManager.getFile(projectName, filePath);
  const overlay = document.getElementById('fileModalOverlay');
  const pathEl = overlay.querySelector('.file-modal-path');
  const contentEl = overlay.querySelector('.file-modal-content');

  if (!file) {
    contentEl.textContent = t('resource.fileNotCached');
    pathEl.textContent = filePath;
    overlay.classList.remove('hidden');
    return;
  }

  pathEl.textContent = filePath;
  let content = file.content;
  const MAX_CHARS = 8000;
  if (content.length > MAX_CHARS) {
    content = content.substring(0, MAX_CHARS);
    content += '\n\n' + t('resource.contentTruncated', { len: file.content.length });
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function handleSyncProject(projectId) {
  if (isSyncing) return;
  isSyncing = true;

  await updateProjectSyncStatus(projectId, 'syncing', null);
  refreshProgressUI(projectId);

  const progressEl = document.getElementById('progress-' + projectId);
  if (progressEl) progressEl.classList.remove('hidden');

  try {
    await syncProject(projectId, (progress) => {
      updateProgressUI(projectId, progress);
    });
  } catch (err) {
    console.error('[handleSyncProject] 同步失败:', err);
    await updateProjectSyncStatus(projectId, 'failed', null, null, err.message || t('resource.statusFailed'));
    const progressEl2 = document.getElementById('progress-' + projectId);
    if (progressEl2) {
      const errMsg = (err.message || t('resource.statusFailed')).replace(/\n/g, '<br>');
      progressEl2.querySelector('.progress-text').innerHTML = '<span style="color:#f38ba8">' + t('resource.error') + ' ' + errMsg + '</span>';
    }
  }

  isSyncing = false;
  await renderProjectList();
}

async function handleSyncAll() {
  if (isSyncing) return;
  isSyncing = true;

  const projects = await loadProjects();
  const syncAllBtn = document.getElementById('syncAllBtn');
  syncAllBtn.disabled = true;

  for (const project of projects) {
    await updateProjectSyncStatus(project.id, 'syncing', null);
  }
  await renderProjectList();

  for (const project of projects) {
    const progressEl = document.getElementById('progress-' + project.id);
    if (progressEl) progressEl.classList.remove('hidden');

    try {
      await syncProject(project.id, (progress) => {
        updateProgressUI(project.id, progress);
      });
    } catch (err) {
      console.error('[handleSyncAll] 同步失败:', project.name, err);
      await updateProjectSyncStatus(project.id, 'failed', null, null, err.message || t('resource.statusFailed'));
      const progressEl2 = document.getElementById('progress-' + project.id);
      if (progressEl2) {
        const errMsg = (err.message || t('resource.statusFailed')).replace(/\n/g, '<br>');
      progressEl2.querySelector('.progress-text').innerHTML = '<span style="color:#f38ba8">' + t('resource.error') + ' ' + errMsg + '</span>';
      }
    }
  }

  isSyncing = false;
  syncAllBtn.disabled = false;
  await renderProjectList();
}

function updateProgressUI(projectId, progressData) {
  const progressEl = document.getElementById('progress-' + projectId);
  if (!progressEl) return;

  progressEl.classList.remove('hidden');
  const fill = progressEl.querySelector('.progress-fill');
  const text = progressEl.querySelector('.progress-text');

  if (fill) fill.style.width = progressData.progress + '%';
  if (text) text.textContent = `${progressData.message} (${progressData.progress}%)`;
}

function refreshProgressUI(projectId) {
  const progressEl = document.getElementById('progress-' + projectId);
  if (progressEl) {
    progressEl.classList.remove('hidden');
    progressEl.querySelector('.progress-fill').style.width = '0%';
    progressEl.querySelector('.progress-text').textContent = t('resource.preparingSync');
  }
}

function showAddProjectForm() {
  document.getElementById('projectList').classList.add('hidden');
  document.getElementById('addProjectForm').classList.remove('hidden');
  document.getElementById('editProjectForm').classList.add('hidden');
}

function hideAddProjectForm() {
  document.getElementById('projectList').classList.remove('hidden');
  document.getElementById('addProjectForm').classList.add('hidden');
  document.getElementById('editProjectForm').classList.add('hidden');
}

function handleAddProject() {
  const name = document.getElementById('projectName').value;
  const gitUrl = document.getElementById('projectGitUrl').value;
  const branch = document.getElementById('projectBranch').value;
  const description = document.getElementById('projectDescription').value;
  const authType = 'password';
  const credential = {
    username: document.getElementById('projectUsername').value.trim(),
    password: document.getElementById('projectPassword').value
  };

  const { valid, errors } = validateProjectConfig(name, gitUrl, authType, credential, false, description);

  document.getElementById('projectNameError').textContent = errors.name || '';
  document.getElementById('projectGitUrlError').textContent = errors.gitUrl || '';

  if (!valid) {
    if (errors.credential) {
      alert(errors.credential);
    }
    if (errors.description) {
      document.getElementById('projectDescriptionError').textContent = errors.description;
    }
    return;
  }

  addProject(name, gitUrl, authType, credential, branch, description).then(() => {
    hideAddProjectForm();
    clearAddForm();
    renderProjectList();
  });
}

function clearAddForm() {
  document.getElementById('projectName').value = '';
  document.getElementById('projectGitUrl').value = '';
  document.getElementById('projectBranch').value = '';
  document.getElementById('projectUsername').value = '';
  document.getElementById('projectPassword').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectDescriptionCount').textContent = '0/100';
}

function clearErrors() {
  document.getElementById('projectNameError').textContent = '';
  document.getElementById('projectGitUrlError').textContent = '';
  document.getElementById('projectDescriptionError').textContent = '';
}

async function openEditForm(project) {
  document.getElementById('projectList').classList.add('hidden');
  document.getElementById('addProjectForm').classList.add('hidden');
  document.getElementById('editProjectForm').classList.remove('hidden');

  document.getElementById('editProjectId').value = project.id;
  document.getElementById('editProjectName').value = project.name;
  document.getElementById('editProjectGitUrl').value = project.gitUrl;
  document.getElementById('editProjectBranch').value = project.branch || '';
  document.getElementById('editProjectAuthType').value = 'password';

  document.getElementById('editProjectUsername').value = project.credential.username || '';
  document.getElementById('editProjectPassword').value = '';
  document.getElementById('editProjectPassword').placeholder = t('resource.leaveBlankUnchanged');

  document.getElementById('editProjectDescription').value = project.description || '';
  const descLen = (project.description || '').length;
  document.getElementById('editProjectDescriptionCount').textContent = descLen + '/100';
}

async function handleUpdateProject() {
  const id = document.getElementById('editProjectId').value;
  const name = document.getElementById('editProjectName').value;
  const gitUrl = document.getElementById('editProjectGitUrl').value;
  const branch = document.getElementById('editProjectBranch').value;
  const description = document.getElementById('editProjectDescription').value;
  const authType = 'password';

  let credential = null;
  const password = document.getElementById('editProjectPassword').value;
  if (password) {
    credential = {
      username: document.getElementById('editProjectUsername').value.trim(),
      password
    };
  }

  const { valid, errors } = validateProjectConfig(name, gitUrl, authType, credential || { password: 'placeholder' }, true, description);

  document.getElementById('editProjectNameError').textContent = errors.name || '';
  document.getElementById('editProjectGitUrlError').textContent = errors.gitUrl || '';

  if (!valid) {
    if (errors.description) {
      document.getElementById('editProjectDescriptionError').textContent = errors.description;
    }
    return;
  }

  const updates = { name, gitUrl, authType, branch: branch.trim(), description: description.trim() };
  if (credential) updates.credential = credential;

  await updateProject(id, updates);
  hideAddProjectForm();
  clearEditErrors();
  renderProjectList();
}

function clearEditErrors() {
  document.getElementById('editProjectNameError').textContent = '';
  document.getElementById('editProjectGitUrlError').textContent = '';
  document.getElementById('editProjectDescriptionError').textContent = '';
}

async function handleDeleteProject(project) {
  if (!confirm(t('resource.confirmDelete', { name: project.name }) + '\n\n' + t('resource.deleteConfirmDetail'))) return;

  await FileCacheManager.deleteProjectFiles(project.name).catch(() => {});
  await TreeCacheManager.deleteTree(project.name).catch(() => {});
  await deleteProject(project.id);
  renderProjectList();
}

// UI Event Bindings
document.addEventListener('DOMContentLoaded', () => {
  const syncAllBtn = document.getElementById('syncAllBtn');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const cancelProjectBtn = document.getElementById('cancelProjectBtn');
  const updateProjectBtn = document.getElementById('updateProjectBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (syncAllBtn) syncAllBtn.addEventListener('click', handleSyncAll);
  if (addProjectBtn) addProjectBtn.addEventListener('click', showAddProjectForm);
  if (saveProjectBtn) saveProjectBtn.addEventListener('click', handleAddProject);
  if (cancelProjectBtn) cancelProjectBtn.addEventListener('click', () => {
    hideAddProjectForm();
    clearErrors();
    clearAddForm();
  });
  if (updateProjectBtn) updateProjectBtn.addEventListener('click', handleUpdateProject);
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => {
    hideAddProjectForm();
    clearEditErrors();
  });

  const descInput = document.getElementById('projectDescription');
  if (descInput) {
    descInput.addEventListener('input', () => {
      const len = descInput.value.length;
      const countEl = document.getElementById('projectDescriptionCount');
      countEl.textContent = len + '/100';
      countEl.classList.toggle('over-limit', len > 100);
    });
  }

  const editDescInput = document.getElementById('editProjectDescription');
  if (editDescInput) {
    editDescInput.addEventListener('input', () => {
      const len = editDescInput.value.length;
      const countEl = document.getElementById('editProjectDescriptionCount');
      countEl.textContent = len + '/100';
      countEl.classList.toggle('over-limit', len > 100);
    });
  }
});

// ============================================================
// AI 上下文工具函数 (供 chat.js 调用)
// ============================================================

async function searchProjectCode(projectName, keyword) {
  const projects = await loadProjects();
  const project = projects.find(p => p.name === projectName);
  if (!project) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: projectName }) });

  const results = await FileCacheManager.searchFiles(project.name, keyword);
  if (results.length === 0) {
    return JSON.stringify({ message: t('aiContext.noMatch'), results: [] });
  }

  const fileCount = await FileCacheManager.getProjectFilesCount(project.name);
  let output = t('aiContext.searchResultHeader', { name: projectName, keyword: keyword, count: fileCount }) + '\n\n';

  for (const r of results) {
    output += `### ${r.filePath}:${r.lineNumber}\n\`\`\`\n${r.snippet}\n\`\`\`\n\n`;
  }

  if (results.length >= 5) {
    output += t('aiContext.searchTruncated');
  }

  return output;
}

async function getProjectFile(projectName, filePath) {
  const projects = await loadProjects();
  const project = projects.find(p => p.name === projectName);
  if (!project) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: projectName }) });

  const file = await FileCacheManager.getFile(project.name, filePath);
  if (!file) return JSON.stringify({ error: t('aiContext.fileNotCached', { path: filePath }) });

  let content = file.content;
  const MAX_CHARS = 8000;
  if (content.length > MAX_CHARS) {
    content = content.substring(0, MAX_CHARS);
    content += '\n\n' + t('resource.contentTruncated', { len: file.content.length });
  }

  return `### ${projectName}/${filePath}\n\n\`\`\`\n${content}\n\`\`\``;
}

async function listProjectFiles(projectName, directoryPath, depth) {
  const projects = await loadProjects();
  const project = projects.find(p => p.name === projectName);
  if (!project) return JSON.stringify({ error: t('aiContext.projectNotFound', { name: projectName }) });
  directoryPath = directoryPath || '';

  const files = await FileCacheManager.getFilesByProject(project.name);

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
    lines.push(t('resource.treeTruncated', { count: filtered.length }));
  }

  const rootLabel = directoryPath || t('resource.rootDir');
  return `### ${projectName}/${rootLabel} (${t('resource.depthLabel', { n: depth })})\n\n\`\`\`\n${lines.join('\n')}\n\`\`\``;
}
