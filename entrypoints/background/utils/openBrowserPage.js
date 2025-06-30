// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to open a new browser page.
* @param {string} url - The URL of the page to open.
* @return {Promise<void>} A promise that resolves when the page is opened.
*/
const openBrowserPage = url => {
  return browser.tabs.create({ url });
};

export default openBrowserPage;
