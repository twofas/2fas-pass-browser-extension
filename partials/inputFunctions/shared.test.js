// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests for the shared payment-field helpers. They describe the
// contract each helper is expected to honour (denylist filtering, exact
// autocomplete-conflict rejection, ancestor data-field lookup, and a
// document + shadow DOM collector), independent of the implementation.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import { filterDeniedKeywords, makeConflictingAutocompleteFilter, getParentDataField, collectInputs } from './shared';

const makeInput = ({ name = '', id = '', autocomplete = null } = {}) => {
  const input = document.createElement('input');

  if (name) {
    input.setAttribute('name', name);
  }

  if (id) {
    input.id = id;
  }

  if (autocomplete !== null) {
    input.setAttribute('autocomplete', autocomplete);
  }

  return input;
};

describe('shared payment-field helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('filterDeniedKeywords', () => {
    it('keeps a genuine card field whose name has no denied keyword', () => {
      expect(filterDeniedKeywords(makeInput({ name: 'cardNumber' }))).toBe(true);
    });

    it('keeps an input with no name or id', () => {
      expect(filterDeniedKeywords(makeInput())).toBe(true);
    });

    it('rejects fields that are clearly personal/contact data, not card data', () => {
      expect(filterDeniedKeywords(makeInput({ name: 'email' }))).toBe(false);
      expect(filterDeniedKeywords(makeInput({ name: 'phoneNumber' }))).toBe(false);
      expect(filterDeniedKeywords(makeInput({ id: 'billingAddress' }))).toBe(false);
      expect(filterDeniedKeywords(makeInput({ name: 'zipcode' }))).toBe(false);
    });

    it('matches denied keywords case-insensitively', () => {
      expect(filterDeniedKeywords(makeInput({ name: 'EMAIL' }))).toBe(false);
    });

    it('checks the id as well as the name', () => {
      expect(filterDeniedKeywords(makeInput({ id: 'user-password' }))).toBe(false);
    });

    // Regression (review #4/#13/#14/#18): denied keywords must match on word
    // boundaries, not as raw substrings — otherwise legitimate card fields whose
    // identifier merely CONTAINS a short denied token are wrongly dropped.
    it('keeps a card field whose name only contains a denied token as a substring', () => {
      expect(filterDeniedKeywords(makeInput({ name: 'passenger-card-number' }))).toBe(true); // 'pass' inside 'passenger'
      expect(filterDeniedKeywords(makeInput({ name: 'card_type_statement' }))).toBe(true); // 'state' inside 'statement'
      expect(filterDeniedKeywords(makeInput({ name: 'hotelGuestCardName' }))).toBe(true); // 'tel' inside 'hotel'
    });

    it('still rejects a denied token that appears as a whole camelCase word', () => {
      expect(filterDeniedKeywords(makeInput({ name: 'billingPhoneNumber' }))).toBe(false); // 'phone' is a whole word
    });
  });

  describe('makeConflictingAutocompleteFilter', () => {
    const filter = makeConflictingAutocompleteFilter(['cc-name', 'cc-exp', 'cc-csc']);

    it('keeps an input with no autocomplete attribute', () => {
      expect(filter(makeInput())).toBe(true);
    });

    it('keeps an input whose autocomplete is not in the conflicting set', () => {
      expect(filter(makeInput({ autocomplete: 'cc-number' }))).toBe(true);
    });

    it('rejects an input whose autocomplete exactly matches a conflicting token', () => {
      expect(filter(makeInput({ autocomplete: 'cc-name' }))).toBe(false);
      expect(filter(makeInput({ autocomplete: 'cc-csc' }))).toBe(false);
    });

    it('compares the autocomplete token case-insensitively and trimmed', () => {
      expect(filter(makeInput({ autocomplete: '  CC-NAME  ' }))).toBe(false);
    });

    // Regression (review #3/#11): the WHATWG autofill grammar allows optional
    // section/billing/shipping tokens before the field token, e.g. "billing cc-name".
    // The filter must reject based on the field token, not the whole string.
    it('rejects a conflicting field token even when prefixed with a grouping token', () => {
      expect(filter(makeInput({ autocomplete: 'billing cc-name' }))).toBe(false);
      expect(filter(makeInput({ autocomplete: 'section-blue cc-exp' }))).toBe(false);
    });

    it('keeps a non-conflicting field token that is prefixed with a grouping token', () => {
      expect(filter(makeInput({ autocomplete: 'billing cc-number' }))).toBe(true);
    });
  });

  describe('getParentDataField', () => {
    it('returns the lowercased data-field of the closest wrapping element', () => {
      document.body.innerHTML = '<div data-field="cardNumber"><span><input id="t" /></span></div>';

      expect(getParentDataField(document.getElementById('t'))).toBe('cardnumber');
    });

    it('returns an empty string when no ancestor declares data-field', () => {
      document.body.innerHTML = '<div><input id="t" /></div>';

      expect(getParentDataField(document.getElementById('t'))).toBe('');
    });
  });

  describe('collectInputs', () => {
    it('collects matching, visible, unique elements from the document', () => {
      document.body.innerHTML = `
        <input class="target" name="a" />
        <input class="target" name="b" />
        <input class="other" name="c" />
      `;

      const result = collectInputs('input.target');

      expect(result.map(input => input.name)).toEqual(['a', 'b']);
    });

    it('excludes elements that are not visible', () => {
      document.body.innerHTML = `
        <input class="target" name="shown" />
        <input class="target" name="hidden" data-invisible="true" />
      `;

      const result = collectInputs('input.target');

      expect(result.map(input => input.name)).toEqual(['shown']);
    });

    it('also collects matches from inside open shadow roots', () => {
      document.body.innerHTML = '<input class="target" name="light" /><div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input class="target" name="shadow" />';

      const names = collectInputs('input.target').map(input => input.name);

      expect(names).toContain('light');
      expect(names).toContain('shadow');
    });

    it('uses caller-supplied shadow roots instead of rescanning the DOM', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input class="target" name="shadow" />';

      const result = collectInputs('input.target', [root]);

      expect(result.map(input => input.name)).toEqual(['shadow']);
    });
  });
});
