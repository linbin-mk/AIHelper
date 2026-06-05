var SKILLS_KEY = 'ai_helper_skills';

async function loadAiHelperSkills() {
  try {
    var result = await chrome.storage.local.get(SKILLS_KEY);
    return result[SKILLS_KEY] || null;
  } catch (e) {
    return null;
  }
}

async function saveAiHelperSkills(data) {
  try {
    await chrome.storage.local.set({ [SKILLS_KEY]: data });
  } catch (e) {
    // silently ignore
  }
}

// ────────────── deprecated: 旧 overrides API ──────────────
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

async function deleteOverridesKey() {
  try {
    await chrome.storage.local.remove(SKILL_OVERRIDES_KEY);
  } catch (e) {
    // silently ignore
  }
}
