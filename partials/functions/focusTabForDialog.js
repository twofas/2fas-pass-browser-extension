// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Focuses the tab's window and activates the tab, then waits a short, configured
* delay before a cross-domain confirmation dialog is shown in that tab.
*
* The wait is required because window focus and tab activation settle
* asynchronously after the browser API calls resolve; without it the modal
* dialog can fail to grab focus or render on the freshly activated tab. The
* delay duration lives in config.crossDomainDialogFocusDelay. Errors (e.g. the
* tab having been closed in the meantime) are swallowed so the caller can still
* attempt to show the dialog.
* @async
* @param {number} tabId - The ID of the tab to focus before showing the dialog.
* @return {Promise<void>}
*/
const focusTabForDialog = async tabId => {
  try {
    const tab = await browser.tabs.get(tabId);

    await browser.windows.update(tab.windowId, { focused: true });
    await browser.tabs.update(tabId, { active: true });
    await new Promise(resolve => setTimeout(resolve, config.crossDomainDialogFocusDelay));
  } catch { }
};

export default focusTabForDialog;
