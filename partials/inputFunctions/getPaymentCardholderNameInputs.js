// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardholderNameSelectors, paymentCardDeniedKeywords } from '@/constants';
import isVisible from '../functions/isVisible';
import getShadowRoots from '../../entrypoints/content/functions/autofillFunctions/getShadowRoots';
import uniqueElementOnly from '@/partials/functions/uniqueElementOnly';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type'
];

const givenNameAutocompleteValues = ['cc-given-name', 'given-name'];
const familyNameAutocompleteValues = ['cc-family-name', 'family-name'];
const fullNameAutocompleteValues = ['cc-name'];

const cardholderLabelKeywords = [
  'name on card',
  'cardholder name',
  'cardholder',
  'card holder',
  'card name',
  'full name on card',
  'imię na karcie',
  'imię i nazwisko na karcie',
  'nazwa na karcie',
  'posiadacz karty',
  'nombre en la tarjeta',
  'nombre en tarjeta',
  'titular de la tarjeta',
  'nom sur la carte',
  'titulaire de la carte',
  'name auf der karte',
  'karteninhaber',
  'nome sulla carta',
  'titolare della carta',
  'naam op kaart',
  'kaarthouder',
  'カード名義',
  'カード所有者',
  '卡片姓名',
  '持卡人',
  'nome no cartão',
  'titular do cartão'
];

/**
* Filters out inputs that have autocomplete attributes indicating non-cardholder-name fields.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterConflictingAutocomplete = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();

  if (!autocomplete) {
    return true;
  }

  return !conflictingAutocompleteValues.includes(autocomplete);
};

/**
* Filters out inputs that contain denied keywords in their name or id.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input should be kept, false otherwise.
*/
const filterDeniedKeywords = input => {
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();
  const hasDeniedWord = paymentCardDeniedKeywords.some(word => name.includes(word) || id.includes(word));

  return !hasDeniedWord;
};

/**
* Determines the type of name field based on input attributes.
* @param {HTMLInputElement} input - The input element to check.
* @return {string} The type: 'full', 'given', or 'family'.
*/
const getNameFieldType = input => {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase().trim();
  const name = (input.name || '').toLowerCase();
  const id = (input.id || '').toLowerCase();

  if (givenNameAutocompleteValues.includes(autocomplete)) {
    return 'given';
  }

  if (familyNameAutocompleteValues.includes(autocomplete)) {
    return 'family';
  }

  if (fullNameAutocompleteValues.includes(autocomplete)) {
    return 'full';
  }

  if (name.includes('firstname') || name.includes('first_name') || name.includes('first-name') ||
      name.includes('givenname') || name.includes('given_name') || name.includes('given-name') ||
      id.includes('firstname') || id.includes('first_name') || id.includes('first-name') ||
      id.includes('givenname') || id.includes('given_name') || id.includes('given-name')) {
    return 'given';
  }

  if (name.includes('lastname') || name.includes('last_name') || name.includes('last-name') ||
      name.includes('familyname') || name.includes('family_name') || name.includes('family-name') ||
      name.includes('surname') ||
      id.includes('lastname') || id.includes('last_name') || id.includes('last-name') ||
      id.includes('familyname') || id.includes('family_name') || id.includes('family-name') ||
      id.includes('surname')) {
    return 'family';
  }

  return 'full';
};

/**
* Gets the text content of the label associated with an input element.
* @param {HTMLInputElement} input - The input element.
* @return {string} The label text in lowercase, or empty string if not found.
*/
const getAssociatedLabelText = input => {
  if (input.id) {
    const labelByFor = document.querySelector(`label[for="${input.id}"]`);

    if (labelByFor) {
      return labelByFor.textContent.toLowerCase().trim();
    }
  }

  const parentLabel = input.closest('label');

  if (parentLabel) {
    return parentLabel.textContent.toLowerCase().trim();
  }

  const previousSibling = input.previousElementSibling;

  if (previousSibling && previousSibling.tagName === 'LABEL') {
    return previousSibling.textContent.toLowerCase().trim();
  }

  const parent = input.parentElement;

  if (parent) {
    const siblingLabel = parent.previousElementSibling;

    if (siblingLabel && (siblingLabel.tagName === 'LABEL' || siblingLabel.classList.contains('form-label'))) {
      return siblingLabel.textContent.toLowerCase().trim();
    }
  }

  const grandparent = input.parentElement?.parentElement;

  if (grandparent) {
    const grandSiblingLabel = grandparent.previousElementSibling;

    if (grandSiblingLabel && (grandSiblingLabel.tagName === 'LABEL' || grandSiblingLabel.classList.contains('form-label'))) {
      return grandSiblingLabel.textContent.toLowerCase().trim();
    }
  }

  return '';
};

const minKeywordMatchLength = 8;

/**
* Checks if text matches any cardholder keyword bidirectionally.
* @param {string} text - The text to check.
* @return {boolean} True if text matches any keyword.
*/
const matchesCardholderKeyword = text => {
  if (!text) {
    return false;
  }

  return cardholderLabelKeywords.some(keyword => {
    if (text.includes(keyword)) {
      return true;
    }

    if (text.length >= minKeywordMatchLength && keyword.includes(text)) {
      return true;
    }

    return false;
  });
};

