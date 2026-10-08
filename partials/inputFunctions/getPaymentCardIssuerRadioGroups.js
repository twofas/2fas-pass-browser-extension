// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import isVisible from '../functions/isVisible';
import { resolveLabelledByText } from './shared';
import { getPaymentCardIssuerKeyOfText } from './paymentCardIssuerMatch';

const IMAGE_TEXT_SELECTOR = 'img[alt], [aria-label], [title]';

/**
* Gets the labels of a radio: the labels associated by the browser (label[for] and a wrapping label).
* @param {HTMLInputElement} radio - The radio.
* @return {HTMLLabelElement[]} The labels.
*/
const getRadioLabels = radio => (radio.labels ? Array.from(radio.labels) : []);

/**
* Collects the texts that can name the brand of a radio: its value, aria-label, title, aria-labelledby text,
* and the text of its labels with the alt/aria-label/title of their images (brand logos). Nearby labels of other
* radios are deliberately left out.
* @param {HTMLInputElement} radio - The radio.
* @return {string[]} The texts.
*/
const getRadioBrandTexts = radio => {
  const labelledBy = radio.getAttribute('aria-labelledby');
  const labels = getRadioLabels(radio);

  return [
    radio.value,
    radio.getAttribute('aria-label'),
    radio.getAttribute('title'),
    labelledBy ? resolveLabelledByText(radio, labelledBy) : '',
    ...labels.map(label => label.textContent),
    ...labels.flatMap(label => Array.from(label.querySelectorAll(IMAGE_TEXT_SELECTOR))
      .map(image => image.getAttribute('alt') || image.getAttribute('aria-label') || image.getAttribute('title')))
  ];
};

/**
* Resolves the single card brand a radio stands for.
* @param {HTMLInputElement} radio - The radio.
* @return {string|null} The brand key, or null when the radio names no brand or names several.
*/
const getRadioIssuerKey = radio => {
  const keys = new Set(getRadioBrandTexts(radio).map(getPaymentCardIssuerKeyOfText).filter(Boolean));

  return keys.size === 1 ? [...keys][0] : null;
};

/**
* Checks whether the user could pick a radio: it is enabled and either the radio or one of its labels is visible
* (brand radios are often hidden behind a clickable logo).
* @param {HTMLInputElement} radio - The radio.
* @return {boolean} True if the radio can be picked.
*/
const isIssuerRadioUsable = radio => !radio.disabled && (isVisible(radio) || getRadioLabels(radio).some(label => isVisible(label)));

/**
* Gets the groups of card brand radios from the document, including those inside shadow DOMs. Radios form a
* group by name within their form (or document/shadow root). A group counts only when every radio stands for
* exactly one card brand, at least two brands are offered and the user can pick one of them, so a choice
* between a card and PayPal or a bank account is never treated as a brand.
* @param {ShadowRoot[]} shadowRoots - The shadow roots to search besides the document.
* @return {Array<{element: HTMLInputElement, radios: HTMLInputElement[], issuerKeys: string[], isSelect: boolean, isRadioGroup: boolean}>} The brand radio groups.
*/
const getPaymentCardIssuerRadioGroups = shadowRoots => {
  const groups = new Map();

  [document, ...shadowRoots].forEach(root => {
    root.querySelectorAll('input[type="radio"][name]').forEach(radio => {
      const owner = radio.form || radio.getRootNode();
      let ownerGroups = groups.get(owner);

      if (!ownerGroups) {
        ownerGroups = new Map();
        groups.set(owner, ownerGroups);
      }

      const radios = ownerGroups.get(radio.name) || [];
      radios.push(radio);
      ownerGroups.set(radio.name, radios);
    });
  });

  const result = [];

  groups.forEach(ownerGroups => {
    ownerGroups.forEach(radios => {
      const issuerKeys = radios.map(getRadioIssuerKey);

      if (issuerKeys.some(key => key === null) || new Set(issuerKeys).size < 2 || !radios.some(isIssuerRadioUsable)) {
        return;
      }

      result.push({ element: radios[0], radios, issuerKeys, isSelect: false, isRadioGroup: true });
    });
  });

  return result;
};

export { isIssuerRadioUsable };
export default getPaymentCardIssuerRadioGroups;
