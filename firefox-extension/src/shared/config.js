const CONFIG_STORAGE_KEY = 'ai_helper_model_config';

const apiBaseUrlEl = document.getElementById('apiBaseUrl');
const apiKeyEl = document.getElementById('apiKey');
const modelNameEl = document.getElementById('modelName');
const configSaveBtn = document.getElementById('configSaveBtn');
const saveStatusEl = document.getElementById('saveStatus');

const apiBaseUrlErrorEl = document.getElementById('apiBaseUrlError');
const apiKeyErrorEl = document.getElementById('apiKeyError');
const modelNameErrorEl = document.getElementById('modelNameError');

const configFormArea = document.getElementById('configFormArea');
const configCardArea = document.getElementById('configCardArea');
const configCard = document.getElementById('configCard');
const cardApiBaseUrl = document.getElementById('cardApiBaseUrl');
const cardModelName = document.getElementById('cardModelName');
const cardStatus = document.getElementById('cardStatus');
const cardRefreshBtn = document.getElementById('cardRefreshBtn');
const cardEditBtn = document.getElementById('cardEditBtn');

let currentCardConfig = null;

async function loadModelConfig() {
  try {
    const result = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
    return result[CONFIG_STORAGE_KEY] || null;
  } catch {
    return null;
  }
}

async function saveModelConfig(config) {
  await chrome.storage.local.set({ [CONFIG_STORAGE_KEY]: config });
}

function populateConfigForm(config) {
  if (config) {
    apiBaseUrlEl.value = config.apiBaseUrl || '';
    if (config.apiKey) {
      apiKeyEl.placeholder = t('config.apiKeyStored');
      apiKeyEl.value = '';
    }
    modelNameEl.value = config.modelName || '';
  } else {
    apiBaseUrlEl.value = 'https://api.deepseek.com';
    apiKeyEl.value = '';
    apiKeyEl.placeholder = 'sk-...';
    modelNameEl.value = 'deepseek-v4-flash';
  }
}

function clearErrors() {
  apiBaseUrlErrorEl.textContent = '';
  apiKeyErrorEl.textContent = '';
  modelNameErrorEl.textContent = '';
}

function validateConfig(config) {
  clearErrors();
  let valid = true;

  if (!config.apiBaseUrl || !config.apiBaseUrl.trim()) {
    apiBaseUrlErrorEl.textContent = t('config.required');
    valid = false;
  } else if (!/^https?:\/\/.+/.test(config.apiBaseUrl.trim())) {
    apiBaseUrlErrorEl.textContent = t('config.invalidUrl');
    valid = false;
  }

  if (!config.apiKey || !config.apiKey.trim()) {
    const hasStored = apiKeyEl.placeholder === t('config.apiKeyStored');
    if (!hasStored) {
      apiKeyErrorEl.textContent = t('config.apiKeyRequired');
      valid = false;
    }
  }

  if (!config.modelName || !config.modelName.trim()) {
    modelNameErrorEl.textContent = t('config.required');
    valid = false;
  }

  return valid;
}

async function testConnectivity(config) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/v1/models`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (resp.ok) {
      return { success: true };
    }
    const body = await resp.text();
    return { success: false, status: resp.status, body };
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      return { success: false, message: '连接超时，请检查 API Base URL 是否正确' };
    }
    return { success: false, message: '无法连接到服务商，请检查 API Base URL 和网络连接' };
  }
}

function showSaveError(text) {
  saveStatusEl.textContent = text;
  saveStatusEl.className = 'save-status save-status-error';
}

function showCard(config, connected) {
  currentCardConfig = { apiBaseUrl: config.apiBaseUrl, modelName: config.modelName, connected };
  cardApiBaseUrl.textContent = config.apiBaseUrl;
  cardModelName.textContent = config.modelName;
  updateCardStatus(connected);
  configFormArea.style.display = 'none';
  configCardArea.style.display = '';
  saveStatusEl.textContent = '';
  saveStatusEl.className = 'save-status';
  clearErrors();
}

function updateCardStatus(connected) {
  if (connected) {
    configCard.className = 'config-card config-card--connected';
    cardStatus.textContent = t('config.connected');
    cardStatus.className = 'card-status card-status--connected';
  } else {
    configCard.className = 'config-card config-card--disconnected';
    cardStatus.textContent = t('config.disconnected');
    cardStatus.className = 'card-status card-status--disconnected';
  }
}

async function showEditMode() {
  clearErrors();
  saveStatusEl.textContent = '';
  saveStatusEl.className = 'save-status';
  const config = await loadModelConfig();
  populateConfigForm(config);
  configCardArea.style.display = 'none';
  configFormArea.style.display = '';
}

async function handleSave() {
  let config = {
    apiBaseUrl: apiBaseUrlEl.value.trim(),
    apiKey: apiKeyEl.value.trim() || null,
    modelName: modelNameEl.value.trim(),
  };

  if (!validateConfig(config)) return;

  if (config.apiKey === null) {
    const existing = await loadModelConfig();
    if (existing && existing.apiKey) {
      config.apiKey = existing.apiKey;
    }
  }

  if (!config.apiKey) {
    apiKeyErrorEl.textContent = t('config.apiKeyRequired');
    return;
  }

  try {
    const result = await testConnectivity(config);
    if (result.success) {
      await saveModelConfig(config);
      showCard(config, true);
    } else if (result.message) {
      showSaveError(result.message);
    } else {
      const extra = result.status === 401 ? ' 检查API Key是否有效' : '';
      showSaveError(`连接失败 (${result.status})${extra}`);
    }
  } catch (e) {
    console.error('保存配置失败:', e);
    showSaveError('保存失败');
  }
}

async function handleCardRefresh() {
  cardRefreshBtn.disabled = true;
  cardStatus.textContent = t('config.connecting');
  cardStatus.className = 'card-status';
  try {
    const config = await loadModelConfig();
    if (!config) {
      showEditMode();
      return;
    }
    const result = await testConnectivity(config);
    updateCardStatus(result.success);
  } catch (e) {
    updateCardStatus(false);
  } finally {
    cardRefreshBtn.disabled = false;
  }
}

configSaveBtn.addEventListener('click', handleSave);

cardRefreshBtn.addEventListener('click', handleCardRefresh);

cardEditBtn.addEventListener('click', () => {
  showEditMode();
});

loadModelConfig().then(async (config) => {
  if (config) {
    const result = await testConnectivity(config);
    showCard(config, result.success);
  } else {
    await showEditMode();
  }
});
