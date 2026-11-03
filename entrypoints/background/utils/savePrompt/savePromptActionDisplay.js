// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time after showing a save prompt within which a navigation counts as the site's own redirect after login
* (the prompt goes along to the next page). After it, the user has seen the prompt and moved on.
* @type {number}
*/
export const SAVE_PROMPT_REDIRECT_GRACE_MS = 5000;

/**
* Time after the login request within which its save prompt may still be shown. An action that could not be shown by
* then (e.g. no page of the tab could display it) is dropped instead of surfacing later on an unrelated page.
* @type {number}
*/
export const SAVE_PROMPT_ACTION_TTL_MS = 60000;

/**
* Function to tell whether a save prompt action is older than its time to live.
* @param {Object} action - The save prompt action.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {boolean} True when the action has expired.
*/
export const isSavePromptActionExpired = (action, now = Date.now()) => typeof action?.createdAt === 'number' && now - action.createdAt > SAVE_PROMPT_ACTION_TTL_MS;

/**
* Function to drop the save prompt action of a tab when it has expired.
* @param {number} tabId - The ID of the tab.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {boolean} True when the action was removed.
*/
export const releaseExpiredSavePromptAction = (tabId, savePromptActions, now = Date.now()) => {
  if (!Array.isArray(savePromptActions)) {
    return false;
  }

  const actionIndex = savePromptActions.findIndex(a => a.tabId === tabId);

  if (actionIndex === -1 || !isSavePromptActionExpired(savePromptActions[actionIndex], now)) {
    return false;
  }

  savePromptActions.splice(actionIndex, 1);

  return true;
};

/**
* Function to record that the save prompt of a tab was displayed.
* @param {number} tabId - The ID of the tab.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {void}
*/
export const markSavePromptActionDisplayed = (tabId, savePromptActions, now = Date.now()) => {
  const action = savePromptActions?.find(a => a.tabId === tabId);

  if (action) {
    action.displayedAt = now;
  }
};

/**
* Function to drop the save prompt action of a tab that starts a navigation after the prompt was on screen
* longer than the redirect grace period, so the prompt does not reappear on the next pages of the site.
* @param {number} tabId - The ID of the tab.
* @param {Array} savePromptActions - The list of save prompt actions.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {boolean} True when the action was removed.
*/
export const releaseIgnoredSavePromptAction = (tabId, savePromptActions, now = Date.now()) => {
  if (!Array.isArray(savePromptActions)) {
    return false;
  }

  const actionIndex = savePromptActions.findIndex(a => a.tabId === tabId);

  if (actionIndex === -1) {
    return false;
  }

  const { displayedAt } = savePromptActions[actionIndex];

  if (typeof displayedAt !== 'number' || now - displayedAt <= SAVE_PROMPT_REDIRECT_GRACE_MS) {
    return false;
  }

  savePromptActions.splice(actionIndex, 1);

  return true;
};
