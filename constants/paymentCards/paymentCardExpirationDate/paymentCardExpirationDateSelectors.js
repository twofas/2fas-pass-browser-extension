// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardExpirationDateTexts from './paymentCardExpirationDateTexts.js';
import paymentCardFormTexts from '../paymentCardFormTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Function to get payment card expiration date input selectors.
 * @return {Array<string>} An array of payment card expiration date input selectors.
 */
const paymentCardExpirationDateSelectors = () => {
  const selectors = [
    'input[autocomplete="cc-exp"]',
    'input[autocomplete="cc-exp-month"]',
    'input[autocomplete="cc-exp-year"]',
    'select[autocomplete="cc-exp-month"]',
    'select[autocomplete="cc-exp-year"]'
  ];

  paymentCardExpirationDateTexts.forEach(text => {
    selectors.push(`input#${text}`);
    selectors.push(`input#${text.toLowerCase()}`);
    selectors.push(`input#${text.toUpperCase()}`);
    selectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    selectors.push(`select#${text}`);
    selectors.push(`select#${text.toLowerCase()}`);
    selectors.push(`select#${text.toUpperCase()}`);
    selectors.push(`select#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    paymentCardAttributes.forEach(attr => {
      selectors.push(`input[${attr}="${text}"]`);
      selectors.push(`input[${attr}="${text.toLowerCase()}"]`);
      selectors.push(`input[${attr}="${text.toUpperCase()}"]`);
      selectors.push(`input[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);

      selectors.push(`select[${attr}="${text}"]`);
      selectors.push(`select[${attr}="${text.toLowerCase()}"]`);
      selectors.push(`select[${attr}="${text.toUpperCase()}"]`);
      selectors.push(`select[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} input[name*="exp"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="exp"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="exp"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="exp"]`);

    selectors.push(`#${text} select[name*="exp"]`);
    selectors.push(`#${text.toLowerCase()} select[name*="exp"]`);
    selectors.push(`#${text.toUpperCase()} select[name*="exp"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="exp"]`);

    selectors.push(`.${text} input[name*="exp"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="exp"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="exp"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="exp"]`);

    selectors.push(`.${text} select[name*="exp"]`);
    selectors.push(`.${text.toLowerCase()} select[name*="exp"]`);
    selectors.push(`.${text.toUpperCase()} select[name*="exp"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="exp"]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardExpirationDateSelectors;
