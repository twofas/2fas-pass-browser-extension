// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to generate a session ID.
* @async
* @return {Promise<string>} A promise that resolves to the generated session ID.
*/
const generateSessionID = async () => {
  try {
    const nonceArray = new Uint32Array(16);
    const nonce = [...crypto.getRandomValues(nonceArray)].map(m=>('0'+m.toString(16)).slice(-2)).join('');
    return nonce;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateSessionID, { event: e });
  }
};

export default generateSessionID;
