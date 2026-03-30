// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const ALLOWED_SCHEMES = ['https:', 'chrome:', 'edge:', 'opera:', 'about:', 'safari-extension:', 'safari-web-extension:'];

/**
* Function to open a new browser page.
* @param {string} url - The URL of the page to open.
* @return {Promise<void>} A promise that resolves when the page is opened.
*/
const openBrowserPage = url => {
  try {
    const parsed = new URL(url);

    if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
      return Promise.reject(new Error('URL scheme not allowed'));
    }
  } catch {
    return Promise.reject(new Error('Invalid URL'));
  }

  return browser.tabs.create({ url });
};

export default openBrowserPage;
