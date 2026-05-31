const FAVORITES_KEY = 'ai_helper_skill_favorites';

async function loadFavorites() {
  try {
    var result = await chrome.storage.local.get(FAVORITES_KEY);
    return result[FAVORITES_KEY] || [];
  } catch (e) {
    return [];
  }
}

async function saveFavorites(data) {
  try {
    await chrome.storage.local.set({ [FAVORITES_KEY]: data });
  } catch (e) {
    // silently ignore
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function validateSkillIds(skillIds) {
  var registry = window.__getSkillRegistry ? window.__getSkillRegistry() : null;
  if (!registry) return skillIds;
  var allSkills = registry.getAll();
  var validIds = new Set();
  for (var i = 0; i < allSkills.length; i++) {
    validIds.add(allSkills[i].id);
  }
  return skillIds.filter(function (id) { return validIds.has(id); });
}

var FavoritesManager = {
  createCollection: async function (name, description, skillIds) {
    if (!name || !name.trim()) {
      return { success: false, error: 'name and description are required' };
    }
    if (typeof description !== 'string') {
      return { success: false, error: 'name and description are required' };
    }
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: 'skillIds is empty' };
    }

    var validIds = validateSkillIds(skillIds);
    if (validIds.length === 0) {
      return { success: false, error: 'no valid skill ids' };
    }

    var favorites = await loadFavorites();
    var newCollection = {
      id: generateUUID(),
      name: name.trim(),
      description: description.trim(),
      skillIds: validIds,
      createdAt: Date.now()
    };
    favorites.push(newCollection);
    await saveFavorites(favorites);
    return { success: true, collectionId: newCollection.id };
  },

  deleteCollection: async function (collectionId) {
    if (!collectionId) {
      return { success: false, error: 'collectionId is required' };
    }
    var favorites = await loadFavorites();
    var found = false;
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i].id === collectionId) {
        found = true;
        break;
      }
    }
    if (!found) {
      return { success: false, error: 'collection not found' };
    }
    favorites = favorites.filter(function (c) { return c.id !== collectionId; });
    await saveFavorites(favorites);
    return { success: true };
  },

  addSkills: async function (collectionId, skillIds) {
    if (!collectionId) {
      return { success: false, error: 'collectionId is required' };
    }
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: 'skillIds is empty' };
    }
    var validIds = validateSkillIds(skillIds);
    if (validIds.length === 0) {
      return { success: false, error: 'no valid skill ids' };
    }

    var favorites = await loadFavorites();
    var addedCount = 0;
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i].id === collectionId) {
        var existingIds = favorites[i].skillIds;
        for (var j = 0; j < validIds.length; j++) {
          if (existingIds.indexOf(validIds[j]) === -1) {
            existingIds.push(validIds[j]);
            addedCount++;
          }
        }
        await saveFavorites(favorites);
        return { success: true, addedCount: addedCount };
      }
    }
    return { success: false, error: 'collection not found' };
  },

  removeSkills: async function (collectionId, skillIds) {
    if (!collectionId) {
      return { success: false, error: 'collectionId is required' };
    }
    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: 'skillIds is empty' };
    }
    var favorites = await loadFavorites();
    for (var i = 0; i < favorites.length; i++) {
      if (favorites[i].id === collectionId) {
        var existingIds = favorites[i].skillIds;
        var before = existingIds.length;
        favorites[i].skillIds = existingIds.filter(function (id) {
          return skillIds.indexOf(id) === -1;
        });
        var removedCount = before - favorites[i].skillIds.length;
        await saveFavorites(favorites);
        return { success: true, removedCount: removedCount };
      }
    }
    return { success: false, error: 'collection not found' };
  },

  loadFavorites: loadFavorites,
  saveFavorites: saveFavorites,
  generateUUID: generateUUID,
  getKey: function () { return FAVORITES_KEY; }
};

window.FavoritesManager = FavoritesManager;
