// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import userNameTexts from '@/constants/userNameTexts';
import userNameFormTexts from '@/constants/userNameFormTexts';

/** 
* Function to get user name input selectors.
* @return {Array<string>} An array of user name input selectors.
*/
const userNameSelectors = () => {
  const userNameSelectors = [
    'input[type="email"]'
  ];

  userNameTexts.forEach(text => {
    userNameSelectors.push(`input#${text.toLowerCase()}`);
    userNameSelectors.push(`input#${text.toUpperCase()}`);
    userNameSelectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);
    userNameSelectors.push(`input[name="${text.toLowerCase()}"]`);
    userNameSelectors.push(`input[name="${text.toUpperCase()}"]`);
    userNameSelectors.push(`input[name="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
    userNameSelectors.push(`input[autocomplete="${text.toLowerCase()}"]`);
    userNameSelectors.push(`input[autocomplete="${text.toUpperCase()}"]`);
    userNameSelectors.push(`input[autocomplete="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
  });

  userNameFormTexts.forEach(text => {
    userNameSelectors.push(`#${text.toLowerCase()} input:not([type="password"])`);
    userNameSelectors.push(`#${text.toUpperCase()} input:not([type="password"])`);
    userNameSelectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input:not([type="password"])`);
    userNameSelectors.push(`.${text.toLowerCase()} input:not([type="password"])`);
    userNameSelectors.push(`.${text.toUpperCase()} input:not([type="password"])`);
    userNameSelectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input:not([type="password"])`);
  });

  return userNameSelectors;
};

export default userNameSelectors;
