// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

/** 
* Function handling clicks on links with target="_blank" in Safari.
* @param {MouseEvent} e - The mouse event object.
* @return {Promise<void>} A promise that resolves when the link is opened.
*/
const safariBlankLinks = e => {
  let el = e.target;

  if (!el) {
    return;
  }

  const tagName = el.tagName.toLowerCase();

  if (tagName !== 'a') {
    el = el.closest('a');

    if (!el) {
      return;
    }
  }

  const href = el.getAttribute('href');

  if (!href) {
    return;
  }

  const isBlank = el.getAttribute('target') === '_blank';

  if (!isBlank) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  return browser.tabs.create({ url: href });
};

export default safariBlankLinks;
