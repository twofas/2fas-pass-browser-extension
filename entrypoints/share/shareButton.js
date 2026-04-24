// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const BUTTON_ATTR = 'data-twofas-pass-share-btn';

export const createButton = (params, buttonText) => {
  const button = document.createElement('button');
  button.setAttribute(BUTTON_ATTR, 'true');
  button.setAttribute('type', 'button');
  button.textContent = buttonText;

  button.addEventListener('click', () => {
    browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.SHARE_LINK_IMPORT,
      target: REQUEST_TARGETS.BACKGROUND,
      id: params.id,
      type: params.type,
      nonce: params.nonce,
      key: params.key
    });
  });

  return button;
};

export const removeButton = () => {
  const existing = document.querySelector(`[${BUTTON_ATTR}]`);

  if (existing) {
    existing.remove();
  }
};

export const hasButton = container => !!container.querySelector(`[${BUTTON_ATTR}]`);
