// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardNumberSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

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
  'language',
  'off',
  'on'
];

const conflictingInputTypes = [
  'email',
  'password',
  'tel',
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
  'exp', 'expiry', 'expiration', 'valid', 'month', 'year', 'mm', 'yy'
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

  if (autocomplete && conflictingAutocompleteValues.includes(autocomplete)) {
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
* Filters out inputs that contain denied keywords in their name or id.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const hasDeniedWord = paymentCardDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  return !hasDeniedWord;
};

/**
* Gets the data-field value from closest parent element that has it.
* @param {HTMLElement} element - The element to check.
* @return {string} The data-field value or empty string.
*/
const getParentDataField = element => {
  const parent = element.closest('[data-field]');

  if (parent) {
    return (parent.getAttribute('data-field') || '').toLowerCase();
  }

  return '';
};

/**
* Gets relevant class names from an element.
* @param {HTMLElement} element - The element to check.
* @return {string} Space-separated lowercase class names.
*/
const getRelevantClasses = element => {
  return (element.className || '').toLowerCase();
};

/**
* Filters out inputs that appear to be cardholder name, CVV, or expiration date fields.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept as card number, false otherwise.
*/
const filterOtherCardFields = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const dataEncryptedName = (input.getAttribute('data-encrypted-name') || '').toLowerCase();
  const parentDataField = getParentDataField(input);
  const classes = getRelevantClasses(input);
  const combined = name + id + dataEncryptedName + parentDataField + classes;

  if (combined.includes('number') || combined.includes('cardnumber') || combined.includes('ccnumber')) {
    return true;
  }

  const isCardholderName = cardholderNameKeywords.some(keyword => combined.includes(keyword));

  if (isCardholderName) {
    return false;
  }

  const isSecurityCode = securityCodeKeywords.some(keyword => combined.includes(keyword));

  if (isSecurityCode) {
    return false;
  }

  const isExpiration = expirationKeywords.some(keyword => combined.includes(keyword));

  if (isExpiration) {
    return false;
  }

  return true;
};

/**
* Gets the payment card number input elements from the document, including those inside shadow DOMs.
* @return {HTMLInputElement[]} The array of payment card number input elements.
*/
const getPaymentCardNumberInputs = () => {
  const cardNumberSelector = paymentCardNumberSelectors().join(', ');

  const regularInputs = Array.from(document.querySelectorAll(cardNumberSelector));

  const shadowRoots = getShadowRoots();
  const shadowInputs = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(cardNumberSelector))
  );

  return [...regularInputs, ...shadowInputs]
    .filter(input => isVisible(input))
    .filter(uniqueElementOnly)
    .filter(filterConflictingAttributes)
    .filter(filterDeniedKeywords)
    .filter(filterOtherCardFields);
};

export default getPaymentCardNumberInputs;
