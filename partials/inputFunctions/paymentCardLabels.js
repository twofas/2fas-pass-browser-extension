// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import {
  ignoredTypes,
  paymentCardNumberWords,
  paymentCardholderNameWords,
  paymentCardExpirationDateWords,
  paymentCardSecurityCodeWords,
  paymentCardIssuerWords,
  paymentCardLabelDeniedWords,
  paymentCardParentContextDeniedKeywords
} from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';
import { createParentContextChecker } from '../functions/hasParentContextDeniedKeyword';
import { getAssociatedLabelText, resolveLabelledByText } from './shared';

// Words up to this length (cvv, cid, mm/yy, …) collide with longer words as raw substrings, so they must
// stand alone. Longer phrases must only start a word, which keeps inflected forms ("Karteninhabers").
const SHORT_WORD_MAX_LENGTH = 6;
const UNSPACED_SCRIPT_REGEX = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const NOT_PRECEDED_BY_WORD = '(?<![\\p{L}\\p{N}])';
const NOT_FOLLOWED_BY_WORD = '(?![\\p{L}\\p{N}])';

const paymentContainerSelector = '[data-testid*="payment" i], [data-testid*="credit" i], [data-testid*="card" i], ' +
  '[class*="payment" i], [class*="credit" i], [class*="checkout" i], [class*="billing" i]';

const cardFieldSelector = 'input[autocomplete="cc-number"], input[autocomplete="cc-exp"], ' +
  'input[autocomplete="cc-exp-month"], input[autocomplete="cc-exp-year"], input[autocomplete="cc-csc"]';

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasDeniedParentContext = createParentContextChecker(paymentCardParentContextDeniedKeywords, 6);

