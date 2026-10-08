// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import {
  PaymentCardIssuerVisa,
  PaymentCardIssuerMasterCard,
  PaymentCardIssuerAmericanExpress,
  PaymentCardIssuerDiscover,
  PaymentCardIssuerJCB,
  PaymentCardIssuerDinersClub,
  PaymentCardIssuerMaestro,
  PaymentCardIssuerUnionPay
} from '@/constants';

const issuerVariations = {
  visa: PaymentCardIssuerVisa,
  mastercard: PaymentCardIssuerMasterCard,
  americanExpress: PaymentCardIssuerAmericanExpress,
  discover: PaymentCardIssuerDiscover,
  jcb: PaymentCardIssuerJCB,
  dinersClub: PaymentCardIssuerDinersClub,
  maestro: PaymentCardIssuerMaestro,
  unionPay: PaymentCardIssuerUnionPay
};

/**
* Escapes the characters that have a meaning in a regular expression.
* @param {string} text - The text.
* @return {string} The escaped text.
*/
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
* Normalizes a brand text for matching: NFC, lowercase, runs of whitespace, "_" and "-" collapsed to one space.
* @param {string|null|undefined} text - The raw text.
* @return {string} The normalized text.
*/
const normalizeIssuerText = text => String(text || '')
  .normalize('NFC')
  .toLowerCase()
  .replace(/[\s_-]+/g, ' ')
  .trim();

const normalizedIssuerVariations = Object.entries(issuerVariations).map(([key, variations]) => [
  key,
  [...new Set(variations.map(normalizeIssuerText))]
]);

/**
* Checks whether a normalized text names a normalized brand variation as a whole word: no letter or digit right
* before or after it, so "dis" is found in "DIS" or "Visa/DIS", never in "Discount".
* @param {string} text - The normalized text.
* @param {string} variation - The normalized variation.
* @return {boolean} True if the text contains the variation as a whole word.
*/
const containsIssuerVariation = (text, variation) => {
  if (!text || !variation) {
    return false;
  }

  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(variation)}(?![\\p{L}\\p{N}])`, 'u').test(text);
};

/**
* Resolves the brand key of the card issuer stored in an item ('Visa', 'MC', 'AMEX', 'DinersClub', …).
* @param {string|null|undefined} issuer - The stored card issuer.
* @return {string|null} The brand key (e.g. 'mastercard'), or null for an unknown issuer.
*/
const resolvePaymentCardIssuerKey = issuer => {
  const issuerLower = String(issuer || '').toLowerCase();

  if (!issuerLower) {
    return null;
  }

  for (const [key, variations] of Object.entries(issuerVariations)) {
    const keyLower = key.toLowerCase();

    if (issuerLower === keyLower || issuerLower.includes(keyLower)) {
      return key;
    }

    if (variations.some(variation => variation.toLowerCase() === issuerLower)) {
      return key;
    }
  }

  return null;
};

/**
* Gets the names a card issuer goes by on web pages, starting with the stored value itself.
* @param {string|null|undefined} issuer - The stored card issuer.
* @return {string[]} The names; only the stored value for an unknown issuer, none for an empty one.
*/
const getPaymentCardIssuerVariations = issuer => {
  if (!issuer) {
    return [];
  }

  const key = resolvePaymentCardIssuerKey(issuer);

  return key ? [issuer, ...issuerVariations[key]] : [issuer];
};

/**
* Finds the brand a text names (a radio value, a label, an image text): first by an exact name, otherwise by a
* name standing as a whole word.
* @param {string|null|undefined} text - The text.
* @return {string|null} The brand key, or null when the text names no brand or more than one.
*/
const getPaymentCardIssuerKeyOfText = text => {
  const normalized = normalizeIssuerText(text);

  if (!normalized) {
    return null;
  }

  const exactKeys = normalizedIssuerVariations
    .filter(([, variations]) => variations.includes(normalized))
    .map(([key]) => key);

  if (exactKeys.length > 0) {
    return exactKeys.length === 1 ? exactKeys[0] : null;
  }

  const containedKeys = normalizedIssuerVariations
    .filter(([, variations]) => variations.some(variation => containsIssuerVariation(normalized, variation)))
    .map(([key]) => key);

  return containedKeys.length === 1 ? containedKeys[0] : null;
};

/**
* Finds the option of a brand select that names the card issuer: first an option whose value or text is one of
* the issuer's names, otherwise one containing a name as a whole word. Options without a value (placeholders) and
* disabled options are never picked.
* @param {HTMLSelectElement} select - The brand select.
* @param {string} issuer - The stored card issuer.
* @return {HTMLOptionElement|null} The option, or null when no option names the issuer.
*/
const findPaymentCardIssuerOption = (select, issuer) => {
  const names = [...new Set(getPaymentCardIssuerVariations(issuer).map(normalizeIssuerText))].filter(Boolean);
  const options = Array.from(select.options)
    .filter(option => option.value !== '' && !option.disabled)
    .map(option => ({ option, value: normalizeIssuerText(option.value), text: normalizeIssuerText(option.text) }));

  for (const name of names) {
    const exact = options.find(({ value, text }) => value === name || text === name);

    if (exact) {
      return exact.option;
    }
  }

  for (const name of names) {
    const contained = options.find(({ value, text }) => containsIssuerVariation(value, name) || containsIssuerVariation(text, name));

    if (contained) {
      return contained.option;
    }
  }

  return null;
};

export {
  resolvePaymentCardIssuerKey,
  getPaymentCardIssuerVariations,
  getPaymentCardIssuerKeyOfText,
  findPaymentCardIssuerOption
};
