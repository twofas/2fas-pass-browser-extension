// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateLocalKey from './generateLocalKey.js';

/**
* Function to force a fresh local (transport-obfuscation) key into session storage.
* Unlike getLocalKey, this always generates a new key and overwrites any existing one.
* It is invoked when the extension locks (idle lock / manual lock) so a brand new key
* is in place for the next session, ensuring the previous transport key is never reused.
* @return {Promise<string|null>} A promise that resolves to the new local key or null if generation fails.
*/
const regenerateLocalKey = async () => {
  try {
    const newKey = await generateLocalKey();
    await storage.setItem('session:lKey', newKey);

    return newKey;
  } catch (e) {
    await CatchError(e);

    return null;
  }
};

export default regenerateLocalKey;
