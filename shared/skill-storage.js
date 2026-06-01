var SKILL_OVERRIDES_KEY = 'ai_helper_skill_overrides';

async function saveOverrides(overrides) {
  try {
    await chrome.storage.local.set({ [SKILL_OVERRIDES_KEY]: overrides });
  } catch (e) {
    // silently ignore
  }
}

async function loadOverrides() {
  try {
    var result = await chrome.storage.local.get(SKILL_OVERRIDES_KEY);
    return result[SKILL_OVERRIDES_KEY] || { deletedIds: [], editedSkills: {} };
  } catch (e) {
    return { deletedIds: [], editedSkills: {} };
  }
}
