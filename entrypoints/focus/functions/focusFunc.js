// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to handle focus events.
* @async
* @param {boolean} cryptoAvailable - Indicates if the crypto API is available.
* @return {Promise<void>} A promise that resolves when the message is sent.
*/
const focusFunc = async cryptoAvailable => {
  await browser.runtime.sendMessage({
    action: REQUEST_ACTIONS.TAB_FOCUS,
    target: REQUEST_TARGETS.BACKGROUND,
    cryptoAvailable
  });
};

export default focusFunc;
