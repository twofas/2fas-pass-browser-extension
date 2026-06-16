// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: the cardholder-name detector should find the name field on
// a payment form (full name, or split given/family name), classify it, and only
// treat generic billing-name/labelled fields as cardholder fields when they sit
// in a payment context. It must never return a non-name field (phone, address).

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import getPaymentCardholderNameInputs from './getPaymentCardholderNameInputs';

// jsdom does not implement the CSS object; getAssociatedLabelText needs CSS.escape.
beforeAll(() => {
  if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
    globalThis.CSS = globalThis.CSS || {};
    globalThis.CSS.escape = value => String(value).replace(/[^a-zA-Z0-9_-]/g, char => `\\${char}`);
  }
});

const entryFor = (result, predicate) => result.find(predicate);

describe('getPaymentCardholderNameInputs', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('direct cardholder fields (no payment context required)', () => {
    it('detects a cc-name field and classifies it as a full name', () => {
      document.body.innerHTML = '<input autocomplete="cc-name" name="ccname" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('full');
    });

    it('detects a cc-given-name field as a given name', () => {
      document.body.innerHTML = '<input autocomplete="cc-given-name" name="cc-given" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('given');
    });

    it('detects a cc-family-name field as a family name', () => {
      document.body.innerHTML = '<input autocomplete="cc-family-name" name="cc-family" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('family');
    });

    it('detects a field by the "cardholder" name convention', () => {
      document.body.innerHTML = '<input type="text" name="cardHolderName" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('full');
    });
  });

  describe('label-based detection in a payment context', () => {
    it('detects a generic text field labelled "Name on card" inside a payment form', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <label for="holder">Name on card</label>
          <input id="holder" type="text" name="recipient" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const result = getPaymentCardholderNameInputs();
      const holder = entryFor(result, entry => entry.element.id === 'holder');

      expect(holder).toBeDefined();
      expect(holder.type).toBe('full');
    });

    it('detects the "Name on card" field on a Stripe-style form where the PAN lives in an iframe', () => {
      // On Stripe Elements / Braintree Hosted Fields the number/CVV/expiry are
      // rendered inside cross-origin iframes, so the merchant form often holds
      // only the cardholder input. The "Name on card" label itself is the
      // payment-context signal, and the field should still be detected.
      document.body.innerHTML = `
        <form class="checkout-form">
          <label for="holder">Name on card</label>
          <input id="holder" type="text" name="recipient" />
          <div class="card-element"><!-- Stripe iframe mounts here --></div>
        </form>
      `;

      const result = getPaymentCardholderNameInputs();
      const holder = entryFor(result, entry => entry.element.id === 'holder');

      expect(holder).toBeDefined();
      expect(holder.type).toBe('full');
    });
  });

  describe('split billing name in a payment context', () => {
    it('detects given-name and family-name billing fields when card fields are present', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input autocomplete="given-name" name="firstName" />
          <input autocomplete="family-name" name="lastName" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const result = getPaymentCardholderNameInputs();
      const given = entryFor(result, entry => entry.element.getAttribute('autocomplete') === 'given-name');
      const family = entryFor(result, entry => entry.element.getAttribute('autocomplete') === 'family-name');

      expect(given?.type).toBe('given');
      expect(family?.type).toBe('family');
    });

    it('does NOT pick up given-name/family-name fields outside a payment context', () => {
      document.body.innerHTML = `
        <form class="signup">
          <input autocomplete="given-name" name="firstName" />
          <input autocomplete="family-name" name="lastName" />
        </form>
      `;

      expect(getPaymentCardholderNameInputs()).toEqual([]);
    });

    it('classifies firstName/lastName name conventions as given/family', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input type="text" name="firstName" />
          <input type="text" name="lastName" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const result = getPaymentCardholderNameInputs();

      expect(entryFor(result, entry => entry.element.name === 'firstName')?.type).toBe('given');
      expect(entryFor(result, entry => entry.element.name === 'lastName')?.type).toBe('family');
    });
  });

  describe('exclusions', () => {
    it('never returns a phone field even if it is labelled like a cardholder name', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input autocomplete="cc-number" name="cardnumber" />
          <label for="weird">Cardholder name</label>
          <input id="weird" type="text" autocomplete="tel" name="phone" />
        </form>
      `;

      expect(getPaymentCardholderNameInputs()).toEqual([]);
    });

    it('ignores a cardholder field that is not visible', () => {
      document.body.innerHTML = '<input autocomplete="cc-name" name="ccname" data-invisible="true" />';

      expect(getPaymentCardholderNameInputs()).toEqual([]);
    });

    it('returns an empty array on a page with no name field', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input autocomplete="cc-number" name="cardnumber" />
          <input autocomplete="cc-csc" name="cvc" />
        </form>
      `;

      expect(getPaymentCardholderNameInputs()).toEqual([]);
    });
  });

  describe('regression: middle name must not get the full name (review #15)', () => {
    it('classifies a cc-additional-name field as "additional", not "full"', () => {
      document.body.innerHTML = '<input autocomplete="cc-additional-name" name="middle" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('additional');
    });
  });

  describe('regression: a full-name label is not overridden by an id substring (review #16)', () => {
    it('keeps a "Name on card" labelled field as full even when its id contains "surname"', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <label for="holder">Name on card</label>
          <input id="card-surname-holder" type="text" name="recipient" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const result = getPaymentCardholderNameInputs();
      const holder = entryFor(result, entry => entry.element.id === 'card-surname-holder');

      expect(holder).toBeDefined();
      expect(holder.type).toBe('full');
    });
  });

  describe('regression: split-name labels keep given/family (verification follow-up)', () => {
    it('classifies "First name on card" / "Last name on card" fields as given/family, not full', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <label for="fn">First name on card</label>
          <input id="fn" type="text" name="firstName" />
          <label for="ln">Last name on card</label>
          <input id="ln" type="text" name="lastName" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const result = getPaymentCardholderNameInputs();

      expect(entryFor(result, entry => entry.element.id === 'fn')?.type).toBe('given');
      expect(entryFor(result, entry => entry.element.id === 'ln')?.type).toBe('family');
    });

    it('classifies a combined "first and last name" field as full (not family)', () => {
      document.body.innerHTML = `
        <form class="checkout">
          <input id="combined" type="text" name="cardholderName" placeholder="Your first and last name" />
          <input autocomplete="cc-number" name="cardnumber" />
        </form>
      `;

      const combined = entryFor(getPaymentCardholderNameInputs(), entry => entry.element.id === 'combined');

      expect(combined?.type).toBe('full');
    });
  });

  describe('regression: payment context must be structural, not text in outerHTML (review #17)', () => {
    it('does NOT detect billing names just because the form text mentions "card"', () => {
      document.body.innerHTML = `
        <form class="profile">
          <h2>Update your loyalty card preferences</h2>
          <input autocomplete="given-name" name="firstName" />
          <input autocomplete="family-name" name="lastName" />
        </form>
      `;

      expect(getPaymentCardholderNameInputs()).toEqual([]);
    });
  });

  describe('shadow DOM', () => {
    it('detects a cc-name field rendered inside an open shadow root', () => {
      document.body.innerHTML = '<div id="host"></div>';
      const root = document.getElementById('host').attachShadow({ mode: 'open' });

      root.innerHTML = '<input autocomplete="cc-name" name="ccname" />';

      const result = getPaymentCardholderNameInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('full');
    });
  });
});
