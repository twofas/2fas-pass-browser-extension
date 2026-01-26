// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { selectors as S } from '@/constants';
import { createSVGElement } from '@/partials/DOMElements';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';

/**
 * Updates the logo SVG element based on the new theme.
 * @param {HTMLElement} logoContainer - The container element holding the logo SVG.
 * @param {string} theme - The new theme value ('light', 'dark', or 'unset').
 * @return {void}
 */
const updateLogoSvg = (logoContainer, theme) => {
  if (!logoContainer) {
    return;
  }

  const existingSvg = logoContainer.querySelector('svg');

  if (existingSvg) {
    logoContainer.removeChild(existingSvg);
  }

  let newSvg;

  if (theme === 'dark') {
    newSvg = createSVGElement(logoSrcDark);
  } else if (theme === 'light') {
    newSvg = createSVGElement(logoSrc);
  } else {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    newSvg = createSVGElement(isDarkMode ? logoSrcDark : logoSrc);
  }

  logoContainer.appendChild(newSvg);
};

/**
 * Refreshes the theme on all visible notification overlays.
 * @param {string} theme - The new theme value ('light', 'dark', or 'unset').
 * @param {HTMLElement} container - The shadow DOM container element.
 * @return {void}
 */
const refreshTheme = (theme, container) => {
  if (!container) {
    return;
  }

  const validTheme = (theme === 'light' || theme === 'dark') ? theme : 'unset';

  // Refresh cross-domain dialog if open
  const crossDomainDialog = container.querySelector('.twofas-pass-cross-domain-dialog');

  if (crossDomainDialog) {
    crossDomainDialog.classList.remove('light', 'dark', 'unset');
    crossDomainDialog.classList.add(validTheme);

    const logoContainer = crossDomainDialog.querySelector('.twofas-pass-cross-domain-dialog-top-logo');
    updateLogoSvg(logoContainer, validTheme);
  }

  // Refresh notification items
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

    item.classList.remove('light', 'dark', 'unset');
    item.classList.add(validTheme);

    if (item.classList.contains('twofas-pass-matching-logins')) {
      const logoContainer = item.querySelector('.twofas-pass-notification-matching-logins-top-logo');
      updateLogoSvg(logoContainer, validTheme);
    }

    if (item.classList.contains('twofas-pass-save-prompt')) {
      const logoContainer = item.querySelector('.twofas-pass-notification-save-prompt-top-logo');
      updateLogoSvg(logoContainer, validTheme);
    }
  });
};

export default refreshTheme;
