// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { paymentCardSecurityCodeSelectors } from '@/constants';
import { filterDeniedKeywords, makeConflictingAutocompleteFilter, collectInputs } from './shared';

const conflictingAutocompleteValues = [
  'cc-number',
  'cc-name',
  'cc-given-name',
  'cc-additional-name',
  'cc-family-name',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-type'
];

const filterConflictingAutocomplete = makeConflictingAutocompleteFilter(conflictingAutocompleteValues);

/**
* Gets the payment card security code input elements from the document, including those inside shadow DOMs.
* @param {ShadowRoot[]|null} [shadowRoots] - Precomputed shadow roots to reuse for the current pass; the DOM is scanned only when omitted.
* @return {HTMLInputElement[]} The array of payment card security code input elements.
*/
const getPaymentCardSecurityCodeInputs = (shadowRoots = null) => {
  const securityCodeSelector = paymentCardSecurityCodeSelectors().join(', ');
  const visibleUniqueInputs = collectInputs(securityCodeSelector, shadowRoots);
  const afterConflicting = visibleUniqueInputs.filter(filterConflictingAutocomplete);
  const result = afterConflicting.filter(filterDeniedKeywords);

  return result;
};

export default getPaymentCardSecurityCodeInputs;
