// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Number of SHA-256 bytes kept in a local key id.
* @type {number}
*/
const KEY_ID_BYTES = 12;

/**
* Function to compute the id of a local key: a truncated SHA-256 of the key. It tells keys apart without revealing them,
* so a value encrypted with a key rotated out by a lock can be recognised.
* @async
* @param {string} localKeyB64 - The base64 local key.
* @return {Promise<string|null>} The base64 key id, or null without a key.
*/
const getLocalKeyId = async localKeyB64 => {
  if (!localKeyB64) {
    return null;
  }

  const localKeyAB = Base64ToArrayBuffer(localKeyB64);

  try {
    const digest = await crypto.subtle.digest('SHA-256', localKeyAB);

    return ArrayBufferToBase64(digest.slice(0, KEY_ID_BYTES));
  } finally {
    wipeBuffer(localKeyAB);
  }
};

export default getLocalKeyId;
