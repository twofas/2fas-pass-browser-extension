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
    'input[autocomplete*="cc-csc" i]',
    '[autocomplete="cc-csc"] input',
    '[autocomplete*="cc-csc" i] input',
    'input[data-braintree-name="cvv"]',
    'input[name*="cvc" i]',
    'input[name*="cvv" i]',
    'input[name*="csc" i]',
    'input[name*="securitycode" i]',
    'input[name*="security_code" i]',
    'input[name*="security-code" i]',
    'input[name*="cardcode" i]',
    'input[name*="card_code" i]',
    'input[name*="card-code" i]',
    'input[id*="cvc" i]',
    'input[id*="cvv" i]',
    'input[id*="csc" i]',
    'input[id*="securitycode" i]',
    'input[id*="security_code" i]',
    'input[id*="security-code" i]',
    'input[id*="cardcode" i]',
    'input[id*="card_code" i]',
    'input[id*="card-code" i]',
    'input.cvv-item',
    'input.cvc-item',
    'input.csc-item',
    'input.cvv-input',
    'input.cvc-input',
    'input.csc-input',
    'input.security-code-input',
    '.cvv-form-item input[type="text"]',
    '.cvc-form-item input[type="text"]',
    '.cvv-item input[type="text"]',
    '.cvc-item input[type="text"]',
    '[data-field="cvv" i] input',
    '[data-field="cvc" i] input',
    '[data-field="csc" i] input',
    '[data-field="securitycode" i] input',
    '[data-field="security-code" i] input',
    '.js-card-code input[type="text"]',
    '.js-card-code input:not([type])',
    '.js-card-cvv input[type="text"]',
    '.js-card-cvv input:not([type])',
    '.js-card-cvc input[type="text"]',
    '.js-card-cvc input:not([type])',
    '.js-cardcode input[type="text"]',
    '.js-cardcvv input[type="text"]',
    '.js-cardcvc input[type="text"]',
    '.credit-input.js-card-code input',
    '.credit-input-h.js-card-code input',
    'input[placeholder="000"]',
    'input[placeholder="0000"]',
    'input[placeholder*="cvv" i]',
    'input[placeholder*="cvc" i]',
    'input[placeholder*="csc" i]',
    'input[placeholder*="security code" i]',
    'input.wpwl-control-cvv',
    '.wpwl-group-cvv input'
  ];

  paymentCardSecurityCodeTexts.forEach(text => {
    selectors.push(`input#${text}`);
    selectors.push(`input#${text.toLowerCase()}`);
    selectors.push(`input#${text.toUpperCase()}`);
    selectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    paymentCardAttributes.forEach(attr => {
      selectors.push(`input[${attr}="${text}" i]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} input[name*="cvv" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="cvv" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="cvv" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvv" i]`);

    selectors.push(`#${text} input[name*="cvc" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="cvc" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="cvc" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvc" i]`);

    selectors.push(`#${text} input[name*="csc" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="csc" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="csc" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="csc" i]`);

    selectors.push(`.${text} input[name*="cvv" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="cvv" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="cvv" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvv" i]`);

    selectors.push(`.${text} input[name*="cvc" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="cvc" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="cvc" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="cvc" i]`);

    selectors.push(`.${text} input[name*="csc" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="csc" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="csc" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="csc" i]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardSecurityCodeSelectors;