/**
* Normalizes a label text for matching: lowercase, every whitespace run (also non-breaking) collapsed to
* one space, typographic apostrophes unified to "'".
* @param {string|null|undefined} text - The raw text.
* @return {string} The normalized text.
*/
const normalizeLabelText = text => String(text || '')
  .toLowerCase()
  .replace(/[‘’ʼ`´]/g, '\'')
  .replace(/\s+/g, ' ')
  .trim();

/**
* Compiles a list of label words into a matcher. Words of up to 6 characters must stand alone, longer
* words must start a word (an inflected ending is allowed), CJK and Hangul words match anywhere since
* those scripts do not separate words with spaces.
* @param {string[]} words - The label words.
* @return {(text: string) => boolean} Returns true when the text contains one of the words.
*/
const createLabelMatcher = words => {
  const unspaced = [];
  const startBounded = [];
  const fullyBounded = [];

  words.forEach(word => {
    const normalized = normalizeLabelText(word);

    if (!normalized) {
      return;
    }

    if (UNSPACED_SCRIPT_REGEX.test(normalized)) {
      unspaced.push(normalized);
    } else if (normalized.length <= SHORT_WORD_MAX_LENGTH) {
      fullyBounded.push(escapeRegex(normalized));
    } else {
      startBounded.push(escapeRegex(normalized));
    }
  });

  const alternatives = [];

  if (startBounded.length > 0) {
    alternatives.push(`(?:${startBounded.join('|')})`);
  }

  if (fullyBounded.length > 0) {
    alternatives.push(`(?:${fullyBounded.join('|')})${NOT_FOLLOWED_BY_WORD}`);
  }

  const regex = alternatives.length > 0 ? new RegExp(`${NOT_PRECEDED_BY_WORD}(?:${alternatives.join('|')})`, 'u') : null;

  return text => {
    const normalized = normalizeLabelText(text);

    if (!normalized) {
      return false;
    }

    if (regex && regex.test(normalized)) {
      return true;
    }

    return unspaced.some(word => normalized.includes(word));
  };
};

const fieldMatchers = [
  ['number', createLabelMatcher(paymentCardNumberWords)],
  ['holder', createLabelMatcher(paymentCardholderNameWords)],
  ['expiration', createLabelMatcher(paymentCardExpirationDateWords)],
  ['securityCode', createLabelMatcher(paymentCardSecurityCodeWords)],
  ['issuer', createLabelMatcher(paymentCardIssuerWords)]
];

const matchesDeniedWords = createLabelMatcher(paymentCardLabelDeniedWords);

/**
* Collects the human-readable texts that name a field: its associated label, aria-label, aria-labelledby
* text, placeholder and title. The name and id are left out: identifiers are matched by the selectors.
* @param {HTMLElement} element - The input or select element.
* @return {string[]} The normalized, non-empty texts.
*/
const getElementLabelTexts = element => {
  const labelledBy = element.getAttribute('aria-labelledby');

  return [
    getAssociatedLabelText(element),
    element.getAttribute('aria-label'),
    labelledBy ? resolveLabelledByText(element, labelledBy) : '',
    element.getAttribute('placeholder'),
    element.getAttribute('title')
  ]
    .map(normalizeLabelText)
    .filter(Boolean);
};

/**
* Checks whether any of the texts names something that only looks like a card field (gift card, one-time
* code, phone number, birth date, …).
* @param {string[]} texts - The normalized label texts.
* @return {boolean} True if a denied phrase is present.
*/
const hasDeniedLabelText = texts => texts.some(matchesDeniedWords);

/**
* Resolves which payment card field the element's label names.
* @param {HTMLElement} element - The input or select element.
* @return {'number'|'holder'|'expiration'|'securityCode'|'issuer'|null} The field, or null when the label
* names no card field, names more than one, or contains a denied phrase.
*/
const classifyPaymentCardLabel = element => {
  const texts = getElementLabelTexts(element);

  if (texts.length === 0 || hasDeniedLabelText(texts)) {
    return null;
  }

  const fields = fieldMatchers
    .filter(([, matches]) => texts.some(matches))
    .map(([field]) => field);

  return fields.length === 1 ? fields[0] : null;
};

/**
* Checks if a field is within a payment form context using structural signals (real card fields nearby,
* or a payment/credit/checkout/billing container) rather than a raw text scan, so unrelated copy mentioning
* "card"/"billing" cannot create a false context. The card-field lookup is scoped to the field's own
* form/payment container — not the whole document — so an unrelated field does not inherit payment context
* from a card field that lives in a separate form elsewhere on the page.
* @param {HTMLElement} input - The input or select element to check.
* @return {boolean} True if the field is in a payment context.
*/
const isInPaymentContext = input => {
  const scope = input.closest('form') || input.closest(paymentContainerSelector);

  if (scope && scope.querySelector(cardFieldSelector) !== null) {
    return true;
  }

  if (input.closest(paymentContainerSelector)) {
    return true;
  }

  const form = input.closest('form');

  if (form && form.querySelector(paymentContainerSelector)) {
    return true;
  }

  return false;
};

/**
* Checks whether the field's form (or its document/shadow root when it has no form) holds another
* visible field whose label names a DIFFERENT card field, e.g. "Card number" next to "Expiry date".
* @param {HTMLElement} element - The field found by its label.
* @param {string} field - The card field the element was classified as.
* @param {Map<HTMLElement, string>} labelledElements - Every element of the root classified by its label.
* @param {(element: HTMLElement) => boolean} isElementVisible - Memoized visibility check.
* @return {boolean} True if a second labelled card field shares the scope.
*/
const hasOtherLabelledCardField = (element, field, labelledElements, isElementVisible) => {
  const scope = element.closest('form') || element.getRootNode();

  for (const [other, otherField] of labelledElements) {
    if (other !== element && otherField !== field && scope.contains(other) && isElementVisible(other)) {
      return true;
    }
  }

  return false;
};

const inputCandidateSelector = () => `input${ignoredTypes({ allowUsernameTypes: true })}`;
const selectCandidateSelector = 'select:not([disabled])';

const fieldCandidateSelectors = {
  number: () => inputCandidateSelector(),
  securityCode: () => inputCandidateSelector(),
  expiration: () => `${inputCandidateSelector()}, ${selectCandidateSelector}`,
  issuer: () => selectCandidateSelector
};

/**
* Finds the payment card fields of one kind by the words of their labels, as the username field is found
* by userNameWords. A field counts only when it is visible, its label names exactly that card field and no
* denied phrase, no ancestor marks a gift card/voucher/loyalty section, and it sits in a payment context:
* a payment container, a form with an autocomplete card field, or next to a field labelled as another card
* field.
* @param {'number'|'securityCode'|'expiration'|'issuer'} field - The card field to look for.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {HTMLElement[]} The matching, visible, unique elements.
*/
const getPaymentCardElementsByLabel = (field, shadowRoots = null) => {
  const getFieldSelector = fieldCandidateSelectors[field];

  if (!getFieldSelector) {
    return [];
  }

  const fieldSelector = getFieldSelector();
  const allCandidatesSelector = `${inputCandidateSelector()}, ${selectCandidateSelector}`;
  const resolvedShadowRoots = Array.isArray(shadowRoots) ? shadowRoots : getShadowRoots();
  const visibility = new Map();
  const isElementVisible = element => {
    if (!visibility.has(element)) {
      visibility.set(element, isVisible(element));
    }

    return visibility.get(element);
  };
  const found = [];

  [document, ...resolvedShadowRoots].forEach(root => {
    const labelledElements = new Map();

    root.querySelectorAll(allCandidatesSelector).forEach(element => {
      const elementField = classifyPaymentCardLabel(element);

      if (elementField) {
        labelledElements.set(element, elementField);
      }
    });

    labelledElements.forEach((elementField, element) => {
      if (elementField !== field || !element.matches(fieldSelector) || !isElementVisible(element)) {
        return;
      }

      if (hasDeniedParentContext(element)) {
        return;
      }

      if (isInPaymentContext(element) || hasOtherLabelledCardField(element, elementField, labelledElements, isElementVisible)) {
        found.push(element);
      }
    });
  });

  return found.filter(uniqueElementOnly);
};

export {
  normalizeLabelText,
  createLabelMatcher,
  getElementLabelTexts,
  hasDeniedLabelText,
  classifyPaymentCardLabel,
  isInPaymentContext,
  hasDeniedParentContext,
  getPaymentCardElementsByLabel
};
