// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Function to remove the legacy on-disk local key.
* The local (transport-obfuscation) key used to live in `local:lKey`, persisted in plain
* form on disk and never rotated. It now lives in `storage.session` only, so any value left
* over on disk from older installs is removed here. A fresh key is generated on demand by
* getLocalKey when first needed.
* @async
* @return {Promise<void>} A promise that resolves when the legacy key is removed.
*/
const defaultStorage = async () => {
  const storageData = await browser.storage.local.get(null);

  // LEGACY ON-DISK LOCAL KEY
  if (storageData?.lKey) {
    await storage.removeItem('local:lKey');
  }
};

export default defaultStorage;
