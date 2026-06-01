window.__skillRegistry = null;

class SkillRegistry {
  constructor() {
    this._skills = new Map();
    this._activeIds = new Set();
    this._deletedIds = new Set();
    this._listeners = [];
  }

  register(skill) {
    this._skills.set(skill.id, skill);
    this._notify({ type: 'register', skillId: skill.id });
  }

  unregister(skillId) {
    this._deletedIds.add(skillId);
    this._notify({ type: 'unregister', skillId: skillId });
    saveOverrides(this.getOverrides());
  }

  update(skillId, fields, langSuffix) {
    var skill = this._skills.get(skillId);
    if (!skill) return false;

    addHistoryEntry(skillId, langSuffix, {
      ts: Date.now(),
      name: skill.name,
      description: skill.description,
      _prompt: skill._prompt,
      category: skill.category
    });
    saveHistory();

    if (!skill._edits) skill._edits = {};
    if (!skill._edits[langSuffix]) skill._edits[langSuffix] = {};
    var edit = skill._edits[langSuffix];
    if (fields.name !== undefined) edit.name = fields.name;
    if (fields.description !== undefined) edit.description = fields.description;
    if (fields._prompt !== undefined) edit._prompt = fields._prompt;
    if (fields.category !== undefined) edit.category = fields.category;

    if (fields.name !== undefined) skill.name = fields.name;
    if (fields.description !== undefined) skill.description = fields.description;
    if (fields._prompt !== undefined) skill._prompt = fields._prompt;
    if (fields.category !== undefined) skill.category = fields.category;

    this._notify({ type: 'update', skillId: skillId });
    saveOverrides(this.getOverrides());
    return true;
  }

  getHistory(skillId, langSuffix) {
    return getHistory(skillId, langSuffix);
  }

  async resetSkill(skillId, langSuffix) {
    var skill = this._skills.get(skillId);
    if (!skill) return;

    var text = await this._fetchSkillMd(skillId, langSuffix);
    if (text === null) {
      var fallbackSuffix = (langSuffix === 'cn') ? 'en' : 'cn';
      text = await this._fetchSkillMd(skillId, fallbackSuffix);
    }
    if (text === null) return;

    var parsed = this._parseSkillMd(text, skillId, langSuffix);
    if (!parsed) return;

    skill.name = parsed.name;
    skill.description = parsed.description;
    skill._prompt = parsed._prompt;
    skill.category = parsed.category;

    if (skill._edits) {
      delete skill._edits[langSuffix];
      if (Object.keys(skill._edits).length === 0) {
        delete skill._edits;
      }
    }

    this._notify({ type: 'reset', skillId: skillId });
    saveOverrides(this.getOverrides());
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
    var self = this;
    return Array.from(this._skills.values()).filter(function (s) {
      return !self._deletedIds.has(s.id);
    });
  }

  getOverrides() {
    var deletedIds = Array.from(this._deletedIds);
    var editedSkills = {};
    this._skills.forEach(function (skill, id) {
      if (skill._edits) {
        editedSkills[id] = {};
        Object.keys(skill._edits).forEach(function (lang) {
          editedSkills[id][lang] = {
            name: skill._edits[lang].name,
            description: skill._edits[lang].description || '',
            _prompt: skill._edits[lang]._prompt || '',
            category: skill._edits[lang].category || ''
          };
        });
      }
    });
    return { deletedIds: deletedIds, editedSkills: editedSkills };
  }

  applyOverrides(overrides) {
    var self = this;
    if (!overrides) return;
    if (overrides.deletedIds && overrides.deletedIds.length > 0) {
      overrides.deletedIds.forEach(function (id) {
        self.unregister(id);
      });
    }
    if (overrides.editedSkills) {
      var currentLang = (window.__i18nMessages && window.__i18nMessages._lang) || 'zh-CN';
      var langSuffix = (currentLang === 'zh-CN') ? 'cn' : 'en';
      Object.keys(overrides.editedSkills).forEach(function (skillId) {
        var langData = overrides.editedSkills[skillId][langSuffix];
        if (langData) {
          self.update(skillId, langData, langSuffix);
        }
      });
    }
  }

  getActive() {
    var self = this;
    return this.getAll().filter(function (s) { return self._activeIds.has(s.id); });
  }

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

  async loadAllSkills() {
    var self = this;
    try {
      var manifestUrl = chrome.runtime.getURL('skills/skills.json');
      var manifestResp = await fetch(manifestUrl);
      if (!manifestResp.ok) {
        console.warn('[SkillRegistry] Failed to load skills manifest, status:', manifestResp.status);
        return;
      }
      var skillIds = await manifestResp.json();
      var loadPromises = skillIds.map(function (skillId) {
        return self._loadOneSkill(skillId).catch(function (e) {
          console.warn('[SkillRegistry] Failed to load skill "' + skillId + '":', e);
        });
      });
      await Promise.allSettled(loadPromises);

      var overrides = await loadOverrides();
      self.applyOverrides(overrides);
    } catch (e) {
      console.warn('[SkillRegistry] Error loading skills:', e);
    }
  }

  async _loadOneSkill(skillId) {
    var currentLang = (window.__i18nMessages && window.__i18nMessages._lang) || 'zh-CN';
    var langSuffix = (currentLang === 'zh-CN') ? 'cn' : 'en';
    var fallbackSuffix = (langSuffix === 'cn') ? 'en' : 'cn';

    var text = await this._fetchSkillMd(skillId, langSuffix);
    if (text === null) {
      text = await this._fetchSkillMd(skillId, fallbackSuffix);
    }
    if (text === null) {
      console.warn('[SkillRegistry] No skill MD found for "' + skillId + '"');
      return;
    }

    var parsed = this._parseSkillMd(text, skillId, langSuffix);
    if (!parsed) {
      console.warn('[SkillRegistry] Failed to parse MD for "' + skillId + '"');
      return;
    }

    this.register(parsed);
  }

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

  _parseSkillMd(text, defaultId, langSuffix) {
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
      sourcePath: 'skills/' + (meta.id || defaultId) + '/skill.' + langSuffix + '.md',
      _prompt: body,
      getPrompt: function () { return this._prompt; },
      getTools: function () { return []; },
      getUIDelegate: function () { return null; }
    };
  }
}

window.__registerSkill = function (skill) {
  if (!window.__skillRegistry) {
    window.__skillRegistry = new SkillRegistry();
  }
  window.__skillRegistry.register(skill);
};

window.__getSkillRegistry = function () {
  if (!window.__skillRegistry) {
    window.__skillRegistry = new SkillRegistry();
  }
  return window.__skillRegistry;
};
