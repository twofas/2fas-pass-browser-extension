// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Safari 18.4 added requestBody / extraInfoSpec to webRequest.onBeforeRequest,
// which the save prompt needs to detect a login submission.
const SAFARI_MIN_SAVE_PROMPT_VERSION = Object.freeze({ major: 18, minor: 4 });

/**
* Function to read the Safari version from a user agent string.
* @param {string} userAgent - The user agent string.
* @return {{ major: number, minor: number }|null} The Safari version, or null when the user agent has no Safari version.
*/
export const getSafariVersion = userAgent => {
  const match = /\bVersion\/(\d+)(?:\.(\d+))?/.exec(userAgent || '');

  if (!match) {
    return null;
  }

  return { major: Number(match[1]), minor: Number(match[2] || 0) };
};

/**
* Function to check whether the save prompt can work in the current browser. Always true outside Safari; on Safari only from 18.4.
* @param {string} [userAgent] - The user agent string, navigator.userAgent by default.
* @return {boolean} True when the save prompt is supported.
*/
const isSavePromptSupported = (userAgent = globalThis?.navigator?.userAgent) => {
  if (import.meta.env.BROWSER !== 'safari') {
    return true;
  }

  const version = getSafariVersion(userAgent);

  if (!version) {
    return false;
  }

  if (version.major !== SAFARI_MIN_SAVE_PROMPT_VERSION.major) {
    return version.major > SAFARI_MIN_SAVE_PROMPT_VERSION.major;
  }

  return version.minor >= SAFARI_MIN_SAVE_PROMPT_VERSION.minor;
};

export default isSavePromptSupported;
