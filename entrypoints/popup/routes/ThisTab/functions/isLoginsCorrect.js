// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to check if the logins are correct.
* @param {Array} logins - The array of login items.
* @return {boolean} True if the logins are correct, false otherwise.
*/
const isLoginsCorrect = logins => {
  if (!logins || !Array.isArray(logins) || logins?.length <= 0) {
    return false;
  }

  return true;
};

export default isLoginsCorrect;
