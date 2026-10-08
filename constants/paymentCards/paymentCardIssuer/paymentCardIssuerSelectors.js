// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardIssuerTexts from './paymentCardIssuerTexts.js';
import paymentCardIssuerGenericTexts from './paymentCardIssuerGenericTexts.js';
import paymentCardAttributes from '../paymentCardAttributes.js';

/**
 * Adds the select and input selectors matching each text as an id or as the value of an identifying attribute.
 * @param {Array<string>} selectors - The selector list to extend.
 * @param {ReadonlyArray<string>} texts - The texts.
 * @return {void}
 */
const addTextSelectors = (selectors, texts) => {
  texts.forEach(text => {
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
};

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

  addTextSelectors(selectors, paymentCardIssuerTexts);

  return [...new Set(selectors)];
};

/**
 * Function to get the selectors of issuer controls named only by a generic word (issuer, brand, network, provider).
 * They name the card brand only inside a payment card form, so the caller must check that context.
 * @return {Array<string>} An array of generic payment card issuer input selectors.
 */
export const paymentCardIssuerGenericSelectors = () => {
  const selectors = [];

  addTextSelectors(selectors, paymentCardIssuerGenericTexts);

  return [...new Set(selectors)];
};

export default paymentCardIssuerSelectors;
