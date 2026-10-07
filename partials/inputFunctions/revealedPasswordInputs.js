// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { passwordKeywords, passwordIdentifierKeywords, passwordDeniedKeywords, passwordDeniedAutocompleteValues, userNameWords } from '@/constants';
import { containsDeniedWord, getAssociatedLabelText } from './shared';
import { getRevealedPasswordRegistry } from './revealedPasswordRegistry';

const PASSWORD_AUTOCOMPLETE_VALUES = ['current-password', 'new-password'];

/**
* Remembers inputs currently masked as type="password", so they are still recognised after a
* "show password" toggle flips them to type="text".
* @param {HTMLInputElement[]} inputs - The detected password inputs.
* @return {void}
*/
const rememberPasswordInputs = inputs => {
  const registry = getRevealedPasswordRegistry();

  inputs.forEach(input => {
    if (input?.type === 'password') {
      registry.add(input);
    }
  });
};

/**
* Checks whether the input's group (its form, or the whole document for a form-less input) still
* contains a masked type="password" field.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if a masked password field shares the group.
*/
const groupHasMaskedPassword = input => {
  const scope = (typeof input.closest === 'function' && input.closest('form')) || input.ownerDocument || document;

  return typeof scope.querySelector === 'function' && Boolean(scope.querySelector('input[type="password"]'));
};

/**
* Returns the trailing field token of an input's autocomplete attribute (WHATWG autofill grammar
* allows section/shipping/billing tokens before it).
* @param {HTMLInputElement} input - The input element to inspect.
* @return {string} The lowercased trailing autocomplete token, or empty string.
*/
const getAutocompleteToken = input => {
  const autocomplete = (input.getAttribute?.('autocomplete') || '').toLowerCase().trim();

  if (!autocomplete) {
    return '';
  }

  const tokens = autocomplete.split(/\s+/);

  return tokens[tokens.length - 1];
};

/**
* Checks whether a type="text" input is a password field revealed by a "show password" toggle
* (which flips type="password" to type="text" or swaps the element for a text input). Recognised
* when the input was seen masked earlier, carries a current/new-password autocomplete token, its
* name or id names a password, or — for fields not named as a username — its placeholder,
* aria-label or label names a password while no masked password field remains in its form; a
* hint, security question or one-time code never counts. Inputs still masked as type="password"
* return false.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input is a revealed password field.
*/
const isRevealedPasswordInput = input => {
  if (!input || input.type !== 'text') {
    return false;
  }

  if (getRevealedPasswordRegistry().has(input)) {
    return true;
  }

  const autocompleteToken = getAutocompleteToken(input);

  if (PASSWORD_AUTOCOMPLETE_VALUES.includes(autocompleteToken)) {
    return true;
  }

  if (passwordDeniedAutocompleteValues.includes(autocompleteToken)) {
    return false;
  }

  const identifiers = `${input.name || ''} ${input.id || ''}`;
  const texts = [
    input.getAttribute?.('placeholder') || '',
    input.getAttribute?.('aria-label') || '',
    getAssociatedLabelText(input)
  ].join(' ');

  if (containsDeniedWord(`${identifiers} ${texts}`, passwordDeniedKeywords)) {
    return false;
  }

  if (containsDeniedWord(identifiers, passwordKeywords) || containsDeniedWord(identifiers, passwordIdentifierKeywords)) {
    return true;
  }

  // Free text (placeholder, label) can mention a password on a username field ("Username (not
  // your password)", a shared "login and password" caption), so it only counts for fields whose
  // name and id do not name a username.
  if (containsDeniedWord(identifiers, userNameWords)) {
    return false;
  }

  // A free-text match is the weakest signal. When a masked password field is still present in
  // the same form (or page), the text field is almost certainly something else — never fill it.
  if (groupHasMaskedPassword(input)) {
    return false;
  }

  return containsDeniedWord(texts, passwordKeywords);
};

export { isRevealedPasswordInput, rememberPasswordInputs };
