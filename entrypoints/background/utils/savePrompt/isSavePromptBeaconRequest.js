// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// navigator.sendBeacon() is reported as 'ping' by Chromium and as 'beacon' by Firefox and Safari.
const SAVE_PROMPT_BEACON_TYPES = new Set(['ping', 'beacon']);

/**
* Function to check whether a webRequest has a beacon request type.
* @param {Object} details - WebRequest details object.
* @return {boolean} True for a ping / beacon request.
*/
export const isSavePromptBeaconType = details => SAVE_PROMPT_BEACON_TYPES.has(details?.type);

/**
* Function to check whether a webRequest is the prompt.js beacon carrying pending inputs.
* @param {Object} details - WebRequest details object.
* @return {boolean} True for a ping / beacon request to the save prompt beacon origin.
*/
const isSavePromptBeaconRequest = details => {
  if (!isSavePromptBeaconType(details) || !details?.url) {
    return false;
  }

  try {
    return new URL(details.url).origin === `https://${import.meta.env.VITE_BEACON}.invalid`;
  } catch {
    return false;
  }
};

export default isSavePromptBeaconRequest;
