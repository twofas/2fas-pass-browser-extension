// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time before a request within which a login form submitted by the user counts for it.
* @type {number}
*/
export const SUBMIT_INTENT_WINDOW_MS = 3000;

/**
* Time after the start of a request within which a submit may still be reported: the page sends its request from the
* same click, so the content script message can reach the background a moment later.
* @type {number}
*/
const SUBMIT_INTENT_LATE_MS = 1000;

/**
* The last login form submit of each tab ({ origin, time }), kept in memory only.
* @type {Map<number, Object>}
*/
const submitIntents = new Map();

/**
* Function to record that the user submitted a login form in a tab.
* @param {number} tabId - The ID of the tab.
* @param {string} origin - The origin of the frame with the form.
* @param {number} [time=Date.now()] - The time the submit was reported, in milliseconds.
* @return {void}
*/
export const recordSubmitIntent = (tabId, origin, time = Date.now()) => {
  if (!tabId || !origin) {
    return;
  }

  submitIntents.set(tabId, { origin, time });
};

/**
* Function to tell whether the user submitted a login form of the origin shortly before the request.
* @param {number} tabId - The ID of the tab.
* @param {string} origin - The origin of the page that sent the request.
* @param {number} requestTime - The time the request started, in milliseconds.
* @return {boolean} True when a submit counts for the request.
*/
export const hasRecentSubmitIntent = (tabId, origin, requestTime) => {
  if (!tabId || !origin || typeof requestTime !== 'number') {
    return false;
  }

  const intent = submitIntents.get(tabId);

  if (!intent || intent.origin !== origin) {
    return false;
  }

  return intent.time >= requestTime - SUBMIT_INTENT_WINDOW_MS && intent.time <= requestTime + SUBMIT_INTENT_LATE_MS;
};

/**
* Function to forget the submit of a tab.
* @param {number} tabId - The ID of the tab.
* @return {void}
*/
export const clearSubmitIntent = tabId => {
  submitIntents.delete(tabId);
};

/**
* Function to forget the submits of all tabs.
* @return {void}
*/
export const resetSubmitIntents = () => {
  submitIntents.clear();
};
