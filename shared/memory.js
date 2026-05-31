// ============================================================
// 记忆管理 - 自动生成、存储、查询
// ============================================================

const MEMORY_KEY = 'ai_helper_memory_item';

let memoryItemCache = null;
let _accessedMemoryPaths = [];
let _sessionGeneratedPaths = [];
let _lastSessionId = null;

async function loadMemoryItem() {
  try {
    const result = await chrome.storage.local.get(MEMORY_KEY);
    return result[MEMORY_KEY] || null;
  } catch {
    return null;
  }
}

async function saveMemoryItem(item) {
  try {
    await chrome.storage.local.set({ [MEMORY_KEY]: item });
    memoryItemCache = item;
  } catch {
    throw new Error('保存记忆卡片失败');
  }
}

function getCurrentHostname() {
  try {
    if (window.__currentTabUrl) {
      const url = new URL(window.__currentTabUrl);
      return (url.hostname || 'general').toLowerCase();
    }
  } catch {}
  return 'general';
}

async function initMemoryCard() {
  if (memoryItemCache) return memoryItemCache;

  let item = await loadMemoryItem();
  if (!item) {
    item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : 'mem_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10)),
      displayName: '记忆',
      type: 'memory',
      description: '',
      createdAt: Date.now(),
      fileCount: 0,
      domainCount: 0
    };
    await saveMemoryItem(item);
  }
  memoryItemCache = item;
  return item;
}

async function getMemoryItem() {
  if (memoryItemCache) return memoryItemCache;
  return loadMemoryItem();
}

