// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardNumberTexts from './paymentCardNumberTexts.js';
import paymentCardFormTexts from '../paymentCardFormTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Function to get payment card number input selectors.
 * @return {Array<string>} An array of payment card number input selectors.
 */
const paymentCardNumberSelectors = () => {
  const selectors = [
    'input[autocomplete="cc-number"]',
    'input[name*="ccnumber"]',
    'input[name*="ccNumber"]',
    'input[name*="cc_number"]',
    'input[name*="cc-number"]',
    'input[name*="cardnumber"]',
    'input[name*="cardNumber"]',
    'input[name*="card_number"]',
    'input[name*="card-number"]',
    'input.card-number-input',
    'input.cardNumber-input',
    'input.cardnumber-input',
    'input.cc-number-input',
    'input.ccnumber-input',
    '[data-field="cardNumber"] input',
    '[data-field="card-number"] input',
    '[data-field="cc-number"] input',
    '.card-number-item input[type="text"]',
    '.cardNumber-item input[type="text"]'
  ];

  paymentCardNumberTexts.forEach(text => {
    selectors.push(`input#${text}`);
    selectors.push(`input#${text.toLowerCase()}`);
    selectors.push(`input#${text.toUpperCase()}`);
    selectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    paymentCardAttributes.forEach(attr => {
      selectors.push(`input[${attr}="${text}"]`);
      selectors.push(`input[${attr}="${text.toLowerCase()}"]`);
      selectors.push(`input[${attr}="${text.toUpperCase()}"]`);
      selectors.push(`input[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} input[type="text"]`);
    selectors.push(`#${text.toLowerCase()} input[type="text"]`);
    selectors.push(`#${text.toUpperCase()} input[type="text"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[type="text"]`);

    selectors.push(`#${text} input[type="tel"]`);
    selectors.push(`#${text.toLowerCase()} input[type="tel"]`);
    selectors.push(`#${text.toUpperCase()} input[type="tel"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[type="tel"]`);

    selectors.push(`.${text} input[type="text"]`);
    selectors.push(`.${text.toLowerCase()} input[type="text"]`);
    selectors.push(`.${text.toUpperCase()} input[type="text"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[type="text"]`);

    selectors.push(`.${text} input[type="tel"]`);
    selectors.push(`.${text.toLowerCase()} input[type="tel"]`);
    selectors.push(`.${text.toUpperCase()} input[type="tel"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[type="tel"]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardNumberSelectors;
