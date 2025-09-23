// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { userNameTexts, userNameFormTexts, userNameAttributes } from '@/constants';

/** 
* Function to get user name input selectors.
* @return {Array<string>} An array of user name input selectors.
*/
const userNameSelectors = () => {
  const userNameSelectors = [
    'input[type="email"]'
  ];

  userNameTexts.forEach(text => {
    userNameSelectors.push(`input#${text}`);
    userNameSelectors.push(`input#${text.toLowerCase()}`);
    userNameSelectors.push(`input#${text.toUpperCase()}`);
    userNameSelectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    userNameAttributes.forEach(attr => {
      userNameSelectors.push(`input[${attr}="${text}"]`);
      userNameSelectors.push(`input[${attr}="${text.toLowerCase()}"]`);
      userNameSelectors.push(`input[${attr}="${text.toUpperCase()}"]`);
      userNameSelectors.push(`input[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
    });
  });

  userNameFormTexts.forEach(text => {
    userNameSelectors.push(`#${text} input:not([type="password"])`);
    userNameSelectors.push(`#${text.toLowerCase()} input:not([type="password"])`);
    userNameSelectors.push(`#${text.toUpperCase()} input:not([type="password"])`);
    userNameSelectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input:not([type="password"])`);

    userNameSelectors.push(`.${text} input:not([type="password"])`);
    userNameSelectors.push(`.${text.toLowerCase()} input:not([type="password"])`);
    userNameSelectors.push(`.${text.toUpperCase()} input:not([type="password"])`);
    userNameSelectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input:not([type="password"])`);
  });

  return [...new Set(userNameSelectors)];
};

export default userNameSelectors;
