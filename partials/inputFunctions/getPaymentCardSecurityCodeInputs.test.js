// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the security-code detector should find the CVV/CVC/CSC
// field by autocomplete, name, id or placeholder, and must not mistake the
// number, name or expiry field for it.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPaymentCardSecurityCodeInputs from './getPaymentCardSecurityCodeInputs';

describe('getPaymentCardSecurityCodeInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('detection', () => {
    it('detects a field flagged with the cc-csc autocomplete token', () => {
      document.body.innerHTML = '<input autocomplete="cc-csc" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });

    it('detects the field by the common cvv/cvc/csc name conventions', () => {
      document.body.innerHTML = `
        <input type="text" name="cvv" />
        <input type="text" name="cvc" />
        <input type="text" name="csc" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(3);
    });

    it('detects the field by its id', () => {
      document.body.innerHTML = '<input type="text" id="card-cvc-field" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });

    it('detects the field by a CVC placeholder', () => {
      document.body.innerHTML = '<input type="text" placeholder="CVC" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });
  });

  describe('regression: card-verification naming and "CCV" (summitracing.com)', () => {
    it('detects a field named CreditCardVerificationNumber', () => {
      document.body.innerHTML = '<input type="text" id="CreditCardVerificationNumber" name="CreditCardVerificationNumber" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });

    it('detects card-verification compounds delimited by - or _ in the name or id', () => {
      document.body.innerHTML = `
        <input type="text" name="billing_card_verification_value" />
        <input type="text" id="new-card-verification" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(2);
    });

    it('detects a field literally named or identified as "ccv"', () => {
      document.body.innerHTML = '<input type="text" name="ccv" />';
      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);

      document.body.innerHTML = '<input type="text" id="CCV" />';
      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });

    it('returns only the security code from the Summit card form, not the card number', () => {
      document.body.innerHTML = `
        <div id="payment-option-container-card">
          <input type="text" id="CreditCardNumber" name="CreditCardNumber" />
          <select id="ExpMon" name="ExpMon" aria-label="Expiration date: month"><option value="1">1</option></select>
          <select id="ExpYr" name="ExpYr" aria-label="Expiration date: year"><option value="2031">2031</option></select>
          <input type="text" id="CreditCardVerificationNumber" name="CreditCardVerificationNumber" />
        </div>
      `;

      const result = getPaymentCardSecurityCodeInputs();

      expect(result.map(input => input.name)).toEqual(['CreditCardVerificationNumber']);
    });
  });

  describe('regression: generic verification fields must not be taken for a security code', () => {
    it('ignores password, email, phone and TOTP verification fields', () => {
      document.body.innerHTML = `
        <input type="text" name="passwordVerification" />
        <input type="text" name="email_verification" />
        <input type="text" id="phoneVerificationCode" />
        <input type="text" name="totp-verification" />
        <input type="text" name="verificationNumber" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });

    it('ignores bare verificationCode/verificationValue fields (SMS/e-mail codes), in any delimiter style', () => {
      document.body.innerHTML = `
        <input type="text" name="verificationCode" />
        <input type="text" id="verification_code" />
        <input type="text" name="verification-value" />
        <input type="text" aria-label="verificationValue" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });

    it('still detects card-scoped verificationCode/verificationValue fields', () => {
      document.body.innerHTML = `
        <input type="text" name="cardVerificationCode" />
        <input type="text" id="card_verification_value" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(2);
    });

    it('does not match "ccv" as an embedded substring (e.g. accVerification)', () => {
      document.body.innerHTML = `
        <input type="text" name="accVerification" />
        <input type="text" id="saccvault" />
      `;

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });
  });

  describe('isolation from other card fields', () => {
    it('returns only the security-code field from a full checkout form', () => {
      document.body.innerHTML = `
        <form id="checkout">
          <input autocomplete="cc-name" name="ccname" />
          <input autocomplete="cc-number" name="cardnumber" />
          <input autocomplete="cc-exp" name="cc-exp" placeholder="MM / YY" />
          <input autocomplete="cc-csc" name="cvc" placeholder="CVC" />
        </form>
      `;

      const result = getPaymentCardSecurityCodeInputs();

      expect(result).toHaveLength(1);
      expect(result[0].getAttribute('autocomplete')).toBe('cc-csc');
    });
  });

  describe('exclusions', () => {
    it('returns an empty array when there is no security-code field', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" name="cardnumber" />';

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });

    it('ignores a security-code field that is not visible', () => {
      document.body.innerHTML = '<input autocomplete="cc-csc" name="cvc" data-invisible="true" />';

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });
  });

  describe('regression: context-free placeholders must not match (review #10)', () => {
    it('does not type the CVV into an OTP/PIN field that merely uses a 000/0000 placeholder', () => {
      document.body.innerHTML = '<input type="text" name="otp" placeholder="000" />';
      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);

      document.body.innerHTML = '<input type="text" name="one-time-code" placeholder="0000" />';
      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);

      document.body.innerHTML = '<input type="text" name="pin" placeholder="0000" />';
      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });
  });

  describe('regression: csc must not match embedded substrings (review #12)', () => {
    it('does not treat a CS-Cart login field (name="cscart_user_login") as a security code', () => {
      document.body.innerHTML = '<input type="text" name="cscart_user_login" />';

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });

    it('still detects a field literally named "csc"', () => {
      document.body.innerHTML = '<input type="text" name="csc" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });

    it('still detects a boundary-delimited csc field (name="card-csc")', () => {
      document.body.innerHTML = '<input type="text" name="card-csc" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });
  });

  describe('regression: conflicting autocomplete matched by token (review #11)', () => {
    it('rejects a cvv-named field that declares itself a card number via a grouped autocomplete', () => {
      document.body.innerHTML = '<input type="text" name="cvv" autocomplete="billing cc-number" />';

      expect(getPaymentCardSecurityCodeInputs()).toEqual([]);
    });
  });

  describe('shadow DOM', () => {
    it('detects a security-code field rendered inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input autocomplete="cc-csc" name="cvc" />';

      expect(getPaymentCardSecurityCodeInputs()).toHaveLength(1);
    });
  });
});
