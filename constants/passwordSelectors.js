// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function to get password input selectors.
* @return {Array<string>} An array of password input selectors.
*/
const passwordSelectors = () => {
  const passwordSelectors = [
    'input[type="password"]'
  ];

  return passwordSelectors;
};

export default passwordSelectors;
