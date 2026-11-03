// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { wsState } from '../../websocket/wsState';

/**
* When the last request from the save prompt started, in milliseconds (kept in memory only).
* @type {number|null}
*/
let lastStartedAt = null;

/**
* Function to record that a request from the save prompt started.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {void}
*/
export const noteSavePromptRequestStart = (now = Date.now()) => {
  lastStartedAt = now;
};

/**
* Function to tell whether a request to the phone started from the save prompt ("Add", "Update") is running.
* @return {boolean} True while the request runs; false once it was cancelled, failed or ended.
*/
const isSavePromptRequestActive = () => wsState.active === true && wsState.type === 'fetch' && wsState.fetchLocationState?.from === 'savePrompt';

/**
* Function to get the state of save prompt requests.
* @return {{ active: boolean, startedAt: number|null }} Whether a request runs and when the last one started.
*/
export const getSavePromptRequestState = () => ({ active: isSavePromptRequestActive(), startedAt: lastStartedAt });

export default isSavePromptRequestActive;
