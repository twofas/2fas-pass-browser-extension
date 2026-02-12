// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { selectors as S } from '@/constants';

/**
 * Refreshes the language on all visible notification overlays.
 * @param {HTMLElement} container - The shadow DOM container element.
 * @return {void}
 */
const refreshLang = container => {
  if (!container) {
    return;
  }

  refreshNotificationItems(container);
  refreshCrossDomainDialog(container);
};

/**
 * Refreshes text in all notification items.
 * @param {HTMLElement} container - The shadow DOM container element.
 * @return {void}
 */
const refreshNotificationItems = container => {
  const notificationContainer = container.querySelector(S.notification.container);

  if (!notificationContainer) {
    return;
  }

  const notificationItems = notificationContainer.querySelectorAll(S.notification.notification);

  if (!notificationItems || notificationItems.length === 0) {
    return;
  }

  notificationItems.forEach(item => {
    if (item.classList.contains('twofas-pass-old')) {
      return;
    }

    const elementsWithKeys = item.querySelectorAll('[data-i18n-key]');

    elementsWithKeys.forEach(el => {
      const key = el.getAttribute('data-i18n-key');

      if (key) {
        el.textContent = getMessage(key);
      }
    });
  });
};

/**
 * Refreshes text in the cross-domain dialog if it exists.
 * @param {HTMLElement} container - The shadow DOM container element.
 * @return {void}
 */
const refreshCrossDomainDialog = container => {
  const dialog = container.querySelector(S.crossDomainDialog.el);

  if (!dialog) {
    return;
  }

  const elementsWithKeys = dialog.querySelectorAll('[data-i18n-key]');

  elementsWithKeys.forEach(el => {
    const key = el.getAttribute('data-i18n-key');

    if (key) {
      el.textContent = getMessage(key);
    }
  });
};

export default refreshLang;
