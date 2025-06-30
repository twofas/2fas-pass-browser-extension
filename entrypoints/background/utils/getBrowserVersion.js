// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the browser version from the user agent string.
* @param {string} userAgent - The user agent string to parse.
* @param {RegExp} regex - The regular expression to match the version.
* @return {string} The browser version or '0.0.0.0' if not found.
*/
const getBrowserVersion = (userAgent, regex) => {
  if (!userAgent || !regex) {
    return '0.0.0.0';
  }

  const match = userAgent.match(regex);
  return match ? match[2] : '0.0.0.0';
};

export default getBrowserVersion;
