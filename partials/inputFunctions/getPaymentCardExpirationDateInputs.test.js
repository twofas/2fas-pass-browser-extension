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

  describe('regression: abbreviated ExpMon/ExpYr selects (summitracing.com)', () => {
    const months = '<option value="1">1</option><option value="12">12</option>';
    const years = '<option value="2026">2026</option><option value="2031">2031</option>';

    it('detects ExpMon/ExpYr selects labelled "Expiration date: month/year" as month and year', () => {
      document.body.innerHTML = `
        <div id="payment-option-container-card">
          <select autocomplete="off" id="ExpMon" name="ExpMon" aria-label="Expiration date: month">${months}</select>
          <select id="ExpYr" name="ExpYr" autocomplete="off" aria-label="Expiration date: year">${years}</select>
        </div>
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(typesOf(result)).toEqual(['month', 'year']);
      expect(result.every(entry => entry.isSelect === true)).toBe(true);
    });

    it('classifies ExpMon/ExpYr selects by their abbreviated names when no aria-label is present', () => {
      document.body.innerHTML = `
        <select id="ExpMon" name="ExpMon">${months}</select>
        <select id="ExpYr" name="ExpYr">${years}</select>
      `;

      expect(typesOf(getPaymentCardExpirationDateInputs())).toEqual(['month', 'year']);
    });

    it('detects expiry selects by an "expiration" aria-label even when the name is opaque', () => {
      document.body.innerHTML = `
        <select name="f1" aria-label="Expiration month">${months}</select>
        <select name="f2" aria-label="Expiry year">${years}</select>
      `;

      expect(typesOf(getPaymentCardExpirationDateInputs())).toEqual(['month', 'year']);
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

  describe('detection by label (paymentCardExpirationDateWords)', () => {
    it('detects Polish labelled month and year selects and types them from the label', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <label for="m">Data ważności – miesiąc</label><select id="m" name="a"><option value="1">1</option></select>
          <label for="y">Data ważności – rok</label><select id="y" name="b"><option value="1">1</option></select>
        </form>
      `;

      expect(getPaymentCardExpirationDateInputs().map(entry => [entry.element.id, entry.type])).toEqual([['m', 'month'], ['y', 'year']]);
    });

    it('detects a combined field with an opaque name labelled "Expiry date (MM/YY)"', () => {
      document.body.innerHTML = '<div class="payment"><label for="f1">Expiry date (MM/YY)</label><input type="text" id="f1" name="field_3" /></div>';

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('combined');
    });

    it('detects labelled month and year selects and types them from the label', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <label for="m">Expiry month</label>
          <select id="m" name="a"><option value="">--</option><option value="01">01</option><option value="12">12</option></select>
          <label for="y">Expiry year</label>
          <select id="y" name="b"><option value="">--</option><option value="2026">2026</option><option value="2027">2027</option></select>
        </form>
      `;

      const result = getPaymentCardExpirationDateInputs();

      expect(result.map(entry => [entry.element.id, entry.type, entry.isSelect])).toEqual([['m', 'month', true], ['y', 'year', true]]);
    });

    it('types a select labelled only "Expiration date" from its month options', () => {
      const months = Array.from({ length: 12 }, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${i + 1}</option>`).join('');
      document.body.innerHTML = `<div class="payment"><label for="m">Expiration date</label><select id="m" name="a"><option value="">Month</option>${months}</select></div>`;

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('month');
    });

    it('types a select labelled only "Expiration date" from its year options', () => {
      const years = Array.from({ length: 12 }, (_, i) => `<option value="${2026 + i}">${2026 + i}</option>`).join('');
      document.body.innerHTML = `<div class="payment"><label for="y">Expiration date</label><select id="y" name="a">${years}</select></div>`;

      const result = getPaymentCardExpirationDateInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('year');
    });

    it('does not detect a date of birth field in a checkout', () => {
      document.body.innerHTML = '<div class="checkout"><label for="f1">Date of birth (MM/YY)</label><input type="text" id="f1" name="x" /></div>';

      expect(getPaymentCardExpirationDateInputs()).toEqual([]);
    });
  });

  describe('label detection is only a fallback', () => {
    it('keeps a label-only year select next to a selector-found month', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <select name="exp_month" id="m"><option value="01">01</option></select>
          <label for="y">Expiry year</label><select id="y" name="b"><option value="2026">2026</option></select>
        </form>
      `;

      expect(getPaymentCardExpirationDateInputs().map(entry => [entry.element.id, entry.type])).toEqual([['m', 'month'], ['y', 'year']]);
    });

    it('ignores a labelled field when the selectors already found a combined expiry in the same form', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input type="text" autocomplete="cc-exp" id="real" />
          <label for="other">Expiry date</label><input type="text" id="other" name="field_9" />
        </form>
      `;

      expect(getPaymentCardExpirationDateInputs().map(entry => entry.element.id)).toEqual(['real']);
    });

    it('types a month select from its options even when the label shows MM/YY', () => {
      const months = Array.from({ length: 12 }, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${i + 1}</option>`).join('');
      document.body.innerHTML = `<div class="payment"><label for="m">Expiry date (MM/YY)</label><select id="m" name="a">${months}</select></div>`;

      expect(getPaymentCardExpirationDateInputs().map(entry => entry.type)).toEqual(['month']);
    });
  });
});
