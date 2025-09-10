// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle actions when an update is available.
* @async
* @param {Object} details - Update details including version information
* @return {Promise<void>}
*/
const onUpdateAvailable = async details => {
  try {
    await browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.UPDATE_AVAILABLE,
      target: REQUEST_TARGETS.POPUP_THIS_TAB,
      version: details?.version
    });
  } catch {}
};

export default onUpdateAvailable;
