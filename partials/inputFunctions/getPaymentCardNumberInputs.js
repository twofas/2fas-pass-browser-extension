// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardNumberSelectors } from '@/constants';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { containsDeniedWord, filterDeniedKeywords, collectInputs } from './shared';
import { getPaymentCardElementsByLabel, withoutSelectorCoveredScopes } from './paymentCardLabels';

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
  'cvv', 'cvc', 'csc', 'ccv', 'cvn', 'cid', 'securitycode', 'cardcode', 'verificationcode', 'cardverification', 'card_verification', 'card-verification', 'x_card_code'
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
* Fields are found by their identifiers (selectors) and, inside a payment context where the selectors found
* none, by the words of their label.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @param {Object|null} [labelPass] - Label classification cache shared by the getters of one detection pass (createPaymentCardLabelPass()).
* @return {HTMLInputElement[]} The array of payment card number input elements.
*/
const getPaymentCardNumberInputs = (shadowRoots = null, labelPass = null) => {
  const cardNumberSelector = paymentCardNumberSelectors().join(', ');
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const filterCardNumberInputs = inputs => inputs
    .filter(filterConflictingAttributes)
    .filter(filterDeniedKeywords)
    .filter(filterOtherCardFields);
  const selectorInputs = filterCardNumberInputs(collectInputs(cardNumberSelector, resolvedShadowRoots));
  const labelInputs = filterCardNumberInputs(
    withoutSelectorCoveredScopes(getPaymentCardElementsByLabel('number', resolvedShadowRoots, labelPass), selectorInputs)
  );

  return [...selectorInputs, ...labelInputs].filter(uniqueElementOnly);
};

export default getPaymentCardNumberInputs;
