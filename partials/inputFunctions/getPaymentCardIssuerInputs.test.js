// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the issuer detector should find the card-type/brand control
// (usually a <select>, occasionally an <input>) and report whether it is a
// select so the caller can fill it appropriately.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPaymentCardIssuerInputs from './getPaymentCardIssuerInputs';

describe('getPaymentCardIssuerInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('detection', () => {
    it('detects a cc-type <select> and flags it as a select', () => {
      document.body.innerHTML = `
        <select autocomplete="cc-type" name="cardType">
          <option>Visa</option>
          <option>Mastercard</option>
        </select>
      `;

      const result = getPaymentCardIssuerInputs();

      expect(result).toHaveLength(1);
      expect(result[0].isSelect).toBe(true);
    });

    it('detects the brand control by its name (card_type, cctype)', () => {
      document.body.innerHTML = `
        <select name="card_type"><option>visa</option></select>
        <select name="cctype"><option>visa</option></select>
      `;

      expect(getPaymentCardIssuerInputs()).toHaveLength(2);
    });

    it('detects an <input>-based brand control and flags isSelect as false', () => {
      document.body.innerHTML = '<input type="text" name="cardType" />';

      const result = getPaymentCardIssuerInputs();

      expect(result).toHaveLength(1);
      expect(result[0].isSelect).toBe(false);
    });
  });

  describe('exclusions', () => {
    it('does not treat the card-number field as an issuer control', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" name="cardnumber" />';

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('ignores an issuer control that is not visible', () => {
      document.body.innerHTML = '<select autocomplete="cc-type" name="cardType" data-invisible="true"><option>Visa</option></select>';

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });
  });

  describe('regression: explicit cc-type beats the denied-keyword heuristic (review #13/#14)', () => {
    it('detects a cc-type control whose name only contains a denied token as a substring', () => {
      document.body.innerHTML = '<select autocomplete="cc-type" name="card_type_statement"><option>Visa</option></select>'; // 'state' inside 'statement'

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });

    it('detects a cc-type control even when its name contains a denied whole word', () => {
      document.body.innerHTML = '<select autocomplete="cc-type" name="select_country_cardtype"><option>Visa</option></select>'; // 'country' is denied, but cc-type is authoritative

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });
  });

  describe('shadow DOM', () => {
    it('detects an issuer control rendered inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<select autocomplete="cc-type" name="cardType"><option>Visa</option></select>';

      const result = getPaymentCardIssuerInputs();

      expect(result).toHaveLength(1);
      expect(result[0].isSelect).toBe(true);
    });
  });
});
