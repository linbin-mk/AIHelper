window.__skillRegistry = null;

function createSkill(dto) {
  return Object.assign(Object.create(null), dto, {
    getPrompt: function () { return this.prompt; }
  });
}

class SkillRegistry {
  constructor() {
    this._skills = new Map();
    this._activeIds = new Set();
    this._listeners = [];
    this._lang = 'cn';
  }

  // ────────── CRUD ──────────

  register(skill) {
    this._skills.set(skill.id, skill);
    this._notify({ type: 'register', skillId: skill.id });
  }

  unregister(skillId) {
    var skill = this._skills.get(skillId);
    if (!skill) return;
    skill.deleted = true;
    this._notify({ type: 'unregister', skillId: skillId });
    this._queueSync();
  }

  update(skillId, fields, langSuffix) {
    var skill = this._skills.get(skillId);
    if (!skill) return false;

    var currentLang = langSuffix || this._lang;

    addHistoryEntry(skillId, currentLang, {
      ts: Date.now(),
      name: skill.name,
      description: skill.description,
      prompt: skill.prompt,
      category: skill.category
    });
    saveHistory();

    if (fields.name !== undefined) skill.name = fields.name;
    if (fields.description !== undefined) skill.description = fields.description;
    if (fields.prompt !== undefined) skill.prompt = fields.prompt;
    if (fields.category !== undefined) skill.category = fields.category;

    this._notify({ type: 'update', skillId: skillId });
    this._queueSync();
    return true;
  }

  getHistory(skillId, langSuffix) {
    return getHistory(skillId, langSuffix);
  }

  activate(skillId) {
    this._activeIds.add(skillId);
    this._notify({ type: 'activate', skillId: skillId });
  }

  deactivate(skillId) {
    this._activeIds.delete(skillId);
    this._notify({ type: 'deactivate', skillId: skillId });
  }

  isActive(skillId) {
    return this._activeIds.has(skillId);
  }

  getAll() {
    return Array.from(this._skills.values()).filter(function (s) {
      return !s.deleted;
    });
  }

  getActive() {
    var self = this;
    return this.getAll().filter(function (s) { return self._activeIds.has(s.id); });
  }

  // ────────── Events ──────────

  onSkillEvent(callback) {
    this._listeners.push(callback);
  }

  removeSkillEventListener(callback) {
    this._listeners = this._listeners.filter(function (cb) { return cb !== callback; });
  }

  _notify(event) {
    this._listeners.forEach(function (cb) {
      try { cb(event); } catch (e) { /* noop */ }
    });
  }

  // ────────── Storage sync ──────────

  async _syncToStorage() {
    var self = this;
    var data = await loadAiHelperSkills() || {};
    if (!data[self._lang]) data[self._lang] = {};

    self._skills.forEach(function (skill, id) {
      var dto = {};
      var keys = ['id', 'name', 'description', 'category', 'prompt', 'type', 'deleted'];
      keys.forEach(function (k) { if (skill[k] !== undefined) dto[k] = skill[k]; });
      if (skill.createdAt !== undefined) dto.createdAt = skill.createdAt;
      if (skill.updatedAt !== undefined) dto.updatedAt = skill.updatedAt;
      data[self._lang][id] = dto;
    });

    await saveAiHelperSkills(data);
  }

  _queueSync() {
    var self = this;
    var prev = self._lastSync || Promise.resolve();
    self._lastSync = prev.then(function () { return self._syncToStorage(); }).catch(function () {});
    return self._lastSync;
  }

  async waitSync() {
    if (this._lastSync) await this._lastSync;
  }

  // ────────── MD parsing ──────────

  async _fetchSkillMd(skillId, langSuffix) {
    try {
      var url = chrome.runtime.getURL('skills/' + skillId + '/skill.' + langSuffix + '.md');
      var resp = await fetch(url);
      if (!resp.ok) return null;
      return await resp.text();
    } catch (e) {
      return null;
    }
  }

