// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// @vitest-environment jsdom

// Spec-first tests: a payment card field is recognised by the words of its visible label (as the username
// field is), only inside a payment form, and never when the label names a gift card, a one-time code,
// a phone number or a birth date. The positive labels are the real field labels of the Adyen Web checkout
// in the languages covered by Chromium's credit card autofill patterns.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../functions/isVisible', () => ({
  default: element => element?.getAttribute?.('data-invisible') !== 'true'
}));

import { paymentCardNumberWords, paymentCardSecurityCodeWords } from '@/constants';
import { createLabelMatcher, normalizeLabelText, classifyPaymentCardLabel, getPaymentCardElementsByLabel } from './paymentCardLabels';

const labelled = (label, attributes = '') => `<label for="f">${label}</label><input type="text" id="f" ${attributes} />`;

const classifyLabel = label => {
  document.body.innerHTML = labelled(label);

  return classifyPaymentCardLabel(document.getElementById('f'));
};

describe('paymentCardLabels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('normalizeLabelText', () => {
    it('lowercases, collapses whitespace (also non-breaking) and unifies apostrophes', () => {
      expect(normalizeLabelText('  Date d’Expiration \n ')).toBe("date d'expiration");
    });
  });

  describe('createLabelMatcher', () => {
    const matchesNumber = createLabelMatcher(paymentCardNumberWords);
    const matchesSecurityCode = createLabelMatcher(paymentCardSecurityCodeWords);

    it('requires short words to stand alone', () => {
      expect(matchesSecurityCode('kod cvv')).toBe(true);
      expect(matchesSecurityCode('cvv/cvc')).toBe(true);
      expect(matchesSecurityCode('cvcode')).toBe(false);
      expect(matchesSecurityCode('lucid')).toBe(false);
      expect(matchesSecurityCode('cidade')).toBe(false);
    });

    it('requires longer words to start a word but allows an inflected ending', () => {
      expect(matchesNumber('card numbers')).toBe(true);
      expect(matchesNumber('discard number')).toBe(false);
      expect(matchesNumber('card not required')).toBe(false);
    });

    it('matches CJK and Hangul phrases anywhere', () => {
      expect(matchesNumber('クレジットカード番号を入力')).toBe(true);
      expect(matchesNumber('信用卡卡號')).toBe(true);
      expect(matchesNumber('카드 번호를 입력하세요')).toBe(true);
    });

    it('never matches empty text', () => {
      expect(matchesNumber('')).toBe(false);
    });
  });

  describe('classifyPaymentCardLabel', () => {
    it.each([
      'Card number', 'Kartennummer', 'Número de tarjeta', 'Numéro de la carte', 'Numero carta', 'Número do cartão',
      'Номер карты', 'カード番号', '卡号', '信用卡號碼', '카드 번호', 'Nomor kartu', 'Card #'
    ])('classifies "%s" as the card number', label => {
      expect(classifyLabel(label)).toBe('number');
    });

    it.each([
      'Name on card', 'Name auf der Karte', 'Nombre en la tarjeta', 'Nom sur la carte', 'Titolare carta', 'Nome no cartão',
      'Имя на карте', 'カード上の名前', '卡片上的姓名', '信用卡上的姓名', '카드상의 이름', 'Nama pada kartu', 'Name des Karteninhabers'
    ])('classifies "%s" as the cardholder name', label => {
      expect(classifyLabel(label)).toBe('holder');
    });

    it.each([
      'Expiry date', 'Ablaufdatum', 'Fecha de expiración', "Date d'expiration", 'Date d’expiration', 'Data di scadenza',
      'Data de validade', 'Срок действия', '有効期限', '有效期', '到期日期', '만료일', 'Masa berlaku', 'MM/YY'
    ])('classifies "%s" as the expiration date', label => {
      expect(classifyLabel(label)).toBe('expiration');
    });

    it.each([
      'Security code', 'CVC', 'CVV2', 'Sicherheitscode', 'Kartenprüfnummer', 'Código de seguridad', 'Code de sécurité',
      'Cryptogramme visuel', 'Codice di sicurezza', 'Código de segurança', 'Защитный код', 'セキュリティコード', '安全码', '安全碼', '보안 코드'
    ])('classifies "%s" as the security code', label => {
      expect(classifyLabel(label)).toBe('securityCode');
    });

    it.each([
      'Card type', 'Kartentyp', 'Tipo de tarjeta', 'Type de carte', 'Tipo di carta', 'Tipo de cartão', 'Тип карты', 'カードの種類', '卡类型', '카드 종류', 'Jenis kartu'
    ])('classifies "%s" as the card issuer', label => {
      expect(classifyLabel(label)).toBe('issuer');
    });

    it('reads the aria-label, the aria-labelledby text, the placeholder and the title too', () => {
      document.body.innerHTML = `
        <input type="text" id="a" aria-label="Card number" />
        <span id="hint">Security code</span><input type="text" id="b" aria-labelledby="hint" />
        <input type="text" id="c" placeholder="MM / YY" />
        <input type="text" id="d" title="Name on card" />
      `;

      expect(classifyPaymentCardLabel(document.getElementById('a'))).toBe('number');
      expect(classifyPaymentCardLabel(document.getElementById('b'))).toBe('securityCode');
      expect(classifyPaymentCardLabel(document.getElementById('c'))).toBe('expiration');
      expect(classifyPaymentCardLabel(document.getElementById('d'))).toBe('holder');
    });

    it('ignores the name and the id (identifiers are the selectors\' job)', () => {
      document.body.innerHTML = '<input type="text" id="cardNumber" name="card number" />';

      expect(classifyPaymentCardLabel(document.getElementById('cardNumber'))).toBeNull();
    });

    it.each([
      'Gift card number',
      'Geschenkkarte Kartennummer',
      'Número de tarjeta regalo',
      'Membership card number',
      'Enter the security code we sent by SMS',
      'Security code sent to your phone',
      'Cardholder birthdate (YYMMDD) or Corporate registration number (10 digits)',
      '카드 소유자 생년월일(예: 870130) 또는 법인 등록 번호(10자리)',
      'CPF do titular do cartão',
      '礼品卡号码'
    ])('rejects "%s" (denied wording)', label => {
      expect(classifyLabel(label)).toBeNull();
    });

    it.each([
      'Phone number', 'Verification code', 'Your experience', 'Date of birth', 'Account type', 'Card', 'Number', 'Month', 'Year'
    ])('does not classify the generic label "%s"', label => {
      expect(classifyLabel(label)).toBeNull();
    });

    it('rejects a label naming two card fields at once', () => {
      expect(classifyLabel('Card number, expiry date and CVC')).toBeNull();
    });
  });

  describe('getPaymentCardElementsByLabel', () => {
    it('finds a labelled field inside a form that holds another labelled card field', () => {
      document.body.innerHTML = `
        <form>
          <label for="n">Card number</label><input type="text" id="n" name="field_1" />
          <label for="e">Expiry date</label><input type="text" id="e" name="field_2" />
        </form>
      `;

      expect(getPaymentCardElementsByLabel('number').map(element => element.id)).toEqual(['n']);
      expect(getPaymentCardElementsByLabel('expiration').map(element => element.id)).toEqual(['e']);
    });

    it('finds a labelled field inside a payment container', () => {
      document.body.innerHTML = '<div class="checkout-payment"><label for="n">Card number</label><input type="text" id="n" /></div>';

      expect(getPaymentCardElementsByLabel('number')).toHaveLength(1);
    });

    it('finds a labelled field in a form that has an autocomplete card field', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" autocomplete="cc-number" />
          <label for="c">Security code</label><input type="text" id="c" name="x" />
        </form>
      `;

      expect(getPaymentCardElementsByLabel('securityCode')).toHaveLength(1);
    });

    it('ignores a lone labelled field outside of any payment context (e.g. a 2FA "Security code" page)', () => {
      document.body.innerHTML = '<form><label for="c">Security code</label><input type="text" id="c" /></form>';

      expect(getPaymentCardElementsByLabel('securityCode')).toEqual([]);
    });

    it('ignores labelled fields inside a gift card section', () => {
      document.body.innerHTML = `
        <form class="checkout-payment">
          <div class="adyen-checkout__giftcard">
            <label for="g">Card number</label><input type="text" id="g" />
          </div>
          <label for="n">Card number</label><input type="text" id="n" />
        </form>
      `;

      expect(getPaymentCardElementsByLabel('number').map(element => element.id)).toEqual(['n']);
    });

    it('skips invisible, disabled and readonly fields', () => {
      document.body.innerHTML = `
        <form class="payment">
          <label for="a">Card number</label><input type="text" id="a" data-invisible="true" />
          <label for="b">Card number</label><input type="text" id="b" disabled />
          <label for="c">Card number</label><input type="text" id="c" readonly />
        </form>
      `;

      expect(getPaymentCardElementsByLabel('number')).toEqual([]);
    });

    it('considers selects only for the expiration date and the issuer', () => {
      document.body.innerHTML = `
        <form class="payment">
          <label for="t">Card type</label><select id="t"><option>Visa</option></select>
          <label for="m">Expiry month</label><select id="m"><option>01</option></select>
          <label for="n">Card number</label><select id="n"><option>1</option></select>
        </form>
      `;

      expect(getPaymentCardElementsByLabel('issuer').map(element => element.id)).toEqual(['t']);
      expect(getPaymentCardElementsByLabel('expiration').map(element => element.id)).toEqual(['m']);
      expect(getPaymentCardElementsByLabel('number')).toEqual([]);
    });

    it('searches the given shadow roots', () => {
      const host = document.createElement('div');
      host.className = 'payment';
      document.body.appendChild(host);
      const shadowRoot = host.attachShadow({ mode: 'open' });
      shadowRoot.innerHTML = '<label for="n">Card number</label><input type="text" id="n" /><label for="e">Expiry date</label><input type="text" id="e" />';

      expect(getPaymentCardElementsByLabel('number', [shadowRoot])).toHaveLength(1);
    });
  });
});
