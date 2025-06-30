// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Creates a text element with the specified tag name, text, and optional class name.
* @param {string} tagName - The tag name of the element to create.
* @param {string} text - The text content of the element.
* @param {string} [className=null] - The class name of the element.
* @return {HTMLElement} The created text element.
*/

const createTextElement = (tagName, text, className = null) => {
  const el = document.createElement(tagName);

  if (className) {
    el.className = className;
  }

  const elText = document.createTextNode(text);
  el.appendChild(elText);

  return el;
};

export default createTextElement;
