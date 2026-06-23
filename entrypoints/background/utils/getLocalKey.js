// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateLocalKey from './generateLocalKey.js';

/**
* Function to get the local key from session storage, regenerating it if missing.
* The local key only obfuscates values in transit between extension contexts; it is
* NOT an at-rest protection. It lives in `storage.session` so it never touches disk and
* is wiped whenever the browser closes or the extension locks (idle lock / manual lock),
* after which a fresh key is generated on demand.
* @return {Promise<string|null>} A promise that resolves to the local key or null if generation fails.
*/
const getLocalKey = async () => {
  const localKey = await storage.getItem('session:lKey');

  if (localKey) {
    return localKey;
  }

  try {
    const newKey = await generateLocalKey();
    await storage.setItem('session:lKey', newKey);

    return newKey;
  } catch (e) {
    await CatchError(e);

    return null;
  }
};

export default getLocalKey;
