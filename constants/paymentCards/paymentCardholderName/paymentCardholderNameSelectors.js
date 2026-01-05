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
    'input[name*="cc_uname" i]',
    'input[name*="ccuname" i]',
    'input[name*="cardname" i]',
    'input[name*="card_name" i]',
    'input[name*="card-name" i]',
    'input[name*="ccname" i]',
    'input[name*="cc_name" i]',
    'input[name*="cc-name" i]',
    'input[name*="cardholder" i]',
    'input[name*="card_holder" i]',
    'input[name*="card-holder" i]',
    'input[name*="nameoncard" i]',
    'input[name*="name_on_card" i]',
    'input[name*="name-on-card" i]',
    '[data-field="cardHolderName" i] input',
    '[data-field="cardholderName" i] input',
    '[data-field="cardholder-name" i] input',
    '[data-field="card-holder-name" i] input',
    '[data-field="holderName" i] input',
    '[data-field="holder-name" i] input',
    '[data-field="ccName" i] input',
    '[data-field="cc-name" i] input',
    'input.cardholder-input',
    'input.cardHolderName-input',
    'input.holder-name-input',
    'input.wpwl-control-cardHolder',
    '.wpwl-group-cardHolder input',
    'input[name="card.holder"]'
  ];

  paymentCardholderNameTexts.forEach(text => {
    selectors.push(`input#${text}`);
    selectors.push(`input#${text.toLowerCase()}`);
    selectors.push(`input#${text.toUpperCase()}`);
    selectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    paymentCardAttributes.forEach(attr => {
      selectors.push(`input[${attr}="${text}" i]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} input[name*="name" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="name" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="name" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="name" i]`);

    selectors.push(`.${text} input[name*="name" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="name" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="name" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="name" i]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardholderNameSelectors;
