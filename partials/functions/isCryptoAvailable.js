// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Checks if WebCrypto API is available in the current environment.
* @return {boolean} True if WebCrypto API is available, false otherwise.
*/
const isCryptoAvailable = () => {
  return !!(crypto && crypto?.subtle && typeof crypto?.subtle?.importKey === 'function' && typeof crypto?.subtle?.encrypt === 'function');
};

export default isCryptoAvailable;
