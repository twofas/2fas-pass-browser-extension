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

  describe('regression: payment method and payment type controls are not the card brand (mcd.delawareinc.com)', () => {
    it('does not treat the card/bank payment type radios of a payment form as issuer controls', () => {
      document.body.innerHTML = `
        <form id="paymentForm">
          <input type="radio" name="payment_type" value="cc" checked />
          <input type="radio" name="payment_type" value="ach" />
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not treat radios or checkboxes as issuer controls, even with a card-scoped name', () => {
      document.body.innerHTML = `
        <input type="radio" name="cardType" value="visa" />
        <input type="checkbox" name="card_type" value="mastercard" />
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not treat a payment method select (PayPal / new card) as an issuer control', () => {
      document.body.innerHTML = `
        <select name="payment_method" id="paymentMethod">
          <option value="">Select a payment method...</option>
          <option value="paypal">PayPal</option>
          <option value="new">New Payment Method (Credit Card/ACH)</option>
        </select>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not treat payment method or payment type text inputs as issuer controls', () => {
      document.body.innerHTML = `
        <input type="text" name="payment_method" />
        <input type="text" id="paymentType" />
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not treat a control of a payment form as an issuer control only because its name contains "type"', () => {
      document.body.innerHTML = `
        <form id="paymentForm">
          <select name="account_type"><option>Checking</option><option>Savings</option></select>
          <input type="text" name="entity_type" />
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });
  });

  describe('saved card chooser', () => {
    it('does not treat a select of the user\'s saved cards as an issuer control', () => {
      document.body.innerHTML = `
        <form id="creditCardForm">
          <select name="user_card" id="userCard">
            <option value="">Use a new card</option>
            <option value="81">Visa ending 4242</option>
            <option value="82">Mastercard ending 4444</option>
          </select>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });
  });

  describe('generic names (issuer, brand, network, provider) need a payment card form', () => {
    it('does not detect controls named only by a generic word outside a payment card form', () => {
      document.body.innerHTML = `
        <select name="brand"><option>Visa</option></select>
        <input type="text" id="issuer" />
        <input type="text" placeholder="Network" />
        <select aria-label="Provider"><option>Visa</option></select>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not detect a generic-named control in a payment form that is not marked as a card form', () => {
      document.body.innerHTML = '<form id="paymentForm"><select name="brand"><option>Visa</option></select></form>';

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('detects a generic-named control in a form identified as a card form', () => {
      document.body.innerHTML = '<form id="creditCardForm"><select name="brand"><option>Visa</option></select></form>';

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });

    it('detects a generic-named control in a container identified as a card form', () => {
      document.body.innerHTML = '<div class="card-form"><div><select name="network"><option>Visa</option></select></div></div>';

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });

    it('detects a generic-named control in a form with an autocomplete card field', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="pan" autocomplete="billing cc-number" />
          <select name="issuer"><option>Visa</option></select>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });

    it('does not detect a select labelled only "Brand", even in a payment form', () => {
      document.body.innerHTML = '<form class="payment"><label for="b">Brand</label><select id="b" name="x"><option>Visa</option></select></form>';

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });
  });

  describe('radio buttons of card brands', () => {
    it('detects a group of card brand radios as one issuer control', () => {
      document.body.innerHTML = `
        <form>
          <label><input type="radio" name="cardBrand" value="visa" /> Visa</label>
          <label><input type="radio" name="cardBrand" value="mastercard" /> Mastercard</label>
          <label><input type="radio" name="cardBrand" value="amex" /> American Express</label>
        </form>
      `;

      const result = getPaymentCardIssuerInputs();

      expect(result).toHaveLength(1);
      expect(result[0].isRadioGroup).toBe(true);
      expect(result[0].isSelect).toBe(false);
      expect(result[0].radios.map(radio => radio.value)).toEqual(['visa', 'mastercard', 'amex']);
    });

    it('detects brand radios with opaque values by the image text of their labels', () => {
      document.body.innerHTML = `
        <form>
          <input type="radio" id="b1" name="pm" value="1" /><label for="b1"><img src="v.png" alt="Visa" /></label>
          <input type="radio" id="b2" name="pm" value="2" /><label for="b2"><img src="m.png" alt="MasterCard" /></label>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toHaveLength(1);
    });

    it('does not detect a radio group that also offers a method other than a card brand', () => {
      document.body.innerHTML = `
        <form>
          <label><input type="radio" name="method" value="visa" /> Visa</label>
          <label><input type="radio" name="method" value="mastercard" /> Mastercard</label>
          <label><input type="radio" name="method" value="paypal" /> PayPal</label>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not detect a radio group naming a single brand only', () => {
      document.body.innerHTML = `
        <form>
          <label><input type="radio" name="kind" value="credit" /> Visa Credit</label>
          <label><input type="radio" name="kind" value="debit" /> Visa Debit</label>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });

    it('does not detect brand radios that are hidden together with their labels', () => {
      document.body.innerHTML = `
        <form>
          <label data-invisible="true"><input type="radio" name="cardBrand" value="visa" data-invisible="true" /> Visa</label>
          <label data-invisible="true"><input type="radio" name="cardBrand" value="mastercard" data-invisible="true" /> Mastercard</label>
        </form>
      `;

      expect(getPaymentCardIssuerInputs()).toEqual([]);
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

  describe('detection by label (paymentCardIssuerWords)', () => {
    it('detects a select with an opaque name labelled "Card type" in a payment form', () => {
      document.body.innerHTML = '<form class="payment"><label for="t">Card type</label><select id="t" name="x"><option>Visa</option></select></form>';

      const result = getPaymentCardIssuerInputs();

      expect(result).toHaveLength(1);
      expect(result[0].isSelect).toBe(true);
    });

    it('does not detect an "Account type" select', () => {
      document.body.innerHTML = '<form class="payment"><label for="t">Account type</label><select id="t" name="x"><option>Personal</option></select></form>';

      expect(getPaymentCardIssuerInputs()).toEqual([]);
    });
  });
});
