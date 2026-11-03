// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import checkPromptCS from '@/partials/contentScript/checkPromptCS';
import tabIsInternal from '@/partials/functions/tabIsInternal';

/**
* Function to inject prompt.js into the loaded web page active in each window. Pages loaded while the vault was locked
* have no prompt.js (onTabUpdated and onTabActivated stop at the lock), so it is called on unlock; tabs activated later
* get it from onTabActivated, and tabs still loading from onTabUpdated.
* @async
* @return {Promise<void>}
*/
const injectPromptCSIntoActiveTabs = async () => {
  let tabs = [];

  try {
    tabs = await browser.tabs.query({ active: true });
  } catch {
    return;
  }

  const webTabs = (tabs || []).filter(tab => tab?.id && tab.status === 'complete' && !tab.discarded && !tabIsInternal(tab));

  await Promise.all(webTabs.map(tab => checkPromptCS(tab.id).catch(() => {})));
};

export default injectPromptCSIntoActiveTabs;
