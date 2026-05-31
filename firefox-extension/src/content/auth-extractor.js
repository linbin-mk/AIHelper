(function () {
  'use strict';

  function getTokenFromStorage(storage) {
    var tokenKeys = ['token', 'accessToken', 'access_token', 'Authorization', 'authToken', 'auth_token', 'jwt', 'id_token', 'idToken'];

    for (var i = 0; i < tokenKeys.length; i++) {
      var key = tokenKeys[i];
      try {
        var value = storage.getItem(key);
        if (value) {
          return { source: 'storage', key: key, value: value };
        }
      } catch (e) {
        // ignore
      }
    }

    try {
      var length = storage.length;
      for (var j = 0; j < length; j++) {
        var storageKey = storage.key(j);
        if (!storageKey) continue;
        try {
          var storageValue = storage.getItem(storageKey);
          if (storageValue && storageValue.length > 20 && (storageValue.startsWith('eyJ') || storageValue.startsWith('Bearer '))) {
            return { source: 'storage', key: storageKey, value: storageValue };
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  function getTokenFromDom() {
    var csrfEl = document.querySelector('meta[name="csrf-token"], meta[name="_csrf"], input[name="_csrf"], input[name="csrfToken"], input[name="__RequestVerificationToken"]');
    if (csrfEl) {
      var val = csrfEl.content || csrfEl.value;
      if (val) return { source: 'dom', key: csrfEl.name || csrfEl.getAttribute('name') || 'csrf', value: val };
    }
    return null;
  }

  function getAuthCookies() {
    var cookies = document.cookie;
    if (!cookies) return null;

    var parts = cookies.split(';');
    var authCookies = [];
    var skippedPrefixes = ['_ga', '_gid', '_gat', '_gcl', 'AMP_', 'FPAU', 'FPID', 'FPLC', '_ym_', '_hjid'];

    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].trim();
      if (!pair) continue;

      var eqIdx = pair.indexOf('=');
      if (eqIdx <= 0) continue;

      var name = pair.substring(0, eqIdx).trim();
      var value = pair.substring(eqIdx + 1);

      if (value === '') continue;

      var shouldSkip = false;
      for (var s = 0; s < skippedPrefixes.length; s++) {
        if (name.startsWith(skippedPrefixes[s])) {
          shouldSkip = true;
          break;
        }
      }
      if (shouldSkip) continue;

      authCookies.push({ name: name, value: value });
    }

    return authCookies.length > 0 ? authCookies : null;
  }

  var localStorageToken = getTokenFromStorage(window.localStorage);
  var sessionStorageToken = null;

  try {
    sessionStorageToken = getTokenFromStorage(window.sessionStorage);
  } catch (e) {
    // ignore
  }

  var domToken = getTokenFromDom();
  var cookieResult = getAuthCookies();

  var result = {
    localStorageToken: localStorageToken,
    sessionStorageToken: sessionStorageToken,
    domToken: domToken,
    cookies: cookieResult,
    url: window.location.href,
  };

  try {
    chrome.runtime.sendMessage({
      type: 'AUTH_EXTRACT_RESULT',
      data: result,
    });
  } catch (e) {
    // Content script might not have messaging capability
  }

  return result;
})();
