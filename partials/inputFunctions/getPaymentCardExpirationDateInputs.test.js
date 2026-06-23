// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the expiry detector should find combined "MM/YY" fields as
// well as separated month and year fields/selects, and classify each one
// (combined | month | year). It must not pick up the number, name or CVV field.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPaymentCardExpirationDateInputs from './getPaymentCardExpirationDateInputs';

const typesOf = result => result.map(entry => entry.type);

describe('getPaymentCardExpirationDateInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('combined expiry field', () => {
    it('detects a single cc-exp field and classifies it as combined', () => {
      document.body.innerHTML = '<input autocomplete="cc-exp" placeholder="MM / YY" />';

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('combined');
      expect(result[0].isSelect).toBe(false);
    });

    it('detects a combined field by its MM/YY placeholder alone', () => {
      document.body.innerHTML = '<input type="text" name="expiry" placeholder="MM/YY" />';

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('combined');
    });
  });

  describe('separated month and year fields', () => {
    it('classifies cc-exp-month and cc-exp-year inputs distinctly', () => {
      document.body.innerHTML = `
        <input autocomplete="cc-exp-month" name="exp-month" />
        <input autocomplete="cc-exp-year" name="exp-year" />
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(typesOf(result)).toEqual(['month', 'year']);
    });

    it('classifies separated month/year by name and placeholder', () => {
      document.body.innerHTML = `
        <input type="text" name="expiryMonth" placeholder="MM" />
        <input type="text" name="expiryYear" placeholder="YY" />
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(typesOf(result)).toEqual(['month', 'year']);
    });

    it('detects month and year <select> dropdowns and marks them as selects', () => {
      document.body.innerHTML = `
        <select autocomplete="cc-exp-month" name="exp-month"><option>01</option></select>
        <select autocomplete="cc-exp-year" name="exp-year"><option>2030</option></select>
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(typesOf(result)).toEqual(['month', 'year']);
      expect(result.every(entry => entry.isSelect === true)).toBe(true);
    });
  });

  describe('isolation from other card fields', () => {
    it('returns only the expiry field from a full checkout form', () => {
      document.body.innerHTML = `
        <form id="checkout">
          <input autocomplete="cc-name" name="ccname" />
          <input autocomplete="cc-number" name="cardnumber" />
          <input autocomplete="cc-exp" name="cc-exp" placeholder="MM / YY" />
          <input autocomplete="cc-csc" name="cvc" />
        </form>
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].element.getAttribute('autocomplete')).toBe('cc-exp');
    });
  });

  describe('exclusions', () => {
    it('returns an empty array when there is no expiry field', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" name="cardnumber" />';

      expect(getPaymentCardExpirationDateInputs()).toEqual([]);
    });

    it('ignores an expiry field that is not visible', () => {
      document.body.innerHTML = '<input autocomplete="cc-exp" name="cc-exp" data-invisible="true" />';

      expect(getPaymentCardExpirationDateInputs()).toEqual([]);
    });
  });

  describe('regression: i18n month keyword must not contain a year keyword (review #8)', () => {
    it('classifies Dutch "Maand"/"Jaar" month and year fields distinctly', () => {
      // "maand" (month) contains the substring "an" (a year keyword) — must not become combined.
      document.body.innerHTML = `
        <input type="text" name="expiryMonth" placeholder="Maand" />
        <input type="text" name="expiryYear" placeholder="Jaar" />
      `;

      expect(typesOf(getPaymentCardExpirationDateInputs())).toEqual(['month', 'year']);
    });

    it('classifies Indonesian "Bulan"/"Tahun" month and year fields distinctly', () => {
      document.body.innerHTML = `
        <input type="text" name="expiry1" placeholder="Bulan" />
        <input type="text" name="expiry2" placeholder="Tahun" />
      `;

      expect(typesOf(getPaymentCardExpirationDateInputs())).toEqual(['month', 'year']);
    });
  });

  describe('regression: explicit month/year name beats a combined-looking placeholder (review #9)', () => {
    it('classifies an expiryMonth field as month even with an MM/YY placeholder', () => {
      document.body.innerHTML = '<input type="text" name="expiryMonth" placeholder="MM / YY" />';

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('month');
    });
  });

  describe('shadow DOM', () => {
    it('detects an expiry field rendered inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input autocomplete="cc-exp" name="cc-exp" placeholder="MM / YY" />';

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('combined');
    });
  });
});