/**
* Gets inputs that have associated labels matching cardholder name keywords.
* @param {Document|ShadowRoot} rootNode - The root node to search in.
* @return {HTMLInputElement[]} The array of cardholder name input elements found by label.
*/
const getInputsByLabelFromRoot = rootNode => {
  const textInputs = Array.from(rootNode.querySelectorAll('input[type="text"], input:not([type])'));
  const matchedInputs = [];

  textInputs.forEach(input => {
    const labelText = getAssociatedLabelText(input);
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();

    const textsToCheck = [labelText, ariaLabel, placeholder].filter(Boolean);
    const hasMatch = textsToCheck.some(text => matchesCardholderKeyword(text));

    if (hasMatch) {
      matchedInputs.push(input);
    }
  });

  return matchedInputs;
};

/**
* Gets billing name inputs (given-name, family-name) from a root node when in payment context.
* @param {Document|ShadowRoot} rootNode - The root node to search in.
* @return {HTMLInputElement[]} The array of billing name input elements found.
*/
const getBillingNameInputsFromRoot = rootNode => {
  const billingNameSelectors = [
    'input[autocomplete="given-name"]',
    'input[autocomplete="family-name"]'
  ];

  const billingInputs = Array.from(rootNode.querySelectorAll(billingNameSelectors.join(', ')));

  const firstNameSelectors = [
    'input[name*="firstName"]',
    'input[name*="first_name"]',
    'input[name*="first-name"]',
    'input[name*="firstname"]',
    'input#firstName',
    'input#first_name',
    'input#first-name',
    'input#firstname'
  ];

  const lastNameSelectors = [
    'input[name*="lastName"]',
    'input[name*="last_name"]',
    'input[name*="last-name"]',
    'input[name*="lastname"]',
    'input[name*="surname"]',
    'input#lastName',
    'input#last_name',
    'input#last-name',
    'input#lastname',
    'input#surname'
  ];

  const firstNameInputs = Array.from(rootNode.querySelectorAll(firstNameSelectors.join(', ')));
  const lastNameInputs = Array.from(rootNode.querySelectorAll(lastNameSelectors.join(', ')));

  return [...billingInputs, ...firstNameInputs, ...lastNameInputs];
};

/**
* Checks if a billing name input is within a payment form context.
* @param {HTMLInputElement} input - The input element to check.
* @return {boolean} True if the input is in a payment context.
*/
const isInPaymentContext = input => {
  const form = input.closest('form');

  if (form) {
    const formHtml = form.outerHTML.toLowerCase();
    const paymentKeywords = ['payment', 'credit', 'card', 'checkout', 'billing', 'cc-number', 'cc-exp', 'cc-csc'];

    return paymentKeywords.some(keyword => formHtml.includes(keyword));
  }

  const parent = input.closest('[data-testid*="payment"], [data-testid*="credit"], [data-testid*="card"], [class*="payment"], [class*="credit"], [class*="checkout"], [class*="billing"]');

  if (parent) {
    return true;
  }

  const rootNode = input.getRootNode();
  const hasCardNumberInput = rootNode.querySelector('input[autocomplete="cc-number"]') !== null;

  if (hasCardNumberInput) {
    return true;
  }

  const hasExpirationInput = rootNode.querySelector('input[autocomplete="cc-exp"], input[autocomplete="cc-exp-month"], input[autocomplete="cc-exp-year"]') !== null;

  if (hasExpirationInput) {
    return true;
  }

  const hasCvvInput = rootNode.querySelector('input[autocomplete="cc-csc"]') !== null;

  if (hasCvvInput) {
    return true;
  }

  return false;
};

/**
* Gets the payment cardholder name input elements from the document, including those inside shadow DOMs.
* Returns structured objects with element and type information.
* @return {Array<{element: HTMLInputElement, type: string}>} The array of cardholder name inputs with type.
*/
const getPaymentCardholderNameInputs = () => {
  const cardholderNameSelector = paymentCardholderNameSelectors().join(', ');
  const regularCardholderInputs = Array.from(document.querySelectorAll(cardholderNameSelector));

  const regularBillingInputs = getBillingNameInputsFromRoot(document)
    .filter(input => isInPaymentContext(input));

  const regularLabelInputs = getInputsByLabelFromRoot(document)
    .filter(input => isInPaymentContext(input));

  const shadowRoots = getShadowRoots();

  const shadowCardholderInputs = shadowRoots.flatMap(
    root => Array.from(root.querySelectorAll(cardholderNameSelector))
  );

  const shadowBillingInputs = shadowRoots.flatMap(
    root => getBillingNameInputsFromRoot(root).filter(input => isInPaymentContext(input))
  );

  const shadowLabelInputs = shadowRoots.flatMap(
    root => getInputsByLabelFromRoot(root).filter(input => isInPaymentContext(input))
  );

  const allInputs = [
    ...regularCardholderInputs,
    ...regularBillingInputs,
    ...regularLabelInputs,
    ...shadowCardholderInputs,
    ...shadowBillingInputs,
    ...shadowLabelInputs
  ];

  const afterVisible = allInputs.filter(input => isVisible(input));
  const afterUnique = afterVisible.filter(uniqueElementOnly);
  const afterConflicting = afterUnique.filter(filterConflictingAutocomplete);
  const filteredInputs = afterConflicting.filter(filterDeniedKeywords);

  const result = filteredInputs.map(element => ({
    element,
    type: getNameFieldType(element)
  }));

  return result;
};

export default getPaymentCardholderNameInputs;
