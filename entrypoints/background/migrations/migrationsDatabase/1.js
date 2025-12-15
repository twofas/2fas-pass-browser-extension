// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to set default values for storage.
* @async
* @return {Promise<void>} A promise that resolves when the default storage is set.
*/
const defaultStorage = async () => {
  const storageData = await browser.storage.local.get(null);

  // ALL LOGINS SORT
  if (storageData?.allLoginsSort) {
    await storage.removeItem('local:allLoginsSort');
  }
};

export default defaultStorage;
