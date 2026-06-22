// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { currentPasswordKeywords, newPasswordKeywords } from '@/constants';
import { containsDeniedWord, getAssociatedLabelText } from './shared';

const CURRENT_PASSWORD_AUTOCOMPLETE = 'current-password';

// On a username-less form this many password fields (old + new + confirm) signals a
// change-password layout, where the first field is — with high probability — the old password.
const POSITIONAL_GROUP_MIN_SIZE = 3;

// "re-enter" / "re-type" / "re-peat" confirm-field identifiers whose separators the keyword
// tokenizer would split (re_enter_password, re-type-password). Anchored on the "re" prefix so it
// never matches a login field whose text merely says "Enter password" or contains "center".
const REPEAT_IDENTIFIER_PATTERN = /re[\s._-]*(enter|type|peat)/;

// Sentinel key for password fields that are not inside any <form>.
const FORMLESS_GROUP = null;

/**
* Returns the trailing field token of an input's autocomplete attribute. Per the WHATWG
* autofill grammar optional section/shipping/billing tokens may precede the field token
* (e.g. 'section-blue current-password'), so the meaningful token is the last one.
* @param {HTMLInputElement} input - The input element to inspect.
* @return {string} The lowercased trailing autocomplete token, or empty string.
*/
const autocompleteFieldToken = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();

  if (!autocomplete) {
    return '';
  }

  const tokens = autocomplete.split(/\s+/);

  return tokens[tokens.length - 1];
};

/**
* Combines a password field's descriptive signals (name, id, placeholder, aria-label and
* associated label text) into a single string for keyword matching.
* @param {HTMLInputElement} input - The input element to inspect.
* @return {string} The joined signal string.
*/
const collectTextSignals = input => [
  input.name || '',
  input.id || '',
  input.getAttribute('placeholder') || '',
  input.getAttribute('aria-label') || '',
  getAssociatedLabelText(input)
].join(' ');

/**
* Classifies a password input as the current/old password, a brand-new password, or unknown.
* A standardized autocomplete="current-password" token is authoritative for the current meaning;
* otherwise the field's textual signals are matched against the current/new keyword lists, with
* the new-password meaning winning when both are present (e.g. "confirm new password"). An
* autocomplete="new-password" token is NOT treated as decisive, so a field carrying only that
* attribute falls through to keyword/layout heuristics rather than being skipped outright.
* @param {HTMLInputElement} input - The password input to classify.
* @return {'current'|'new'|'unknown'} The resolved password role.
*/
const classifyPasswordInput = input => {
  const token = autocompleteFieldToken(input);

  if (token === CURRENT_PASSWORD_AUTOCOMPLETE) {
    return 'current';
  }

  const signals = collectTextSignals(input);
  const identifier = `${input.name || ''} ${input.id || ''}`.toLowerCase();
  const hasNew = containsDeniedWord(signals, newPasswordKeywords) || REPEAT_IDENTIFIER_PATTERN.test(identifier);
  const hasCurrent = containsDeniedWord(signals, currentPasswordKeywords);

  if (hasCurrent && !hasNew) {
    return 'current';
  }

  if (hasNew) {
    return 'new';
  }

  return 'unknown';
};

/**
* Decides which password inputs of a single group (one form, or all form-less fields) autofill
* should fill, never returning a field identified as a new/confirm password.
* @param {HTMLInputElement[]} inputs - The password inputs in this group, in document order.
* @param {boolean} hasUsername - Whether the group is associated with a username field.
* @return {HTMLInputElement[]} The fillable subset of the group.
*/
const resolveGroup = (inputs, hasUsername) => {
  const classes = inputs.map(classifyPasswordInput);
  const currentFields = inputs.filter((input, index) => classes[index] === 'current');

  // An explicit current/old password field is always the right target.
  if (currentFields.length > 0) {
    return currentFields;
  }

  // A lone password field is the login/single password unless it is explicitly a new one.
  if (inputs.length === 1) {
    return classes[0] === 'new' ? [] : inputs;
  }

  if (hasUsername) {
    // Username + exactly two password fields with no current/old field is, with high probability,
    // a registration or set-password form (new + confirm) rather than a login — fill nothing. A
    // genuine change form exposes its current field via a keyword/autocomplete and is handled above.
    if (inputs.length === 2) {
      return [];
    }

    // Three or more fields with a username (e.g. an unlabelled old + new + confirm change form):
    // fill the first field that is not explicitly a new password.
    const firstNonNew = inputs.find((input, index) => classes[index] !== 'new');

    return firstNonNew ? [firstNonNew] : [];
  }

  // Username-less change-password layout: with old + new + confirm the first field is, with high
  // probability, the old password — fill it (unless it is explicitly marked as a new password).
  if (inputs.length >= POSITIONAL_GROUP_MIN_SIZE && classes[0] !== 'new') {
    return [inputs[0]];
  }

  // Exactly two username-less fields with no decisive signal are ambiguous (most likely
  // new + confirm on a reset form); fill nothing rather than risk a new-password field.
  return [];
};

/**
* From the password inputs autofill detected, returns only those that should actually be filled
* with the stored password — the current/old password fields — excluding new and confirm
* password fields on registration and change-password forms. Fields are grouped by their form
* (form-less fields share one group) so independent login and registration forms are judged
* separately. The returned list preserves the order of the input array.
* @param {HTMLInputElement[]} passwordInputs - The detected, visible password inputs in document order.
* @param {HTMLInputElement[]} [usernameInputs=[]] - The detected username inputs, used to associate forms.
* @return {HTMLInputElement[]} The password inputs autofill should fill.
*/
const getAutofillPasswordInputs = (passwordInputs, usernameInputs = []) => {
  if (!Array.isArray(passwordInputs) || passwordInputs.length === 0) {
    return [];
  }

  // Only username fields inside a real <form> establish an association. Form-less username inputs
  // (e.g. an unrelated email box elsewhere on the page) must NOT associate with the form-less
  // password group, otherwise an unrelated field could flip a reset widget into a false fill.
  const usernameForms = new Set((usernameInputs || []).map(input => input.closest('form')).filter(Boolean));
  const groups = new Map();

  passwordInputs.forEach(input => {
    const form = input.closest('form') || FORMLESS_GROUP;

    if (!groups.has(form)) {
      groups.set(form, []);
    }

    groups.get(form).push(input);
  });

  const fillable = new Set();

  groups.forEach((groupInputs, form) => {
    const hasUsername = usernameForms.has(form);

    resolveGroup(groupInputs, hasUsername).forEach(input => fillable.add(input));
  });

  return passwordInputs.filter(input => fillable.has(input));
};

export default getAutofillPasswordInputs;
export { classifyPasswordInput };
