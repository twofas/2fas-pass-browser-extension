// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get the local key from storage.
* @return {Promise<string|null>} A promise that resolves to the local key or null if not found.
*/
const getLocalKey = async () => {
  const localKey = await storage.getItem('local:lKey');

  if (!localKey) {
    return null;
  }

  return localKey;
};

export default getLocalKey;
