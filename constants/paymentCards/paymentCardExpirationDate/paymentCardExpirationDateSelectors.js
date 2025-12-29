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
    'input[autocomplete*="cc-exp" i]',
    '[autocomplete="cc-exp"] input',
    '[autocomplete*="cc-exp" i] input',
    'input[autocomplete="cc-exp-month"]',
    'input[autocomplete*="cc-exp-month" i]',
    '[autocomplete="cc-exp-month"] input',
    '[autocomplete*="cc-exp-month" i] input',
    'input[autocomplete="cc-exp-year"]',
    'input[autocomplete*="cc-exp-year" i]',
    '[autocomplete="cc-exp-year"] input',
    '[autocomplete*="cc-exp-year" i] input',
    'select[autocomplete="cc-exp-month"]',
    'select[autocomplete*="cc-exp-month" i]',
    '[autocomplete="cc-exp-month"] select',
    '[autocomplete*="cc-exp-month" i] select',
    'select[autocomplete="cc-exp-year"]',
    'select[autocomplete*="cc-exp-year" i]',
    '[autocomplete="cc-exp-year"] select',
    '[autocomplete*="cc-exp-year" i] select',
    'input[data-braintree-name="expirationDate"]',
    'input[data-braintree-name="expirationMonth"]',
    'input[data-braintree-name="expirationYear"]',
    'input[name*="ccexp" i]',
    'input[name*="cc_exp" i]',
    'input[name*="cc-exp" i]',
    'select[name*="ccexp" i]',
    'select[name*="cc_exp" i]',
    'select[name*="cc-exp" i]',
    'input[name*="cardexp" i]',
    'input[name*="card_exp" i]',
    'input[name*="card-exp" i]',
    'select[name*="cardexp" i]',
    'select[name*="card_exp" i]',
    'select[name*="card-exp" i]',
    'input[name*="expiry" i]',
    'select[name*="expiry" i]',
    'input[name*="expiration" i]',
    'select[name*="expiration" i]',
    '.expire-date-item input[type="text"]',
    '.expiry-date-item input[type="text"]',
    '.expiration-date-item input[type="text"]',
    '.select-expire-date__item input[type="text"]',
    '[data-field="expiryDate" i] input',
    '[data-field="expiry-date" i] input',
    '[data-field="expireDate" i] input',
    '[data-field="expire-date" i] input',
    '[data-field="expirationDate" i] input',
    '[data-field="expiration-date" i] input',
    'input.expiry-input',
    'input.expire-input',
    'input.expiration-input',
    '.js-card-date input[type="text"]',
    '.js-card-date input:not([type])',
    '.js-card-expiry input[type="text"]',
    '.js-card-expiry input:not([type])',
    '.js-carddate input[type="text"]',
    '.js-cardexpiry input[type="text"]',
    '.credit-input.js-card-date input',
    '.credit-input-h.js-card-date input',
    'input[placeholder="MM/YY" i]',
    'input[placeholder="MM / YY" i]',
    'input[placeholder*="mm/yy" i]',
    'input[placeholder*="mm / yy" i]',
    'input[placeholder*="mm/rr" i]',
    'input[placeholder*="mm / rr" i]',
    'input[placeholder*="expiry" i]',
    'input[placeholder*="expiration" i]',
    'input.wpwl-control-expiry',
    '.wpwl-group-expiry input'
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
      selectors.push(`input[${attr}="${text}" i]`);
      selectors.push(`select[${attr}="${text}" i]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} input[name*="exp" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="exp" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="exp" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="exp" i]`);

    selectors.push(`#${text} select[name*="exp" i]`);
    selectors.push(`#${text.toLowerCase()} select[name*="exp" i]`);
    selectors.push(`#${text.toUpperCase()} select[name*="exp" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="exp" i]`);

    selectors.push(`.${text} input[name*="exp" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="exp" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="exp" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="exp" i]`);

    selectors.push(`.${text} select[name*="exp" i]`);
    selectors.push(`.${text.toLowerCase()} select[name*="exp" i]`);
    selectors.push(`.${text.toUpperCase()} select[name*="exp" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="exp" i]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardExpirationDateSelectors;
