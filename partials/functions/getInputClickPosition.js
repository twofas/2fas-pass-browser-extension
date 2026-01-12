// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/**
* Calculates the cursor position in an input element based on click coordinates.
* Uses canvas text measurement to determine which character position was clicked.
* @param {HTMLInputElement} inputElement - The input element that was clicked.
* @param {number} clickX - The clientX coordinate of the click event.
* @return {number} The calculated cursor position (character index).
*/
const getInputClickPosition = (inputElement, clickX) => {
  const rect = inputElement.getBoundingClientRect();
  const style = window.getComputedStyle(inputElement);
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const relativeX = clickX - rect.left - paddingLeft;
  const textValue = inputElement.value;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  context.font = style.font;

  let clickPosition = textValue.length;

  for (let i = 0; i <= textValue.length; i++) {
    const textWidth = context.measureText(textValue.substring(0, i)).width;

    if (textWidth >= relativeX) {
      const prevWidth = i > 0 ? context.measureText(textValue.substring(0, i - 1)).width : 0;
      clickPosition = (relativeX - prevWidth < textWidth - relativeX) ? Math.max(0, i - 1) : i;
      break;
    }
  }

  return clickPosition;
};

export default getInputClickPosition;
