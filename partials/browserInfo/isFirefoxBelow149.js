// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Detects whether the extension runs on Firefox older than version 149.
* Before Firefox 149, browser.action.openPopup() could only be called from a
* user gesture context, so calls made after awaited operations reject silently.
* Firefox 149 removed that requirement. Should only be called on Firefox builds
* (browser.runtime.getBrowserInfo is a Firefox-only API); on other browsers it
* resolves to false.
* @async
* @return {Promise<boolean>} True only when the running Firefox version is below 149.
*/
const isFirefoxBelow149 = async () => {
  try {
    const browserInfo = await browser.runtime.getBrowserInfo();
    const majorVersion = parseInt(browserInfo?.version, 10);

    return Number.isInteger(majorVersion) && majorVersion < 149;
  } catch {
    return false;
  }
};

export default isFirefoxBelow149;