function sanitizeFileName(title) {
  var name = title.replace(/[\\/:*?"<>|]/g, '_').substring(0, 80).trim() || '未命名记忆';
  name = name.replace(/\.(md|MD|Md|txt|markdown)$/, '');
  return name;
}

async function saveMemoryFile(hostname, sessionTitle, content, customName) {
  const memoryItem = await initMemoryCard();
  let fileName = sanitizeFileName(customName || sessionTitle);
  var normalizedHost = (hostname || 'general').toLowerCase();

  const files = await FileCacheManager.getFilesByKnowledge(memoryItem.id);
  let finalPath = normalizedHost + '/' + fileName + '.md';

  let maxNum = 0;
  const prefix = normalizedHost + '/' + fileName;
  for (const f of files) {
    if (f.path === prefix + '.md') {
      maxNum = Math.max(maxNum, 1);
    } else if (f.path.startsWith(prefix + '(')) {
      const match = f.path.match(/\((\d+)\)\.md$/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
  }
  if (maxNum > 0) {
    finalPath = normalizedHost + '/' + fileName + '(' + (maxNum + 1) + ').md';
  }

  await FileCacheManager.addFiles(memoryItem.id, [{
    path: finalPath,
    content: content,
    updatedAt: Date.now()
  }]);

  const updatedFiles = await FileCacheManager.getFilesByKnowledge(memoryItem.id);
  const children = buildMemoryTree(updatedFiles);
  const tree = { root: '', children: children };
  await TreeCacheManager.saveTree(memoryItem.id, tree);

  const domains = new Set();
  for (const f of updatedFiles) {
    const d = f.path.split('/')[0];
    if (d) domains.add(d);
  }
  memoryItem.fileCount = updatedFiles.length;
  memoryItem.domainCount = domains.size;
  await saveMemoryItem(memoryItem);

  return finalPath;
}

function buildMemoryTree(files) {
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

async function buildMemoryFileContent(messages, hostname, sessionTitle) {
  console.log('[Memory] buildMemoryFileContent 开始, sessionTitle:', sessionTitle, 'hostname:', hostname, '消息数:', messages.length);
  const summaryPrompt = `请将以下对话总结为一段详细的结构化记忆，用中文输出。在第一行用 \`[FILENAME]: \` 指定一个与对话内容紧密相关的描述性文件名称（不超过30字，不要带文件扩展名）。

在总结中，请尽可能保留对话中出现的具体技术细节，包括：类名、方法签名、API 接口路径、配置参数、数据源名称等，方便后续回查。

格式要求：
[FILENAME]: <描述性文件名>

# <会话标题>

**时间**: ${new Date().toLocaleString('zh-CN')}
**域名**: ${hostname.toLowerCase()}

**用户问题**: <一句话总结用户想解决什么问题>

**解决方案**: <AI给出的关键解决方案摘要，保留具体类名、方法名、API路径等细节>

**关键技术点**: 
- <关键点1，含具体技术细节>
- <关键点2，含具体技术细节>
- <关键点3，含具体技术细节>

**数据来源/调用链路**: 
- <简要描述数据从哪里来、经过哪些模块>

对话内容：
`;
  const conversationText = messages.map(function (m) {
    const role = m.role === 'user' ? '用户' : 'AI';
    let content = m.content || '';
    if (content.length > 6000) content = content.substring(0, 6000) + '...';
    return role + ': ' + content;
  }).join('\n\n');

  const fullPrompt = summaryPrompt + conversationText;

  try {
    const config = typeof loadModelConfig === 'function' ? await loadModelConfig() : null;
    if (!config || !config.apiBaseUrl || !config.apiKey) {
      console.log('[Memory] buildMemoryFileContent 无AI配置, 降级到 fallback');
      return buildFallbackMemory(messages, hostname, sessionTitle);
    }

    const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    const apiUrl = `${baseUrl}/v1/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 30000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [{ role: 'user', content: fullPrompt }],
        stream: false,
        max_tokens: 3200
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return buildFallbackMemory(messages, hostname, sessionTitle);
    }

    const data = await response.json();
    const summary = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    if (summary && summary.trim()) {
      var fileName = sessionTitle;
      var content = summary.trim();
      var firstLineEnd = content.indexOf('\n');
      var firstLine = firstLineEnd > 0 ? content.substring(0, firstLineEnd).trim() : content;
      var match = firstLine.match(/^\[FILENAME\]\s*:\s*(.+)/i);
      if (match && match[1]) {
        fileName = match[1].trim().substring(0, 80);
        content = firstLineEnd > 0 ? content.substring(firstLineEnd + 1).trim() : '';
        if (!content) content = summary.trim();
        console.log('[Memory] AI 生成文件名:', fileName);
      } else {
        console.log('[Memory] 未匹配到 [FILENAME]: 标签，首行:', firstLine.substring(0, 50), '回退用 sessionTitle:', sessionTitle);
      }
      return { fileName: fileName, content: content };
    }

    return buildFallbackMemory(messages, hostname, sessionTitle);
  } catch {
    return buildFallbackMemory(messages, hostname, sessionTitle);
  }
}

function buildFallbackMemory(messages, hostname, sessionTitle) {
  console.log('[Memory] buildFallbackMemory 被调用(无AI配置或API失败), sessionTitle:', sessionTitle);

  const userMsg = messages.filter(function (m) { return m.role === 'user'; }).pop();
  const aiMsg = messages.filter(function (m) { return m.role === 'assistant'; }).pop();

  var fileName = sessionTitle;
  var userText = userMsg ? (userMsg.content || '') : '';
  if (userText && userText.length > 40) {
    fileName = userText.substring(0, 40).replace(/[\r\n]+/g, ' ').trim();
  }

  const userQuestion = userMsg ? (userMsg.content || '').substring(0, 600) : '未知问题';
  const aiAnswer = aiMsg ? (aiMsg.content || '').substring(0, 1500) : '无回答';

  const techKeywords = extractTechKeywords(userQuestion + ' ' + aiAnswer);

  var content = '# ' + sessionTitle + '\n\n' +
    '**时间**: ' + new Date().toLocaleString('zh-CN') + '\n' +
    '**域名**: ' + (hostname || 'general').toLowerCase() + '\n\n' +
    '**用户问题**: ' + userQuestion + '\n' +
    '**解决方案**: ' + aiAnswer + '\n' +
    '**关键技术点**:\n- ' + techKeywords.join('\n- ');

  return { fileName: fileName, content: content };
}

function extractTechKeywords(text) {
  const techTerms = [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'api', 'websocket', 'http', 'rest', 'graphql', 'css', 'html', 'dom',
    'docker', 'kubernetes', 'nginx', 'linux', 'git', 'npm', 'webpack',
    '数据库', '缓存', 'redis', 'mysql', 'mongodb', 'sql',
    '部署', '调试', '测试', '性能', '安全', '认证', '授权',
    '组件', 'hooks', '路由', '状态管理', '表单', '验证',
    '错误处理', '日志', '监控', '异步', '并发', '多线程'
  ];
  const found = [];
  const lower = text.toLowerCase();
  for (const term of techTerms) {
    if (lower.indexOf(term.toLowerCase()) !== -1 && found.length < 5) {
      found.push(term);
    }
  }
  if (found.length === 0) found.push('技术方案');
  return found;
}

async function evaluateMemoryMerge(existingMemories, newContent, hostname) {
  console.log('[Memory] evaluateMemoryMerge 开始, 已有记忆数:', existingMemories.map(function(m){return m.path;}), '新总结长度:', (newContent || '').length);

  try {
    const config = typeof loadModelConfig === 'function' ? await loadModelConfig() : null;
    if (!config || !config.apiBaseUrl || !config.apiKey) {
      console.log('[Memory] evaluateMemoryMerge 无AI配置, 降级到 create');
      return { action: 'create', domain: hostname };
    }

    var promptLines = [];
    promptLines.push('请判断以下"新对话总结"与"已有记忆"的关系，仅回复一个指令：');
    promptLines.push('');
    for (var i = 0; i < existingMemories.length; i++) {
      var mem = existingMemories[i];
      promptLines.push('--- 已有记忆 ' + (i + 1) + ': ' + mem.path + ' ---');
      promptLines.push((mem.content || '').substring(0, 4000));
      promptLines.push('');
    }
    promptLines.push('--- 新对话总结 ---');
    promptLines.push((newContent || '').substring(0, 4000));
    promptLines.push('');
    promptLines.push('回复格式（仅回复一行，不要解释）：');
    promptLines.push('- 如果新对话的**所有具体信息**（类名、方法名、API路径、配置、数据源名称等）都已在已有记忆中，回复: SKIP');
    promptLines.push('- 如果新对话有**新的具体技术细节**（新类名、新API路径、新方法签名等）需要补充，回复: UPDATE: <文件路径>');
    promptLines.push('- 如果新对话是与已有记忆完全无关的新话题，回复: CREATE: <域名>');
    promptLines.push('- 如果是 UPDATE，紧接下一行给出合并优化后的完整 Markdown 内容（保留所有技术细节）');
    promptLines.push('');
    promptLines.push('注意：');
    promptLines.push('- UPDATE 后的文件路径必须与上面已有记忆的文件路径完全相同，不要修改大小写');
    promptLines.push('- 如果新总结和已有记忆主题相同但新总结有更多具体的类名/路径/方法签名，应选择 UPDATE。');
    promptLines.push('- CREATE 后必须指定目标域名。两个可选域名：');
    promptLines.push('  - ' + hostname + ': 对话内容与该网站操作密切相关（域特定指令、API路径、页面操作经验等）');
    promptLines.push('  - general: 对话内容为跨域通用经验、方法论文档、通用技术方案（如设计模式、架构经验、通用调试方法等）');

    const prompt = promptLines.join('\n');

    const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    const apiUrl = `${baseUrl}/v1/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 20000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 2000
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { action: 'create', domain: hostname };

    const data = await response.json();
    const rawText = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    var firstLineRaw = rawText.split('\n')[0].trim();
    var firstLineUpper = firstLineRaw.toUpperCase();
    console.log('[Memory] evaluateMemoryMerge 响应首行:', firstLineRaw);
    if (firstLineUpper.startsWith('SKIP')) {
      console.log('[Memory] 决策: SKIP (已有记忆已覆盖)');
      return { action: 'skip' };
    }
    if (firstLineUpper.startsWith('UPDATE:')) {
      var path = firstLineRaw.substring(7).trim();
      var contentStart = rawText.indexOf('\n');
      var mergedContent = contentStart > 0 ? rawText.substring(contentStart + 1).trim() : newContent;
      if (!mergedContent || mergedContent.length < 20) mergedContent = newContent;
      path = path.toLowerCase().replace(/\.(md|markdown|txt)$/i, '') + '.md';
      console.log('[Memory] 决策: UPDATE', path);
      return { action: 'update', path: path, content: mergedContent };
    }
    if (firstLineUpper.startsWith('CREATE:')) {
      var domainFromAi = firstLineRaw.substring(7).trim().toLowerCase();
      if (domainFromAi !== 'general' && domainFromAi !== hostname.toLowerCase()) {
        domainFromAi = hostname;
      }
      console.log('[Memory] 决策: CREATE, 目标域:', domainFromAi);
      return { action: 'create', domain: domainFromAi };
    }
    console.log('[Memory] 决策: CREATE (默认当前域, 新话题)');
    return { action: 'create', domain: hostname };
  } catch {
    return { action: 'create', domain: hostname };
  }
}

async function updateMemoryFile(memoryItemId, path, content) {
  var normalizedPath = path.toLowerCase().replace(/\.(md|markdown|txt)$/i, '') + '.md';
  await FileCacheManager.addFiles(memoryItemId, [{
    path: normalizedPath,
    content: content,
    updatedAt: Date.now()
  }]);

  const files = await FileCacheManager.getFilesByKnowledge(memoryItemId);
  const children = buildMemoryTree(files);
  const tree = { root: '', children: children };
  await TreeCacheManager.saveTree(memoryItemId, tree);

  const memoryItem = await initMemoryCard();
  const domains = new Set();
  for (const f of files) {
    const d = f.path.split('/')[0];
    if (d) domains.add(d);
  }
  memoryItem.fileCount = files.length;
  memoryItem.domainCount = domains.size;
  await saveMemoryItem(memoryItem);
}

async function generateMemory(sessionMessages, hostname, sessionTitle, accessedPaths, sessionGeneratedPaths) {
  try {
    var mergeExisting = [];

    var memoryItem = await initMemoryCard();
    for (var i = 0; (accessedPaths && i < accessedPaths.length); i++) {
      var file = await FileCacheManager.getFile(memoryItem.id, accessedPaths[i]);
      if (file) {
        mergeExisting.push({ path: accessedPaths[i], content: file.content, source: 'LLM访问' });
      }
    }

    for (var j = 0; (sessionGeneratedPaths && j < sessionGeneratedPaths.length); j++) {
      var alreadyIn = false;
      for (var k = 0; k < mergeExisting.length; k++) {
        if (mergeExisting[k].path === sessionGeneratedPaths[j]) { alreadyIn = true; break; }
      }
      if (!alreadyIn) {
        var gf = await FileCacheManager.getFile(memoryItem.id, sessionGeneratedPaths[j]);
        if (gf) {
          mergeExisting.push({ path: sessionGeneratedPaths[j], content: gf.content, source: '本会话已生成' });
        }
      }
    }

    var allFiles = await FileCacheManager.getFilesByKnowledge(memoryItem.id);
    var generalDomainFiles = allFiles.filter(function (f) {
      return f.path.startsWith('general/');
    });
    for (var g = 0; g < generalDomainFiles.length; g++) {
      var alreadyInGeneral = false;
      for (var h = 0; h < mergeExisting.length; h++) {
        if (mergeExisting[h].path === generalDomainFiles[g].path) { alreadyInGeneral = true; break; }
      }
      if (!alreadyInGeneral) {
        mergeExisting.push({ path: generalDomainFiles[g].path, content: generalDomainFiles[g].content, source: '通用记忆库' });
      }
    }

    console.log('[Memory] generateMemory 待合并记忆:', mergeExisting.map(function(m){return m.path + '(' + m.source + ')';}));

    var result = await buildMemoryFileContent(sessionMessages, hostname, sessionTitle);
    var newContent = result.content;

    if (mergeExisting.length === 0) {
      var savedPath = await saveMemoryFile(hostname, sessionTitle, newContent, result.fileName);
      console.log('[Memory] 创建新文件:', savedPath);
      return savedPath;
    }

    var decision = await evaluateMemoryMerge(mergeExisting, newContent, hostname);

    if (decision.action === 'skip') {
      console.log('[Memory] 跳过，已有记忆已覆盖');
      return null;
    }

    if (decision.action === 'update') {
      await updateMemoryFile(memoryItem.id, decision.path, decision.content);
      console.log('[Memory] 更新文件:', decision.path);
      return decision.path;
    }

    var targetDomain = decision.domain || hostname;
    var savedPath = await saveMemoryFile(targetDomain, sessionTitle, newContent, result.fileName);
    console.log('[Memory] 创建新文件:', savedPath);
    return savedPath;
  } catch (e) {
    console.error('[Memory] generateMemory 失败:', e);
    return null;
  }
}

async function triggerMemoryGeneration(messages, hostname, sessionTitle, sessionId) {
  if (!messages || messages.length === 0) {
    console.log('[Memory] triggerMemoryGeneration 跳过: 无消息');
    return;
  }
  if (!sessionTitle) sessionTitle = '对话 ' + new Date().toLocaleString('zh-CN');

  console.log('[Memory] triggerMemoryGeneration 触发, session:', sessionId || '(无)', 'title:', sessionTitle, 'hostname:', hostname, '消息数:', messages.length);

  var accessedPaths = _accessedMemoryPaths.slice();
  _accessedMemoryPaths = [];

  var sessionGeneratedPaths = [];
  if (sessionId && sessionId === _lastSessionId) {
    sessionGeneratedPaths = _sessionGeneratedPaths.slice();
  } else {
    _sessionGeneratedPaths = [];
  }
  _lastSessionId = sessionId || null;

  console.log('[Memory] LLM访问的记忆:', accessedPaths, '会话已生成:', sessionGeneratedPaths);

  generateMemory(messages, hostname, sessionTitle, accessedPaths, sessionGeneratedPaths).then(function(savedPath) {
    if (savedPath && sessionId) {
      if (sessionId !== _lastSessionId) {
        _sessionGeneratedPaths = [];
        _lastSessionId = sessionId;
      }
      _sessionGeneratedPaths.push(savedPath);
      console.log('[Memory] 记录会话生成路径:', savedPath);
    }

    initMemoryCard().then(function(memoryItem) {
      memoryItem.description = '已有记忆文件';
      return saveMemoryItem(memoryItem);
    }).catch(function(){});

    if (typeof renderKnowledgeList === 'function') {
      try { renderKnowledgeList(); } catch {}
    }
  }).catch(function(e) {
    console.error('[Memory] triggerMemoryGeneration 异步生成失败:', e);
  });
}

async function searchMemories(domain) {
  if (!domain) domain = getCurrentHostname();

  const memoryItem = await loadMemoryItem();
  if (!memoryItem) return [];

  const files = await FileCacheManager.getFilesByKnowledge(memoryItem.id);
  const domainPrefix = ((domain || 'general').toLowerCase()) + '/';

  return files
    .filter(function (f) {
      return f.path.startsWith(domainPrefix);
    })
    .map(function (f) {
      return {
        path: f.path,
        content_preview: (f.content || '').substring(0, 200)
      };
    });
}

function recordMemoryAccess(path) {
  if (!_accessedMemoryPaths.includes(path)) {
    _accessedMemoryPaths.push(path);
  }
}

async function getMemoryFile(path) {
  const memoryItem = await loadMemoryItem();
  if (!memoryItem) {
    return JSON.stringify({ error: '记忆卡片不存在' });
  }

  try {
    recordMemoryAccess(path);
    const file = await FileCacheManager.getFile(memoryItem.id, path);
    if (!file) {
      return JSON.stringify({ error: '记忆文件未找到: ' + path });
    }
    return file.content || '';
  } catch (err) {
    return JSON.stringify({ error: '读取记忆文件失败: ' + (err.message || '') });
  }
}

async function deleteMemoryCard() {
  const memoryItem = await loadMemoryItem();
  if (!memoryItem) return;

  await FileCacheManager.deleteKnowledgeFiles(memoryItem.id).catch(function () {});
  await TreeCacheManager.deleteTree(memoryItem.id).catch(function () {});

  await chrome.storage.local.remove(MEMORY_KEY);
  memoryItemCache = null;

  if (typeof renderKnowledgeList === 'function') {
    try { await renderKnowledgeList(); } catch {}
  }
}
