// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec: autofillCard() fills the card fields of a checkout and leaves the page's own payment
// controls alone. Regression for mcd.delawareinc.com: the card brand was written into the value of the
// "Credit/Debit Card" and "Bank Account" radios, so the page's change handler hid the card form.
// Detection and filling run for real; only the layout-dependent visibility check is stubbed.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/partials/functions/isVisible', () => ({
  default: element => {
    if (!element || element.type === 'hidden') {
      return false;
    }

    for (let node = element; node && node.nodeType === Node.ELEMENT_NODE; node = node.parentElement) {
      if (node.hidden || node.style.display === 'none') {
        return false;
      }
    }

    return true;
  }
}));

import autofillCard from './autofillCard';

const CHECKOUT = `
  <form id="paymentForm">
    <select name="payment_method" id="paymentMethod">
      <option value="">Select a payment method...</option>
      <option value="paypal">PayPal</option>
      <option value="new" selected>New Payment Method (Credit Card/ACH)</option>
    </select>
    <div id="newPaymentMethodArea">
      <label for="pay_first_name">First Name</label>
      <input type="text" id="pay_first_name" name="address[pay][first_name]" value="" />
      <label><input type="radio" name="payment_type" value="cc" checked /> Credit/Debit Card</label>
      <label><input type="radio" name="payment_type" value="ach" /> Bank Account / ACH</label>
      <div id="credit_card_form">
        <label for="cc_number">Card Number</label>
        <input type="text" id="cc_number" name="cc_number" value="" />
        <label for="cc_exp">Expiration</label>
        <input type="text" id="cc_exp" name="cc_exp" value="" placeholder="MMYY" />
        <label for="cc_cvv">Security Code</label>
        <input type="text" id="cc_cvv" name="cc_cvv" value="" />
      </div>
      <div id="bank_form" style="display: none;">
        <input type="radio" name="account_type" value="checking" checked />
        <input type="radio" name="account_type" value="savings" />
        <input type="text" id="bank_account_number" name="bank_account_number" value="" />
      </div>
    </div>
    <button id="submitPaymentButton" type="submit">Complete Order</button>
  </form>
`;

/**
 * Mirrors the page's own jQuery handlers: the checked payment type shows its form, the payment method shows the new payment area.
 * @param {Event} event - The change event bubbling to the document.
 * @return {void}
 */
const onPageChange = event => {
  if (event.target.matches('input[name=payment_type]')) {
    const selection = document.querySelector('input[name=payment_type]:checked')?.value;
    document.getElementById('credit_card_form').style.display = selection === 'cc' ? '' : 'none';
    document.getElementById('bank_form').style.display = selection === 'ach' ? '' : 'none';
  }

  if (event.target.matches('#paymentMethod')) {
    document.getElementById('newPaymentMethodArea').style.display = event.target.value === 'new' ? '' : 'none';
  }
};

const CARD = {
  cardholderName: 'John Doe',
  cardNumber: '4111111111111111',
  expirationDate: '12/30',
  securityCode: '123',
  cardIssuer: 'Visa',
  cryptoAvailable: false
};

describe('autofillCard on a checkout with its own payment controls', () => {
  beforeEach(() => {
    document.body.innerHTML = CHECKOUT;
    document.addEventListener('change', onPageChange);
  });

  afterEach(() => {
    document.removeEventListener('change', onPageChange);
    document.body.innerHTML = '';
  });

  it('fills the card number, expiration date and security code', async () => {
    await autofillCard(CARD);

    expect(document.getElementById('cc_number').value).toBe('4111111111111111');
    expect(document.getElementById('cc_exp').value).toBe('12/30');
    expect(document.getElementById('cc_cvv').value).toBe('123');
  });

  it('keeps the values of the payment type radios and the card option checked', async () => {
    await autofillCard(CARD);

    const radios = [...document.querySelectorAll('input[name=payment_type]')];

    expect(radios.map(radio => radio.value)).toEqual(['cc', 'ach']);
    expect(document.querySelector('input[name=payment_type]:checked').value).toBe('cc');
  });

  it('leaves the card form visible and the new payment method selected', async () => {
    await autofillCard(CARD);

    expect(document.getElementById('credit_card_form').style.display).toBe('');
    expect(document.getElementById('newPaymentMethodArea').style.display).toBe('');
    expect(document.getElementById('paymentMethod').value).toBe('new');
  });
});
