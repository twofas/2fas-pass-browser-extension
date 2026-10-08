// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the card-number detector should find the field that holds
// the primary account number on a checkout form and must not mistake the
// cardholder, CVV or expiry fields for it. Fixtures use canonical W3C
// autocomplete tokens plus the common name/placeholder conventions.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPaymentCardNumberInputs from './getPaymentCardNumberInputs';

const CHECKOUT_FORM = `
  <form id="checkout">
    <input autocomplete="cc-name" name="ccname" placeholder="Name on card" />
    <input autocomplete="cc-number" name="cardnumber" inputmode="numeric" placeholder="Card number" />
    <input autocomplete="cc-exp" name="cc-exp" placeholder="MM / YY" />
    <input autocomplete="cc-csc" name="cvc" placeholder="CVC" />
  </form>
`;

describe('getPaymentCardNumberInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('detection', () => {
    it('detects a field flagged with the cc-number autocomplete token', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" inputmode="numeric" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });

    it('detects a field by common name conventions (cardnumber, card_number)', () => {
      document.body.innerHTML = `
        <input type="text" name="cardNumber" />
        <input type="text" name="card_number" />
      `;

      expect(getPaymentCardNumberInputs()).toHaveLength(2);
    });

    it('detects a field by its "Card number" placeholder', () => {
      document.body.innerHTML = '<input type="text" placeholder="Card Number" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });

    it('accepts a numeric inputmode (the standard for card-number fields)', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" inputmode="numeric" name="cardnumber" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('isolation from other card fields', () => {
    it('returns only the card-number field from a full checkout form', () => {
      document.body.innerHTML = CHECKOUT_FORM;

      const result = getPaymentCardNumberInputs();

      expect(result).toHaveLength(1);
      expect(result[0].getAttribute('autocomplete')).toBe('cc-number');
    });

    it('does not treat a cardholder name field as a card number', () => {
      document.body.innerHTML = '<input autocomplete="cc-name" name="cardholderName" />';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not treat a CVV field as a card number', () => {
      document.body.innerHTML = '<input autocomplete="cc-csc" name="cvc" />';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });
  });

  describe('exclusions', () => {
    it('returns an empty array on a page with no payment form', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      `;

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('ignores a card-number field that is not visible', () => {
      document.body.innerHTML = '<input autocomplete="cc-number" name="cardnumber" data-invisible="true" />';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });
  });

  describe('shadow DOM', () => {
    it('detects a card-number field rendered inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input autocomplete="cc-number" name="cardnumber" inputmode="numeric" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('regression: framework validation classes (review #5)', () => {
    it('still detects a cc-number field carrying Angular/Bootstrap validation classes', () => {
      // ng-valid / is-invalid contain the substring "valid" (an expiry keyword);
      // they must not cause the PAN field to be dropped.
      document.body.innerHTML = '<input autocomplete="cc-number" inputmode="numeric" class="form-control ng-valid is-invalid" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('regression: wrapper must not override field identity (review #6)', () => {
    it('does not treat a CVV input inside a [data-field="cardNumber"] wrapper as the card number', () => {
      document.body.innerHTML = '<div data-field="cardNumber"><input type="text" name="cvc" placeholder="CVC" /></div>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });
  });

  describe('regression: a payment method field is not the card number (mcd.delawareinc.com)', () => {
    it('does not treat a text input identified as the payment method as the card number', () => {
      document.body.innerHTML = '<input type="text" id="paymentMethod" />';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });
  });

  describe('regression: fused CVV/security identifiers stay rejected (verification follow-up)', () => {
    it('does not treat a CVV field (id="cvv2") inside a payment form as the card number', () => {
      document.body.innerHTML = '<form id="paymentForm"><input type="text" id="cvv2" /></form>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not treat a security-code field (name="securityCode") inside a payment form as the card number', () => {
      document.body.innerHTML = '<form id="paymentForm"><input type="tel" name="securityCode" /></form>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not treat a card-verification field (name="CreditCardVerificationNumber") inside a payment form as the card number', () => {
      document.body.innerHTML = `
        <form id="paymentForm">
          <input type="text" id="CreditCardNumber" name="CreditCardNumber" />
          <input type="text" id="CreditCardVerificationNumber" name="CreditCardVerificationNumber" />
        </form>
      `;

      expect(getPaymentCardNumberInputs().map(input => input.name)).toEqual(['CreditCardNumber']);
    });

    it('does not treat delimited card-verification fields inside a payment form as the card number', () => {
      document.body.innerHTML = `
        <form id="paymentForm">
          <input type="text" name="billing_card_verification_value" />
          <input type="text" id="new-card-verification" />
        </form>
      `;

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not treat a CCV field (name="ccv") inside a payment form as the card number', () => {
      document.body.innerHTML = '<form id="paymentForm"><input type="text" name="ccv" /></form>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('still detects a card-number field whose name merely contains a short token as a substring', () => {
      // 'commerce' contains 'mm' (an expiry keyword) — the PAN must NOT be dropped for it.
      document.body.innerHTML = '<input type="text" name="commerce-card-number" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('regression: autocomplete conflict matched by token, not substring (review #7)', () => {
    it('keeps a card-number field whose autocomplete merely contains a conflicting token as a substring', () => {
      // field token "language-preference" is not a real conflicting value, even though
      // it contains the substring "language"; the PAN must be kept.
      document.body.innerHTML = '<input type="text" name="cardnumber" autocomplete="language-preference" />';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('regression: cc-number "allow" path matches the trailing field token, not a substring (review #2)', () => {
    it('rejects a field whose trailing autocomplete token is a conflicting value even though it contains the cc-number substring', () => {
      // The allow short-circuit must use the trailing field token (here cc-csc, a CVV),
      // not a raw .includes("cc-number"), otherwise this CVV field is mistaken for the PAN.
      document.body.innerHTML = '<input autocomplete="cc-number cc-csc" inputmode="numeric" />';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });
  });

  describe('detection by label (paymentCardNumberWords)', () => {
    it('detects a field with an opaque name whose label names the card number, next to another labelled card field', () => {
      document.body.innerHTML = `
        <form>
          <label for="f1">Card number</label><input type="text" id="f1" name="field_1" />
          <label for="f2">Expiry date</label><input type="text" id="f2" name="field_2" />
        </form>
      `;

      expect(getPaymentCardNumberInputs().map(input => input.id)).toEqual(['f1']);
    });

    it('detects a field labelled in another Chromium language inside a payment container', () => {
      document.body.innerHTML = '<div class="checkout-payment"><label for="f1">Número do cartão</label><input type="tel" id="f1" name="x" /></div>';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });

    it('does not detect a lone "Card number" field outside of a payment context', () => {
      document.body.innerHTML = '<form><label for="f1">Card number</label><input type="text" id="f1" name="x" /></form>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not detect a gift card number field', () => {
      document.body.innerHTML = `
        <form class="checkout-payment">
          <label for="f1">Gift card number</label><input type="text" id="f1" name="x" />
          <div class="giftcard-section"><label for="f2">Card number</label><input type="text" id="f2" name="y" /></div>
        </form>
      `;

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('still rejects a labelled field with a conflicting type', () => {
      document.body.innerHTML = '<div class="payment"><label for="f1">Card number</label><input type="email" id="f1" /></div>';

      expect(getPaymentCardNumberInputs()).toEqual([]);
    });

    it('does not return a field twice when both its name and its label match', () => {
      document.body.innerHTML = '<div class="payment"><label for="f1">Card number</label><input type="text" id="f1" name="cardnumber" /></div>';

      expect(getPaymentCardNumberInputs()).toHaveLength(1);
    });
  });

  describe('label detection is only a fallback', () => {
    it('ignores a labelled field when the selectors already found the card number in the same form', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" autocomplete="cc-number" id="real" />
          <label for="other">Card number</label><input type="text" id="other" name="field_9" />
        </form>
      `;

      expect(getPaymentCardNumberInputs().map(input => input.id)).toEqual(['real']);
    });

    it('does not fill a rewards card number on a checkout page', () => {
      document.body.className = 'woocommerce-checkout';
      document.body.innerHTML = `
        <form><label for="r">Rewards card number</label><input type="text" id="r" name="a" /></form>
        <form><label for="e">Expiry date</label><input type="text" id="e" name="b" /></form>
      `;

      expect(getPaymentCardNumberInputs()).toEqual([]);
      document.body.className = '';
    });
  });
});
