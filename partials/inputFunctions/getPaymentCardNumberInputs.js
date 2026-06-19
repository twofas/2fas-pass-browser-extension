// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardNumberSelectors } from '@/constants';
import { containsDeniedWord, filterDeniedKeywords, collectInputs } from './shared';

const conflictingAutocompleteValues = [
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type',
  'email',
  'username',
  'new-password',
  'current-password',
  'one-time-code',
  'tel',
  'tel-country-code',
  'tel-national',
  'tel-area-code',
  'tel-local',
  'tel-extension',
  'url',
  'name',
  'given-name',
  'family-name',
  'additional-name',
  'nickname',
  'organization',
  'street-address',
  'address-line1',
  'address-line2',
  'address-line3',
  'address-level1',
  'address-level2',
  'address-level3',
  'address-level4',
  'country',
  'country-name',
  'postal-code',
  'bday',
  'bday-day',
  'bday-month',
  'bday-year',
  'sex',
  'photo',
  'impp',
  'language'
];

const conflictingInputTypes = [
  'email',
  'password',
  'url',
  'search',
  'date',
  'datetime-local',
  'month',
  'week',
  'time',
  'color',
  'file',
  'hidden',
  'radio',
  'checkbox',
  'range',
  'submit',
  'reset',
  'button',
  'image'
];

const conflictingInputModes = [
  'email',
  'tel',
  'url',
  'search'
];

const cardholderNameKeywords = [
  'name', 'holder', 'owner', 'cardholder', 'holdername', 'ownername', 'cardname'
];

const securityCodeKeywords = [
  'cvv', 'cvc', 'csc', 'cvn', 'cid', 'securitycode', 'cardcode', 'verificationcode', 'x_card_code'
];

const expirationKeywords = [
  'exp', 'expiry', 'expiration', 'valid', 'month', 'year', 'mm', 'yy', 'period'
];

/**
* Filters out inputs that have conflicting autocomplete, type, or inputmode attributes.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterConflictingAttributes = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();
  const inputType = (input.type || '').toLowerCase();
  const inputMode = (input.getAttribute('inputmode') || '').toLowerCase();

  // Match the trailing field token exactly (the autofill grammar allows optional
  // leading section/billing tokens) for BOTH the allow and the deny decision, so the
  // real PAN token is honoured while values like 'cc-number-honeypot' or a trailing
  // conflicting token (e.g. 'cc-number cc-csc') are not mistaken for it, and
  // 'language-preference' is not rejected merely for containing 'language'.
  const fieldToken = autocomplete ? autocomplete.split(/\s+/).pop() : '';

  if (fieldToken === 'cc-number') {
    return true;
  }

  if (fieldToken && conflictingAutocompleteValues.includes(fieldToken)) {
    return false;
  }

  if (inputType && conflictingInputTypes.includes(inputType)) {
    return false;
  }

  if (inputMode && conflictingInputModes.includes(inputMode)) {
    return false;
  }

  return true;
};

/**
* Filters out inputs that appear to be cardholder name, CVV, or expiration date fields.
* Decisions are made from the field's OWN identity (name/id/data-encrypted-name/placeholder)
* using whole-word matching, so framework validation classes (ng-valid/is-invalid) and
* ancestor wrappers cannot trigger a false rejection or a false acceptance.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept as card number, false otherwise.
*/
const filterOtherCardFields = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();

  // Honour the trailing field token exactly (matching filterConflictingAttributes) so a
  // glued/grouped autocomplete is not auto-accepted as a PAN by a bare substring match.
  if (autocomplete.split(/\s+/).pop() === 'cc-number') {
    return true;
  }

  const name = input.name || '';
  const id = input.id || '';
  const dataEncryptedName = input.getAttribute('data-encrypted-name') || '';
  const placeholder = input.getAttribute('placeholder') || '';
  const ownIdentity = `${name} ${id} ${dataEncryptedName} ${placeholder}`;

  if (containsDeniedWord(ownIdentity, cardholderNameKeywords)) {
    return false;
  }

  if (containsDeniedWord(ownIdentity, securityCodeKeywords)) {
    return false;
  }

  if (containsDeniedWord(ownIdentity, expirationKeywords)) {
    return false;
  }

  return true;
};

/**
* Gets the payment card number input elements from the document, including those inside shadow DOMs.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {HTMLInputElement[]} The array of payment card number input elements.
*/
const getPaymentCardNumberInputs = (shadowRoots = null) => {
  const cardNumberSelector = paymentCardNumberSelectors().join(', ');
  const visibleUniqueInputs = collectInputs(cardNumberSelector, shadowRoots);
  const afterConflicting = visibleUniqueInputs.filter(filterConflictingAttributes);
  const afterDenied = afterConflicting.filter(filterDeniedKeywords);
  const result = afterDenied.filter(filterOtherCardFields);

  return result;
};

export default getPaymentCardNumberInputs;
