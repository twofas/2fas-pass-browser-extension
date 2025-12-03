// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardSecurityCodeTexts from './paymentCardSecurityCodeTexts.js';
import paymentCardFormTexts from '../paymentCardFormTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Function to get payment card security code input selectors.
 * @return {Array<string>} An array of payment card security code input selectors.
 */
const paymentCardSecurityCodeSelectors = () => {
  const selectors = [
    'input[autocomplete="cc-csc"]',
    'input[name*="cvc"]',
    'input[name*="cvv"]',
    'input[name*="csc"]',
    'input[name*="securitycode"]',
    'input[name*="securityCode"]',
    'input[name*="security_code"]',
    'input[name*="security-code"]',
    'input[name*="cardcode"]',
    'input[name*="cardCode"]',
    'input[name*="card_code"]',
    'input[name*="card-code"]'
  ];

  paymentCardSecurityCodeTexts.forEach(text => {
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
    selectors.push(`#${text} input[name*="cvv"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="cvv"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="cvv"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvv"]`);

    selectors.push(`#${text} input[name*="cvc"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="cvc"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="cvc"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvc"]`);

    selectors.push(`#${text} input[name*="csc"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="csc"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="csc"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="csc"]`);

    selectors.push(`.${text} input[name*="cvv"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="cvv"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="cvv"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvv"]`);

    selectors.push(`.${text} input[name*="cvc"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="cvc"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="cvc"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvc"]`);

    selectors.push(`.${text} input[name*="csc"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="csc"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="csc"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="csc"]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardSecurityCodeSelectors;
