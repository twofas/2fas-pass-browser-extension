// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Time after which a login request whose decision or outcome never arrived is forgotten.
* @type {number}
*/
export const PENDING_SAVE_PROMPT_REQUEST_TTL_MS = 60000;

/**
* Function to tell whether a response status means the request failed (4xx, 5xx). A missing status is not a failure.
* @param {number} [statusCode] - The response status code.
* @return {boolean} True when the status is an error status.
*/
export const isFailedResponseStatus = statusCode => typeof statusCode === 'number' && statusCode >= 400;

/**
* Function to show the prompt of a request once both its decision and its outcome are known.
* @async
* @param {Map} pending - The pending requests, keyed by request ID.
* @param {string} requestId - The ID of the web request.
* @return {Promise<void>}
*/
const settle = async (pending, requestId) => {
  const entry = pending.get(requestId);

  if (!entry || entry.show === undefined || entry.succeeded === undefined) {
    return;
  }

  pending.delete(requestId);

  if (entry.succeeded && typeof entry.show === 'function') {
    await entry.show();
  }
};

/**
* Function to start tracking a login request that may end with a save prompt. Requests older than the time to live
* are dropped at the same time.
* @param {Map} pending - The pending requests, keyed by request ID.
* @param {string} requestId - The ID of the web request.
* @param {number} [now=Date.now()] - The current time in milliseconds.
* @return {void}
*/
export const trackSavePromptRequest = (pending, requestId, now = Date.now()) => {
  pending.forEach((entry, id) => {
    if (now - entry.createdAt > PENDING_SAVE_PROMPT_REQUEST_TTL_MS) {
      pending.delete(id);
    }
  });

  pending.set(requestId, { createdAt: now, show: undefined, succeeded: undefined });
};

/**
* Function to record whether a tracked request qualifies for a save prompt.
* @async
* @param {Map} pending - The pending requests, keyed by request ID.
* @param {string} requestId - The ID of the web request.
* @param {Function|null} show - Shows the save prompt, or null when the request does not qualify.
* @return {Promise<void>}
*/
export const resolveSavePromptRequest = async (pending, requestId, show) => {
  const entry = pending.get(requestId);

  if (!entry) {
    return;
  }

  if (typeof show !== 'function') {
    pending.delete(requestId);
    return;
  }

  entry.show = show;

  await settle(pending, requestId);
};

/**
* Function to record how a tracked request ended.
* @async
* @param {Map} pending - The pending requests, keyed by request ID.
* @param {string} requestId - The ID of the web request.
* @param {boolean} succeeded - False when the request failed or its response has an error status.
* @return {Promise<void>}
*/
export const completeSavePromptRequest = async (pending, requestId, succeeded) => {
  const entry = pending.get(requestId);

  if (!entry) {
    return;
  }

  if (!succeeded) {
    pending.delete(requestId);
    return;
  }

  entry.succeeded = true;

  await settle(pending, requestId);
};
