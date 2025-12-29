// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardholderNameTexts from './paymentCardholderNameTexts.js';
import paymentCardFormTexts from '../paymentCardFormTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Function to get payment cardholder name input selectors.
 * @return {Array<string>} An array of payment cardholder name input selectors.
 */
const paymentCardholderNameSelectors = () => {
  const selectors = [
    'input[autocomplete="cc-name"]',
    'input[autocomplete="cc-given-name"]',
    'input[autocomplete="cc-additional-name"]',
    'input[autocomplete="cc-family-name"]',
    'input[name*="cc_uname"]',
    'input[name*="ccuname"]',
    'input[name*="cardname"]',
    'input[name*="cardName"]',
    'input[name*="card_name"]',
    'input[name*="card-name"]',
    'input[name*="ccname"]',
    'input[name*="ccName"]',
    'input[name*="cc_name"]',
    'input[name*="cc-name"]',
    'input[name*="cardholder"]',
    'input[name*="cardHolder"]',
    'input[name*="card_holder"]',
    'input[name*="card-holder"]',
    'input[name*="nameoncard"]',
    'input[name*="nameOnCard"]',
    'input[name*="name_on_card"]',
    'input[name*="name-on-card"]',
    '[data-field="cardHolderName"] input',
    '[data-field="cardholderName"] input',
    '[data-field="cardholder-name"] input',
    '[data-field="card-holder-name"] input',
    '[data-field="holderName"] input',
    '[data-field="holder-name"] input',
    '[data-field="ccName"] input',
    '[data-field="cc-name"] input',
    'input.cardholder-input',
    'input.cardHolderName-input',
    'input.holder-name-input'
  ];

  paymentCardholderNameTexts.forEach(text => {
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
    selectors.push(`#${text} input[name*="name"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="name"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="name"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="name"]`);

    selectors.push(`.${text} input[name*="name"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="name"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="name"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="name"]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardholderNameSelectors;
