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
    const sessionIdArray = new Uint8Array(16);
    crypto.getRandomValues(sessionIdArray);

    const sessionId = Array.from(sessionIdArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return sessionId;
  } catch (e) {
    throw new TwoFasError(TwoFasError.errors.generateSessionID, { event: e });
  }
};

export default generateSessionID;