  _parseSkillMd(text, defaultId) {
    if (text.indexOf('---') !== 0) return null;
    var endIdx = text.indexOf('---', 3);
    if (endIdx === -1) return null;

    var yamlStr = text.substring(3, endIdx).trim();
    var body = text.substring(endIdx + 3).trim();

    var meta = {};
    var lines = yamlStr.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      var key = line.substring(0, colonIdx).trim();
      var value = line.substring(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      meta[key] = value;
    }

    var validCategories = ['Business', 'Product', 'Development', 'Testing'];
    var category = meta.category || 'Other';
    if (validCategories.indexOf(category) === -1) {
      category = 'Other';
    }

    return {
      id: meta.id || defaultId,
      name: meta.name || defaultId,
      description: meta.description || '',
      category: category,
      prompt: body
    };
  }

  async _loadOneSkillDto(skillId, langSuffix) {
    var fallbackSuffix = (langSuffix === 'cn') ? 'en' : 'cn';
    var text = await this._fetchSkillMd(skillId, langSuffix);
    if (text === null) {
      text = await this._fetchSkillMd(skillId, fallbackSuffix);
    }
    if (text === null) return null;

    var dto = this._parseSkillMd(text, skillId);
    if (!dto) return null;
    dto.type = 'builtin';
    dto.deleted = false;
    return dto;
  }

  // ────────── Fetch latest .md for history display ──────────

  async fetchLatestMdVersion(skillId, langSuffix) {
    var lang = langSuffix || this._lang;
    var text = await this._fetchSkillMd(skillId, lang);
    if (text === null) return null;
    var dto = this._parseSkillMd(text, skillId);
    if (!dto) return null;
    return dto;
  }

  // ────────── Bootstrap ──────────

  async bootstrap() {
    var self = this;
    var currentLang = (window.__i18nMessages && window.__i18nMessages._lang === 'zh-CN') ? 'cn' : 'en';
    self._lang = currentLang;

    await loadHistory();

    var data = await loadAiHelperSkills();

    if (!data) {
      // 首次安装：种子 + 迁移旧 overrides
      await self._seedLanguage(currentLang);
      await self._migrateOldOverrides(currentLang);
      return;
    }

    if (!data[currentLang]) {
      await self._seedLanguage(currentLang);
      return;
    }

    // 合并决策：always seed .md, 但有历史的技能保留用户版本
    await self._mergeFreshWithStorage(currentLang);
  }

  async _mergeFreshWithStorage(lang) {
    var self = this;
    var data = await loadAiHelperSkills();
    if (!data) { await self._seedLanguage(lang); return; }

    var manifestUrl = chrome.runtime.getURL('skills/skills.json');
    var manifestResp = await fetch(manifestUrl);
    if (!manifestResp.ok) {
      await self._loadFromStorage(lang);
      return;
    }
    var skillIds = await manifestResp.json();

    // 1. 并行 fetch 所有 .md → freshMap
    var freshMap = {};
    var dtoPromises = skillIds.map(function (skillId) {
      return self._loadOneSkillDto(skillId, lang).then(function (dto) {
        if (dto) freshMap[skillId] = dto;
      }).catch(function () {});
    });
    await Promise.allSettled(dtoPromises);

    // 2. 决策
    var result = {};
    var storageMap = data[lang] || {};

    for (var i = 0; i < skillIds.length; i++) {
      var skillId = skillIds[i];
      var fresh = freshMap[skillId];
      if (!fresh) continue;

      var stored = storageMap[skillId];
      var hist = self.getHistory(skillId, lang);

      if (hist.length > 0) {
        // 用户编辑过 → 保留 storage 版本
        if (stored) {
          result[skillId] = stored;
        } else {
          result[skillId] = fresh;
        }
      } else if (stored && stored.deleted) {
        // 用户删除过（无编辑）→ 跳过
        continue;
      } else {
        // 未修改 → 使用最新 .md
        result[skillId] = fresh;
      }
    }

    // 3. 保留 user 技能
    Object.keys(storageMap).forEach(function (id) {
      if (storageMap[id].type === 'user' && !storageMap[id].deleted) {
        result[id] = storageMap[id];
      }
    });

    // 4. 持久化
    data[lang] = result;
    await saveAiHelperSkills(data);

    // 5. 加载到内存
    self._skills.clear();
    self._lang = lang;
    Object.keys(result).forEach(function (id) {
      if (!result[id].deleted) {
        self.register(createSkill(result[id]));
      }
    });
  }

