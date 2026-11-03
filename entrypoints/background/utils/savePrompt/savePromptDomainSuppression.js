// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { getRootDomain } from './checkDomainOnIgnoredList';

/**
* Function to build the session storage key of the save prompt domain suppression of a tab.
* @param {number} tabId - The ID of the tab.
* @return {string} The storage key.
*/
export const getSavePromptDomainSuppressionKey = tabId => `session:savePromptDomainSuppressed-${tabId}`;

/**
* Function to get the root domain of a URL.
* @param {string} url - The URL.
* @return {string|null} The root domain, or null when the URL cannot be parsed.
*/
const getUrlRootDomain = url => {
  try {
    const { hostname } = new URL(url);

    return hostname ? getRootDomain(hostname) : null;
  } catch {
    return null;
  }
};

/**
* Function to tell whether a Login autofill used a secret pulled from the phone for this fill only (a Highly Secret
* item fetched with "fetch & autofill"). Such a secret is never saved, so the vault cannot recognise the credentials
* the page sends afterwards.
* @param {Object} closeData - The close data of the autofill.
* @return {boolean} True when the autofilled secret was pulled and not saved.
*/
export const isFetchedSifAutofill = closeData => Boolean(closeData?.encryptionItemT2KeyB64);

/**
* Function to turn the save prompt off in a tab for the root domain it shows. Used after a fetch & autofill: the
* pulled password is not saved, so every login with it would otherwise offer to update the item.
* @async
* @param {number} tabId - The ID of the tab.
* @return {Promise<void>}
*/
export const suppressSavePromptForTabDomain = async tabId => {
  let tab;

  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return;
  }

  const rootDomain = getUrlRootDomain(tab?.url);

  if (!rootDomain) {
    return;
  }

  await storage.setItem(getSavePromptDomainSuppressionKey(tabId), rootDomain);
  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - suppressSavePromptForTabDomain');
};

/**
* Function to tell whether the save prompt is turned off in a tab for the root domain of a URL.
* @async
* @param {number} tabId - The ID of the tab.
* @param {string} url - The URL of the page.
* @return {Promise<boolean>} True when the save prompt is suppressed.
*/
export const isSavePromptSuppressedForDomain = async (tabId, url) => {
  const suppressedDomain = await storage.getItem(getSavePromptDomainSuppressionKey(tabId));

  if (!suppressedDomain) {
    return false;
  }

  return getUrlRootDomain(url) === suppressedDomain;
};

/**
* Function to drop the save prompt domain suppression of a tab that navigated to another root domain.
* @async
* @param {number} tabId - The ID of the tab.
* @param {string} url - The new URL of the tab.
* @return {Promise<void>}
*/
export const releaseSavePromptDomainSuppression = async (tabId, url) => {
  const rootDomain = getUrlRootDomain(url);

  if (!rootDomain) {
    return;
  }

  const suppressedDomain = await storage.getItem(getSavePromptDomainSuppressionKey(tabId));

  if (!suppressedDomain || suppressedDomain === rootDomain) {
    return;
  }

  await clearSavePromptDomainSuppression(tabId);
};

/**
* Function to drop the save prompt domain suppression of a tab.
* @async
* @param {number} tabId - The ID of the tab.
* @return {Promise<void>}
*/
export const clearSavePromptDomainSuppression = async tabId => {
  await storage.removeItem(getSavePromptDomainSuppressionKey(tabId));
  logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'BackgroundSW - session write - clearSavePromptDomainSuppression');
};
