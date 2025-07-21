// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to open the installation page.
* @async
* @param {Object} request - The request object containing the input data.
* @param {Object} sender - The sender object containing information about the tab.
* @param {Object} tabsInputData - The object storing input data for each tab.
* @return {Promise<void>} A promise that resolves when the installation page is opened.
*/
const openInstallPage = async () => {
  let extURL, tabQuery;

  try {
    extURL = browser.runtime.getURL('/install.html');
  } catch {}

  if (!extURL) {
    await browser.tabs.create({ url: 'install.html' });
  }

  try {
    tabQuery = await browser.tabs.query({ url: extURL });
  } catch {}

  const installPageExists = tabQuery && tabQuery.length > 0;

  if (!installPageExists) {
    await browser.tabs.create({ url: 'install.html' });
  } else {
    const windowData = tabQuery[0];

    if (windowData && windowData?.windowId && windowData?.id) {
      try {
        await browser.windows.update(windowData.windowId, { focused: true });
        await browser.tabs.update(windowData.id, { url: extURL, highlighted: true });
      } catch {
        await browser.tabs.create({ url: 'install.html' });
      }
    }
  }
};

export default openInstallPage;
