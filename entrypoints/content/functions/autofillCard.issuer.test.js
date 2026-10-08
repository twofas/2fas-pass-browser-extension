// @vitest-environment jsdom
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Spec: autofillCard() puts the card brand into the page's brand control: it picks the option of a brand
// select that names the brand (never one that only contains a short abbreviation such as "dis", "mc" or "dc"
// inside another word) and checks the radio of a brand radio group without changing any radio's value.
// Detection and filling run for real; only the layout-dependent visibility check is stubbed.

import { describe, it, expect, vi, afterEach } from 'vitest';

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

/**
 * Renders a card type select with the given options and returns it.
 * @param {Array<[string, string]>} options - The [value, text] pairs of the options.
 * @return {HTMLSelectElement} The select.
 */
const renderCardTypeSelect = options => {
  const optionsHtml = options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('');
  document.body.innerHTML = `<form><select name="cardType"><option value="">Choose…</option>${optionsHtml}</select></form>`;

  return document.querySelector('select');
};

/**
 * Renders a brand radio group whose labels show the brand only as an image, and returns its radios.
 * @param {string} [radioStyle] - Inline style of every radio (e.g. visually hidden radios).
 * @return {HTMLInputElement[]} The radios.
 */
const renderBrandRadios = (radioStyle = '') => {
  document.body.innerHTML = `
    <form>
      <input type="radio" id="b1" name="brand_choice" value="1" style="${radioStyle}" checked /><label for="b1"><img alt="Visa" /></label>
      <input type="radio" id="b2" name="brand_choice" value="2" style="${radioStyle}" /><label for="b2"><img alt="Mastercard" /></label>
      <input type="radio" id="b3" name="brand_choice" value="3" style="${radioStyle}" /><label for="b3"><img alt="American Express" /></label>
    </form>
  `;

  return [...document.querySelectorAll('input[type=radio]')];
};

describe('autofillCard card brand', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('select', () => {
    it('does not pick an option that only contains "dis" inside a word for a Discover card', async () => {
      const select = renderCardTypeSelect([['discount', 'Discount card'], ['visa', 'Visa']]);

      await autofillCard({ cardIssuer: 'Discover', cryptoAvailable: false });

      expect(select.value).toBe('');
    });

    it('does not pick an option that only contains "mc" inside a word for a Mastercard', async () => {
      const select = renderCardTypeSelect([['amc', 'AMC Stubs card'], ['visa', 'Visa']]);

      await autofillCard({ cardIssuer: 'MC', cryptoAvailable: false });

      expect(select.value).toBe('');
    });

    it('does not pick an option that only contains "dc" inside a word for a Diners Club card', async () => {
      const select = renderCardTypeSelect([['dcc', 'Prepaid (DCC)'], ['visa', 'Visa']]);

      await autofillCard({ cardIssuer: 'DinersClub', cryptoAvailable: false });

      expect(select.value).toBe('');
    });

    it('picks the option naming the brand as a word', async () => {
      const select = renderCardTypeSelect([['1', 'VISA (credit/debit)'], ['2', 'MasterCard®'], ['3', 'American Express®']]);

      await autofillCard({ cardIssuer: 'MC', cryptoAvailable: false });

      expect(select.value).toBe('2');
    });

    it('picks the option whose short code is the whole option text', async () => {
      const select = renderCardTypeSelect([['V', 'Visa'], ['M', 'MC'], ['D', 'DIS']]);

      await autofillCard({ cardIssuer: 'Discover', cryptoAvailable: false });

      expect(select.value).toBe('D');
    });
  });

  describe('radio group', () => {
    it('checks the radio of the card brand and fires its change event', async () => {
      const radios = renderBrandRadios();
      const onChange = vi.fn();
      radios[1].addEventListener('change', onChange);

      await autofillCard({ cardIssuer: 'MC', cryptoAvailable: false });

      expect(radios.map(radio => radio.checked)).toEqual([false, true, false]);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('never changes the values of the radios', async () => {
      const radios = renderBrandRadios();

      await autofillCard({ cardIssuer: 'AMEX', cryptoAvailable: false });

      expect(radios.map(radio => radio.value)).toEqual(['1', '2', '3']);
      expect(radios[2].checked).toBe(true);
    });

    it('checks a visually hidden radio through its visible label', async () => {
      const radios = renderBrandRadios('display: none');

      await autofillCard({ cardIssuer: 'MC', cryptoAvailable: false });

      expect(radios[1].checked).toBe(true);
    });

    it('leaves the group alone when the card brand is not offered', async () => {
      const radios = renderBrandRadios();

      await autofillCard({ cardIssuer: 'Discover', cryptoAvailable: false });

      expect(radios.map(radio => radio.checked)).toEqual([true, false, false]);
    });

    it('leaves a group with a non-card payment method alone', async () => {
      document.body.innerHTML = `
        <form>
          <label><input type="radio" name="method" value="paypal" checked /> PayPal</label>
          <label><input type="radio" name="method" value="visa" /> Visa</label>
          <label><input type="radio" name="method" value="mastercard" /> Mastercard</label>
        </form>
      `;
      const radios = [...document.querySelectorAll('input[type=radio]')];

      await autofillCard({ cardIssuer: 'Visa', cryptoAvailable: false });

      expect(radios.map(radio => radio.checked)).toEqual([true, false, false]);
    });
  });
});
