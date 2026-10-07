// @vitest-environment node
// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

// Rule: the payment card label word lists always cover EVERY language of the extension's i18n
// (public/_locales). For every locale, the extension's own translated card field labels and a sample label of
// each list must be recognised. Adding a locale without card phrases (or without samples here) fails this test.

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '@/tests/importGraph/findImportLeaks';
import {
  paymentCardNumberWords,
  paymentCardholderNameWords,
  paymentCardExpirationDateWords,
  paymentCardExpirationMonthWords,
  paymentCardExpirationYearWords,
  paymentCardSecurityCodeWords,
  paymentCardIssuerWords,
  paymentCardLabelDeniedWords
} from '@/constants';
import { createLabelMatcher } from '@/partials/inputFunctions/paymentCardLabels';

const matchers = {
  number: createLabelMatcher(paymentCardNumberWords),
  holder: createLabelMatcher(paymentCardholderNameWords),
  expiration: createLabelMatcher(paymentCardExpirationDateWords),
  month: createLabelMatcher(paymentCardExpirationMonthWords),
  year: createLabelMatcher(paymentCardExpirationYearWords),
  securityCode: createLabelMatcher(paymentCardSecurityCodeWords),
  issuer: createLabelMatcher(paymentCardIssuerWords),
  denied: createLabelMatcher(paymentCardLabelDeniedWords)
};

const SAMPLE_LABELS = Object.freeze({
  en: {
    number: 'Card number',
    holder: 'Name on card',
    expiration: 'Expiration date',
    month: 'Expiry month',
    year: 'Expiry year',
    securityCode: 'Security code',
    issuer: 'Card type',
    denied: 'Gift card number'
  },
  pl: {
    number: 'Numer karty',
    holder: 'Imię i nazwisko na karcie',
    expiration: 'Termin ważności',
    month: 'Miesiąc',
    year: 'Rok',
    securityCode: 'Kod zabezpieczający',
    issuer: 'Rodzaj karty',
    denied: 'Numer karty podarunkowej'
  },
  de: {
    number: 'Kreditkartennummer',
    holder: 'Name des Karteninhabers',
    expiration: 'Gültig bis',
    month: 'Monat',
    year: 'Jahr',
    securityCode: 'Kartenprüfnummer',
    issuer: 'Kartenart',
    denied: 'Gutscheincode'
  }
});

const OWN_LABEL_KEYS = Object.freeze({
  number: 'details_card_number',
  holder: 'placeholder_payment_card_cardholder',
  expiration: 'details_expiration_date',
  month: 'primereact_choose_month',
  year: 'primereact_choose_year',
  securityCode: 'details_security_code'
});

const LOCALE_SOURCE_DIRS = ['public', 'entrypoints', 'models', 'partials', 'constants'];

const i18nLanguages = fs.readdirSync(path.join(ROOT, 'public/_locales'), { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const findLocaleFiles = (dir, lang) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent => {
  const fullPath = path.join(dir, dirent.name);

  if (!dirent.isDirectory()) {
    return fullPath.endsWith(path.join('_locales', lang, 'messages.json')) ? [fullPath] : [];
  }

  return dirent.name === 'node_modules' ? [] : findLocaleFiles(fullPath, lang);
});

const loadMessages = lang => Object.assign({}, ...LOCALE_SOURCE_DIRS
  .flatMap(dir => findLocaleFiles(path.join(ROOT, dir), lang))
  .map(file => JSON.parse(fs.readFileSync(file, 'utf8'))));

describe('payment card label words cover every i18n language', () => {
  it('have sample labels for every i18n language', () => {
    expect(i18nLanguages.filter(lang => !SAMPLE_LABELS[lang])).toEqual([]);
  });

  describe.each(i18nLanguages)('%s', lang => {
    const messages = loadMessages(lang);

    it.each(Object.keys(matchers))('recognises the sample %s label', field => {
      const label = SAMPLE_LABELS[lang]?.[field];

      expect(label).toBeTruthy();
      expect(matchers[field](label)).toBe(true);
    });

    it.each(Object.entries(OWN_LABEL_KEYS))('recognises the extension\'s own %s label (%s)', (field, key) => {
      const label = messages[key]?.message;

      expect(label).toBeTruthy();
      expect(matchers[field](label)).toBe(true);
    });
  });
});
