// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import generateLocalKey from './generateLocalKey.js';

/**
* Function to get the local key from storage, regenerating it if missing.
* @return {Promise<string|null>} A promise that resolves to the local key or null if generation fails.
*/
const getLocalKey = async () => {
  const localKey = await storage.getItem('local:lKey');

  if (localKey) {
    return localKey;
  }

  try {
    const newKey = await generateLocalKey();
    await storage.setItem('local:lKey', newKey);

    return newKey;
  } catch (e) {
    await CatchError(e);

    return null;
  }
};

export default getLocalKey;
