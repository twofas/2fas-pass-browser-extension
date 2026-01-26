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
 * Checks if running in content script context.
 * Content scripts don't have access to browser.tabs API.
 * @return {boolean} True if in content script context.
 */
const isContentScript = () => {
  try {
    return typeof browser.tabs === 'undefined';
  } catch {
    return true;
  }
};

/**
 * Loads messages JSON file for the specified language.
 * Only used by background/popup - content scripts use loadMessagesFromBackground.
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
  } catch {
    return null;
  }
};

/**
 * Requests i18n messages from background script.
 * Used by content scripts that cannot directly fetch extension resources.
 * @return {Promise<Object|null>} Object with lang and messages, or null on error.
 */
const loadMessagesFromBackground = async () => {
  try {
    const response = await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.GET_I18N_DATA,
      target: REQUEST_TARGETS.BACKGROUND
    });

    if (response?.status === 'ok') {
      return {
        lang: response.lang,
        messages: response.messages
      };
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Initializes the i18n module by loading language setting and messages.
 * In background/popup: loads from storage and fetches messages file.
 * In content scripts: requests data directly from background script.
 * @return {Promise<void>} A promise that resolves when initialization is complete.
 */
const initI18n = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (isContentScript()) {
        const backgroundData = await loadMessagesFromBackground();

        if (backgroundData) {
          cachedLang = backgroundData.lang || 'default';
          cachedMessages = backgroundData.messages || null;
        } else {
          cachedLang = 'default';
          cachedMessages = null;
        }
      } else {
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
 * Returns the current i18n state for React context and background script.
 * @return {Object} Current state with lang, messages, and isInitialized.
 */
const getI18nState = () => ({
  lang: cachedLang,
  messages: cachedMessages,
  isInitialized
});

export { getMessage, initI18n, resetI18nCache, getI18nState };