  // ────────── Seeding (first install) ──────────

  async _seedLanguage(lang) {
    var self = this;
    self._skills.clear();
    self._lang = lang;

    try {
      var manifestUrl = chrome.runtime.getURL('skills/skills.json');
      var manifestResp = await fetch(manifestUrl);
      if (!manifestResp.ok) return;
      var skillIds = await manifestResp.json();

      var loadPromises = skillIds.map(function (skillId) {
        return self._loadOneSkillDto(skillId, lang).then(function (dto) {
          if (dto) self.register(createSkill(dto));
        }).catch(function (e) {
          console.warn('[SkillRegistry] Failed to seed "' + skillId + '" (' + lang + '):', e);
        });
      });
      await Promise.allSettled(loadPromises);

      var data = await loadAiHelperSkills() || {};
      data[lang] = {};
      self._skills.forEach(function (skill, id) {
        var dto = { id: skill.id, name: skill.name, description: skill.description, category: skill.category, prompt: skill.prompt, type: skill.type, deleted: skill.deleted };
        data[lang][id] = dto;
      });
      await saveAiHelperSkills(data);
    } catch (e) {
      console.warn('[SkillRegistry] Error seeding language "' + lang + '":', e);
    }
  }

  async _loadFromStorage(lang) {
    var self = this;
    var data = await loadAiHelperSkills();
    if (!data || !data[lang]) return;
    self._skills.clear();
    self._lang = lang;
    Object.keys(data[lang]).forEach(function (id) {
      var dto = data[lang][id];
      if (dto.deleted) return;
      self.register(createSkill(dto));
    });
  }

  // ────────── Language switch ──────────

  async switchLanguage(targetLang) {
    var self = this;
    await self._queueSync(); // 确保当前写入完成

    var data = await loadAiHelperSkills();
    if (!data || !data[targetLang]) {
      await self._seedLanguage(targetLang);
      return;
    }

    await self._mergeFreshWithStorage(targetLang);
  }

  // ────────── Migration ──────────

  async _migrateOldOverrides(lang) {
    try {
      var oldOverrides = await loadOverrides();
      var data = await loadAiHelperSkills();
      if (!data || !data[lang]) return;

      if (oldOverrides.deletedIds && oldOverrides.deletedIds.length > 0) {
        oldOverrides.deletedIds.forEach(function (id) {
          if (data[lang][id]) data[lang][id].deleted = true;
        });
      }

      if (oldOverrides.editedSkills) {
        Object.keys(oldOverrides.editedSkills).forEach(function (skillId) {
          var langData = oldOverrides.editedSkills[skillId][lang];
          if (langData && data[lang][skillId]) {
            if (langData.name !== undefined) data[lang][skillId].name = langData.name;
            if (langData.description !== undefined) data[lang][skillId].description = langData.description;
            if (langData._prompt !== undefined) data[lang][skillId].prompt = langData._prompt;
            if (langData.category !== undefined) data[lang][skillId].category = langData.category;
          }
        });
      }

      await saveAiHelperSkills(data);
      await deleteOverridesKey();
    } catch (e) {
      console.warn('[SkillRegistry] Old overrides migration failed:', e);
    }
  }

  // ────────── User skill creation ──────────

  async createUserSkill(name, description, category, prompt) {
    var id = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    var dto = {
      id: id, name: name, description: description || '', category: category || 'Other',
      prompt: prompt, type: 'user', deleted: false, createdAt: Date.now(), updatedAt: Date.now()
    };
    var skill = createSkill(dto);
    this.register(skill);
    await this._syncToStorage();
    this._notify({ type: 'register', skillId: id });
    return id;
  }

  getLang() {
    return this._lang;
  }
}

window.__registerSkill = function (skill) {
  if (!window.__skillRegistry) window.__skillRegistry = new SkillRegistry();
  window.__skillRegistry.register(skill);
};

window.__getSkillRegistry = function () {
  if (!window.__skillRegistry) window.__skillRegistry = new SkillRegistry();
  return window.__skillRegistry;
};
