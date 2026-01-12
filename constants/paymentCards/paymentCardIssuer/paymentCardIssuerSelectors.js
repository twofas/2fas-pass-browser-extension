// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardIssuerTexts from './paymentCardIssuerTexts.js';
import paymentCardFormTexts from '../paymentCardFormTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Function to get payment card issuer input selectors.
 * @return {Array<string>} An array of payment card issuer input selectors.
 */
const paymentCardIssuerSelectors = () => {
  const selectors = [
    'select[autocomplete="cc-type"]',
    'input[autocomplete="cc-type"]',
    'select[name*="cc__type" i]',
    'select[name*="cc_type" i]',
    'select[name*="cc-type" i]',
    'select[name*="cctype" i]',
    'input[name*="cc__type" i]',
    'input[name*="cc_type" i]',
    'input[name*="cc-type" i]',
    'input[name*="cctype" i]',
    'select[name*="cardtype" i]',
    'select[name*="card_type" i]',
    'select[name*="card-type" i]',
    'input[name*="cardtype" i]',
    'input[name*="card_type" i]',
    'input[name*="card-type" i]'
  ];

  paymentCardIssuerTexts.forEach(text => {
    selectors.push(`select#${text}`);
    selectors.push(`select#${text.toLowerCase()}`);
    selectors.push(`select#${text.toUpperCase()}`);
    selectors.push(`select#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    selectors.push(`input#${text}`);
    selectors.push(`input#${text.toLowerCase()}`);
    selectors.push(`input#${text.toUpperCase()}`);
    selectors.push(`input#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`);

    paymentCardAttributes.forEach(attr => {
      selectors.push(`select[${attr}="${text}" i]`);
      selectors.push(`input[${attr}="${text}" i]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} select[name*="type" i]`);
    selectors.push(`#${text.toLowerCase()} select[name*="type" i]`);
    selectors.push(`#${text.toUpperCase()} select[name*="type" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="type" i]`);

    selectors.push(`#${text} input[name*="type" i]`);
    selectors.push(`#${text.toLowerCase()} input[name*="type" i]`);
    selectors.push(`#${text.toUpperCase()} input[name*="type" i]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="type" i]`);

    selectors.push(`.${text} select[name*="type" i]`);
    selectors.push(`.${text.toLowerCase()} select[name*="type" i]`);
    selectors.push(`.${text.toUpperCase()} select[name*="type" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="type" i]`);

    selectors.push(`.${text} input[name*="type" i]`);
    selectors.push(`.${text.toLowerCase()} input[name*="type" i]`);
    selectors.push(`.${text.toUpperCase()} input[name*="type" i]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="type" i]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardIssuerSelectors;
