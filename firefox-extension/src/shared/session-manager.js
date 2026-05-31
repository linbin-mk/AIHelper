const SESSION_STORAGE_KEY = 'ai_helper_sessions';
const ACTIVE_SESSION_KEY = 'ai_helper_active_session_id';
const SIDEBAR_COLLAPSED_KEY = 'ai_helper_sidebar_collapsed';

const SessionManager = {
  _titleTimers: new Map(),

  async loadSessions() {
    try {
      const result = await chrome.storage.local.get(SESSION_STORAGE_KEY);
      return result[SESSION_STORAGE_KEY] || [];
    } catch {
      return [];
    }
  },

  async saveSessions(sessions) {
    try {
      await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: sessions });
    } catch {
      // 静默失败
    }
  },

  async createSession() {
    const sessions = await this.loadSessions();
    const session = {
      id: 'session_' + Date.now(),
      title: '',
      titleSource: 'truncated',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    sessions.unshift(session);
    await this.saveSessions(sessions);
    await this.setActiveSessionId(session.id);
    return session;
  },

  async setInitialTitle(sessionId, userMessage) {
    const sessions = await this.loadSessions();
    const session = sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return;
    session.title = this._fallbackTitle(userMessage);
    session.titleSource = 'truncated';
    await this.saveSessions(sessions);
    this._startTitleTimer(sessionId, userMessage);
  },

  _startTitleTimer(sessionId, userMessage) {
    this._clearTitleTimer(sessionId);
    const timerId = setTimeout(() => {
      this._titleTimers.delete(sessionId);
      this.generateSessionTitle(sessionId, userMessage, '').then(title => {
        if (title) {
          const titleEl = document.getElementById('sessionTitleDisplay');
          if (titleEl && window.currentSessionId === sessionId) titleEl.textContent = title;
          const card = document.querySelector('.session-card[data-session-id="' + sessionId + '"]');
          if (card) {
            const cardTitle = card.querySelector('.session-card__title');
            if (cardTitle) cardTitle.textContent = title;
          }
          if (typeof renderSessionList === 'function') renderSessionList();
        }
      }).catch(() => {});
    }, 60000);
    this._titleTimers.set(sessionId, timerId);
  },

  _clearTitleTimer(sessionId) {
    if (!sessionId) return;
    const timerId = this._titleTimers.get(sessionId);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      this._titleTimers.delete(sessionId);
    }
  },

  async getSession(sessionId) {
    const sessions = await this.loadSessions();
    return sessions.find(function (s) { return s.id === sessionId; }) || null;
  },

  async deleteSession(sessionId) {
    const sessions = await this.loadSessions();
    const idx = sessions.findIndex(function (s) { return s.id === sessionId; });
    if (idx === -1) return false;

    sessions.splice(idx, 1);
    await this.saveSessions(sessions);

    const activeId = await this.getActiveSessionId();
    if (activeId === sessionId) {
      const next = sessions[0] || null;
      await this.setActiveSessionId(next ? next.id : null);
    }

    return true;
  },

  async renameSession(sessionId, newTitle) {
    if (!newTitle || !newTitle.trim()) return false;
    const sessions = await this.loadSessions();
    const session = sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return false;
    session.title = newTitle.trim();
    await this.saveSessions(sessions);
    return true;
  },

  async updateSessionMessages(sessionId, messages) {
    const sessions = await this.loadSessions();
    const session = sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return false;
    session.messages = messages;
    session.updatedAt = Date.now();
    await this.saveSessions(sessions);
    return true;
  },

  async getActiveSessionId() {
    try {
      const result = await chrome.storage.local.get(ACTIVE_SESSION_KEY);
      return result[ACTIVE_SESSION_KEY] || null;
    } catch {
      return null;
    }
  },

  async setActiveSessionId(sessionId) {
    try {
      await chrome.storage.local.set({ [ACTIVE_SESSION_KEY]: sessionId });
    } catch {
      // 静默失败
    }
  },

  async getSidebarCollapsed() {
    try {
      const result = await chrome.storage.local.get(SIDEBAR_COLLAPSED_KEY);
      return result[SIDEBAR_COLLAPSED_KEY] || false;
    } catch {
      return false;
    }
  },

  async setSidebarCollapsed(collapsed) {
    try {
      await chrome.storage.local.set({ [SIDEBAR_COLLAPSED_KEY]: collapsed });
    } catch {
      // 静默失败
    }
  },

  async generateSessionTitle(sessionId, userMessage, aiResponse) {
    const sessions = await this.loadSessions();
    const session = sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return;
    if (session.titleSource !== 'truncated') return;

    try {
      const title = await this._requestTitle(userMessage, aiResponse);
      if (title) {
        session.title = title;
        session.titleSource = 'ai';
        await this.saveSessions(sessions);
      }
    } catch (err) {
      // API 失败不做处理，保留阶段1截取标题
    }
    return session.title;
  },

  async _requestTitle(userMessage, aiResponse) {
    const config = typeof loadModelConfig === 'function' ? await loadModelConfig() : null;
    console.log('[titleGen] config:', config ? { model: config.modelName, hasKey: !!config.apiKey, baseUrl: config.apiBaseUrl } : 'null');
    if (!config || !config.apiBaseUrl || !config.apiKey || !config.modelName) {
      console.log('[titleGen] abort: config incomplete');
      throw new Error('Not configured');
    }

    const userPreview = (userMessage || '').substring(0, 50);
    const aiPreview = (aiResponse || '').substring(0, 100);
    console.log('[titleGen] userPreview:', userPreview, 'aiPreview:', aiPreview || '(empty)');

    const prompt = t('session.generateTitlePrompt', { user: userPreview, ai: aiPreview });
    console.log('[titleGen] prompt:', prompt);

    const baseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    const url = baseUrl + '/v1/chat/completions';
    console.log('[titleGen] request url:', url);

    const body = JSON.stringify({
      model: config.modelName,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      max_tokens: 100
    });
    console.log('[titleGen] request body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.apiKey
      },
      body: body
    });
    console.log('[titleGen] response status:', response.status, response.statusText);

    if (!response.ok) {
      const errText = await response.text();
      console.log('[titleGen] error response body:', errText.substring(0, 300));
      throw new Error('Title generation failed');
    }

    const data = await response.json();
    console.log('[titleGen] response data:', JSON.stringify(data).substring(0, 300));
    const message = data.choices?.[0]?.message || {};
    const rawTitle = (message.content || '').trim();
    console.log('[titleGen] content:', (message.content || '').substring(0, 50), 'reasoning:', (message.reasoning_content || '').substring(0, 50));
    if (!rawTitle && data.choices?.[0]?.finish_reason === 'length') {
      console.log('[titleGen] finish_reason=length, max_tokens可能不足');
    }
    console.log('[titleGen] raw title from API:', rawTitle);
    const title = rawTitle.substring(0, 15);
    console.log('[titleGen] final title (max 15):', title || '(empty, will fallback)');
    return title || this._fallbackTitle(userMessage);
  },

  _fallbackTitle(userMessage) {
    if (!userMessage) return t('session.untitled');
    const cleaned = userMessage.replace(/[\/\\:*?"<>|]/g, '').trim();
    return cleaned.substring(0, 15) || t('session.untitled');
  },

  async exportSessionLog(sessionId) {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const config = typeof loadModelConfig === 'function' ? await loadModelConfig() : null;
    const now = new Date();
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const ts = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
    const safeTitle = (session.title || t('session.untitled')).replace(/[\/\\:*?"<>|]/g, '_');
    const filename = 'ai-helper-chat-' + safeTitle + '-' + ts + '.json';

    const exportData = {
      meta: {
        exportedAt: now.toISOString(),
        sessionTitle: session.title || t('session.untitled'),
        messageCount: session.messages.length,
        modelConfig: {
          provider: config?.modelName || null,
          model: config?.modelName || null,
          temperature: config?.temperature ?? null,
          maxTokens: config?.maxTokens ?? null
        }
      },
      messages: session.messages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.SessionManager = SessionManager;
