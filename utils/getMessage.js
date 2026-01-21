// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

let cachedLang = null;
let cachedMessages = null;
let isInitialized = false;
let initPromise = null;

/**
 * Loads messages JSON file for the specified language.
 * @param {string} lang - Language code ('en' or 'pl').
 * @return {Promise<Object|null>} Messages object or null on error.
 */
const loadMessagesFile = async lang => {
  try {
    const url = browser.runtime.getURL(`/_locales/${lang}/messages.json`);
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (e) {
    CatchError(e);
    return null;
  }
};

/**
 * Initializes the i18n module by loading language setting and messages.
 * @return {Promise<void>} A promise that resolves when initialization is complete.
 */
const initI18n = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const langSetting = await storage.getItem('local:lang');
      cachedLang = langSetting || 'default';

      if (cachedLang !== 'default') {
        const messages = await loadMessagesFile(cachedLang);

        if (messages) {
          cachedMessages = messages;
        } else {
          cachedLang = 'default';
          cachedMessages = null;
        }
      }

      isInitialized = true;
    } catch (e) {
      CatchError(e);
      cachedLang = 'default';
      cachedMessages = null;
      isInitialized = true;
    }
  })();

  return initPromise;
};

/**
 * Retrieves a localized message by key.
 * @param {string} key - Message key from messages.json.
 * @return {string} Localized message or empty string if not found.
 */
const getMessage = key => {
  if (!isInitialized || cachedLang === 'default' || !cachedMessages) {
    return browser.i18n.getMessage(key);
  }

  return cachedMessages[key]?.message || browser.i18n.getMessage(key);
};

/**
 * Resets the i18n cache, forcing re-initialization on next initI18n call.
 */
const resetI18nCache = () => {
  cachedLang = null;
  cachedMessages = null;
  isInitialized = false;
  initPromise = null;
};

/**
 * Returns the current i18n state for React context.
 * @return {Object} Current state with lang and isInitialized.
 */
const getI18nState = () => ({
  lang: cachedLang,
  isInitialized
});

export { getMessage, initI18n, resetI18nCache, getI18nState };
