// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time after "Add" or "Update" during which the prompt stays silent even though the request to the phone has not
* started yet (the popup window is still opening) — also covers logins that send the credentials twice.
* @type {number}
*/
export const SAVE_REQUEST_START_GRACE_MS = 10000;

/**
* Function to create the suppression stored for a tab after "Add" or "Update": it lasts only while the request runs.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {Object} The suppression to store under session:savePromptSuppressed-<tabId>.
*/
export const createSaveRequestSuppression = (now = Date.now()) => ({ type: 'saveRequest', at: now });

/**
* Function to tell whether the save prompt is silenced in a tab. `true` silences it until the tab leaves the page.
* A save request suppression silences it while the request to the phone runs, and before the request has started
* only for a short while; once a request started after the choice has ended (cancelled, failed), the prompt is back.
* @param {*} suppression - The value stored under session:savePromptSuppressed-<tabId>.
* @param {Object} saveRequest - The state of save prompt requests from getSavePromptRequestState.
* @param {boolean} saveRequest.active - Whether a request started from the save prompt is running.
* @param {number|null} [saveRequest.startedAt] - When the last request from the save prompt started, in milliseconds.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {boolean} True when the prompt is silenced.
*/
export const isTabSavePromptSuppressed = (suppression, saveRequest, now = Date.now()) => {
  if (suppression === true) {
    return true;
  }

  if (suppression?.type !== 'saveRequest' || typeof suppression.at !== 'number') {
    return false;
  }

  if (saveRequest?.active === true) {
    return true;
  }

  if (typeof saveRequest?.startedAt === 'number' && saveRequest.startedAt >= suppression.at) {
    return false;
  }

  return now - suppression.at <= SAVE_REQUEST_START_GRACE_MS;
};
