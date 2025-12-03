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
    'select[name*="cc__type"]',
    'select[name*="cc_type"]',
    'select[name*="cc-type"]',
    'select[name*="cctype"]',
    'select[name*="ccType"]',
    'input[name*="cc__type"]',
    'input[name*="cc_type"]',
    'input[name*="cc-type"]',
    'input[name*="cctype"]',
    'input[name*="ccType"]',
    'select[name*="cardtype"]',
    'select[name*="cardType"]',
    'select[name*="card_type"]',
    'select[name*="card-type"]',
    'input[name*="cardtype"]',
    'input[name*="cardType"]',
    'input[name*="card_type"]',
    'input[name*="card-type"]'
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
      selectors.push(`select[${attr}="${text}"]`);
      selectors.push(`select[${attr}="${text.toLowerCase()}"]`);
      selectors.push(`select[${attr}="${text.toUpperCase()}"]`);
      selectors.push(`select[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);

      selectors.push(`input[${attr}="${text}"]`);
      selectors.push(`input[${attr}="${text.toLowerCase()}"]`);
      selectors.push(`input[${attr}="${text.toUpperCase()}"]`);
      selectors.push(`input[${attr}="${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}"]`);
    });
  });

  paymentCardFormTexts.forEach(text => {
    selectors.push(`#${text} select[name*="type"]`);
    selectors.push(`#${text.toLowerCase()} select[name*="type"]`);
    selectors.push(`#${text.toUpperCase()} select[name*="type"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="type"]`);

    selectors.push(`#${text} input[name*="type"]`);
    selectors.push(`#${text.toLowerCase()} input[name*="type"]`);
    selectors.push(`#${text.toUpperCase()} input[name*="type"]`);
    selectors.push(`#${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="type"]`);

    selectors.push(`.${text} select[name*="type"]`);
    selectors.push(`.${text.toLowerCase()} select[name*="type"]`);
    selectors.push(`.${text.toUpperCase()} select[name*="type"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} select[name*="type"]`);

    selectors.push(`.${text} input[name*="type"]`);
    selectors.push(`.${text.toLowerCase()} input[name*="type"]`);
    selectors.push(`.${text.toUpperCase()} input[name*="type"]`);
    selectors.push(`.${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()} input[name*="type"]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardIssuerSelectors;
