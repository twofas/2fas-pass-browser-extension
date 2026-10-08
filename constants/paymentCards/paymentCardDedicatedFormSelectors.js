// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import paymentCardDedicatedFormTexts from './paymentCardDedicatedFormTexts.js';

/**
 * Function to get the selectors of containers that identify a payment card form (by id, class or form name).
 * @return {Array<string>} An array of payment card form selectors.
 */
const paymentCardDedicatedFormSelectors = () => {
  const selectors = [];

  paymentCardDedicatedFormTexts.forEach(text => {
    [text, text.toLowerCase(), text.toUpperCase(), text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()].forEach(variant => {
      selectors.push(`#${variant}`);
      selectors.push(`.${variant}`);
    });

    selectors.push(`form[name="${text}" i]`);
  });

  return [...new Set(selectors)];
};

export default paymentCardDedicatedFormSelectors;
