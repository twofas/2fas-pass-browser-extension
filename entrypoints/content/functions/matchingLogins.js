// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { HEX_REGEX, selectors as S } from '@/constants';
import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import { getDomain } from '@/partials/functions';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';
import closeSrc from '@/assets/popup-window/cancel.svg?raw';
import URIMatcher from '@/partials/URIMatcher';
import { parseDomain, ParseResultType } from 'parse-domain';

/**
* Function to close the notification.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @return {void}
*/
const closeNotification = (n, timers) => {
  if (timers.visible !== null) {
    clearTimeout(timers.visible);
    timers.visible = null;
  }

  if (timers.maxHeight1 !== null) {
    clearTimeout(timers.maxHeight1);
    timers.maxHeight1 = null;
  }

  if (timers.maxHeight2 !== null) {
    clearTimeout(timers.maxHeight2);
    timers.maxHeight2 = null;
  }

  if (timers.cleanup !== null) {
    clearTimeout(timers.cleanup);
    timers.cleanup = null;
  }

  if (n && n.item) {
    n.item.classList.add('twofas-pass-hidden');

    timers.cleanup = setTimeout(() => {
      if (n && n.item) {
        n.item.classList.remove('twofas-pass-hidden');
        n.item.classList.remove('twofas-pass-visible');
        n.item.classList.add('twofas-pass-old');
      }

      n = null;
      timers.cleanup = null;
    }, 300);
  }
};

/**
* Function to cancel the notification.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @param {Function} sendResponse - The function to send the response back.
* @return {void}
*/
const cancel = (n, timers, sendResponse) => {
  closeNotification(n, timers);
  return sendResponse({ status: 'cancel' });
};

/**
* Function to perform an action.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @param {Function} sendResponse - The function to send the response back.
* @param {string} vaultId - The vault ID of the item.
* @param {string} deviceId - The device ID of the item.
* @param {string} id - The ID of the item.
* @param {string} contentType - The content type of the item.
* @return {void}
*/
const action = (n, timers, sendResponse, vaultId, deviceId, id, contentType) => {
  closeNotification(n, timers);
  return sendResponse({ status: 'action', vaultId, deviceId, id, contentType });
};

/** 
* Function to generate a label for an item.
* @param {Object} item - The item object.
* @param {HTMLElement} itemIcon - The icon element for the item.
* @return {void}
*/
const generateLabel = (item, itemIcon) => {
  let backgroundColor = '';

  if (item?.content?.labelColor && HEX_REGEX.test(item?.content?.labelColor)) {
    backgroundColor = item.content.labelColor;
  }

  itemIcon.classList.add('icon-label');
  itemIcon.setAttribute('style', `background: ${backgroundColor} !important;`);
  const itemLabelText = createTextElement('span', item?.content?.labelText?.toUpperCase() || item?.content?.name?.substring(0, 2).toUpperCase() || '');
  itemLabelText.style.color = item.content.textColor;
  itemIcon.appendChild(itemLabelText);
};

/** 
* Function to check if matching logins are visible.
* @param {HTMLElement} container - The container element to search within.
* @return {boolean} True if matching logins are visible, false otherwise.
*/
const matchingLoginsVisible = container => {
  const matchingLoginsEl = Array.from(container.querySelectorAll(S.matchingLogins.el));

  if (!matchingLoginsEl || matchingLoginsEl.length <= 0) {
    return false;
  }

  const elements = matchingLoginsEl.map(el => {
    const visibleEl = el.classList.contains('twofas-pass-visible');
    const hiddenEl = el.classList.contains('twofas-pass-hidden');
    const oldEl = el.classList.contains('twofas-pass-old');

    if (visibleEl || (!hiddenEl && !oldEl) || (!visibleEl && !hiddenEl && !oldEl)) { // VISIBLE IN SOME WAY
      return false;
    }

    return true;
  });

  return elements.includes(false);
};

/** 
* Function to create a notification.
* @param {Object} request - The request object.
* @param {HTMLElement} container - The container element to search within.
* @return {void}
*/
const matchingLogins = (request, sendResponse, container) => {
  if (matchingLoginsVisible(container)) {
    return sendResponse({ status: 'omitted' });
  }

  const n = {
    container: container.querySelector(S.notification.container),
    item: null,
    top: null,
    logo: null,
    logoSvg: null,
    close: null,
    closeSvg: null,
    header: null,
    headerText: null,
    items: null
  };

  if (!n.container) {
    n.container = createElement('div', 'twofas-pass-notification-container');
    n.container.style.display = 'none';
    n.container.classList.add('twofas-pass-transitions');
    container.appendChild(n.container);
  }

  n.item = createElement('div', 'twofas-pass-notification-item twofas-pass-matching-logins');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.item.classList.add(request.theme);
  } else {
    n.item.classList.add('unset');
  }

  n.item.classList.add('twofas-pass-matching-logins');

  n.top = createElement('div', 'twofas-pass-notification-matching-logins-top');
  n.logo = createElement('div', 'twofas-pass-notification-matching-logins-top-logo');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.logoSvg = createSVGElement(request.theme === 'dark' ? logoSrcDark : logoSrc);
  } else {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    n.logoSvg = createSVGElement(isDarkMode ? logoSrcDark : logoSrc);
  }

  const timers = {
    visible: null,
    maxHeight1: null,
    maxHeight2: null,
    cleanup: null
  };

  n.close = createElement('button', 'twofas-pass-notification-matching-logins-top-close');
  n.close.addEventListener('click', () => cancel(n, timers, sendResponse));
  n.closeSvg = createSVGElement(closeSrc);

  n.close.appendChild(n.closeSvg);
  n.logo.appendChild(n.logoSvg);
  n.top.appendChild(n.logo);
  n.top.appendChild(n.close);

  n.header = createElement('div', 'twofas-pass-notification-matching-logins-header');
  n.headerText = createTextElement('span', browser.i18n.getMessage('content_matching_logins_title'));
  n.header.appendChild(n.headerText);

  n.item.appendChild(n.top);
  n.item.appendChild(n.header);

  n.items = createElement('div', 'twofas-pass-notification-matching-logins-items');

  const loginsData = request.data.sort((a, b) => a?.name?.toLowerCase() > b?.name?.toLowerCase() ? 1 : -1);

  loginsData.forEach(item => {
    const itemEl = createElement('div', 'twofas-pass-notification-matching-logins-item');

    const itemBtn = createElement('button', 'twofas-pass-notification-matching-logins-item-btn');
    itemBtn.addEventListener('click', () => action(n, timers, sendResponse, item.vaultId, item.deviceId, item.id, item.contentType));

    const itemIcon = createElement('span', 'twofas-pass-notification-matching-logins-item-icon');

    if ((!item?.content?.iconType && item?.content?.iconType !== 0) || item?.content?.iconType === 1) {
      // Label
      generateLabel(item, itemIcon);
    } else if (item?.content?.iconType === 0) {
      // Default favicon
      let iconDomain = '';
      let parsedDomain = null;
      const iconUriIndex = item?.content?.iconUriIndex || 0;

      try {
        iconDomain = getDomain(item?.content.uris[iconUriIndex]?.text);

        try {
          parsedDomain = parseDomain(iconDomain);
        } catch {}
        
        if (
          !iconDomain ||
          URIMatcher.isIp(iconDomain) ||
          iconDomain === 'localhost' ||
          parsedDomain?.type === ParseResultType.Invalid ||
          parsedDomain?.type === ParseResultType.Reserved ||
          parsedDomain?.type === ParseResultType.NotListed
        ) {
          throw new Error('Invalid domain for favicon');
        }

        const imageUrl = `https://icon.2fas.com/${iconDomain}/favicon.png`;

        itemIcon.classList.add('icon-image');
        const iconImage = createElement('img');
        iconImage.src = imageUrl;
        iconImage.alt = item.content.name;
        itemIcon.appendChild(iconImage);

        iconImage.onerror = () => {
          itemIcon.removeChild(iconImage);
          itemIcon.classList.remove('icon-image');
          generateLabel(item, itemIcon);
        };
      } catch {
        generateLabel(item, itemIcon);
      }
    } else {
      // Custom
      itemIcon.classList.add('icon-image');
      const iconImage = createElement('img');
      iconImage.src = `https://custom-icon.2fas.com/?url=${item?.content?.customImageUrl}`;
      iconImage.alt = item.content.name;
      itemIcon.appendChild(iconImage);

      iconImage.onerror = () => {
        itemIcon.removeChild(iconImage);
        itemIcon.classList.remove('icon-image');
        generateLabel(item, itemIcon);
      };
    }

    const itemAccount = createElement('span');
    const itemAccountName = createTextElement('span', item.content.name || browser.i18n.getMessage('no_item_name'));

    let itemAccountUsername;

    if (item?.content?.username && item?.content?.username.length > 0) {
      itemAccountUsername = createTextElement('span', item.content.username);
    }

    const itemSecondaryBtnText = (item.securityType === SECURITY_TIER.SECRET || item.t2WithPassword === true) ? browser.i18n.getMessage('autofill') : browser.i18n.getMessage('fetch');
    const itemSecondaryBtn = createTextElement('span', itemSecondaryBtnText, 'twofas-pass-notification-matching-logins-item-secondary-btn');

    itemAccount.appendChild(itemAccountName);

    if (itemAccountUsername) {
      itemAccount.appendChild(itemAccountUsername);
    }

    itemBtn.appendChild(itemIcon);
    itemBtn.appendChild(itemAccount);
    itemBtn.appendChild(itemSecondaryBtn);

    itemEl.appendChild(itemBtn);
    n.items.appendChild(itemEl);
  });

  n.item.appendChild(n.items);
  n.container.appendChild(n.item);

  timers.visible = setTimeout(() => {
    if (n && n.item) {
      n.item.classList.add('twofas-pass-visible');
    }

    timers.visible = null;
  }, 300);

  timers.maxHeight1 = setTimeout(() => {
    if (n && n.items) {
      n.items.style.setProperty('max-height', `${(request.data.length * 57) - 13}px`, 'important');
    }

    timers.maxHeight1 = null;
  }, 301);

  timers.maxHeight2 = setTimeout(() => {
    if (n && n.item) {
      n.item.style.maxHeight = `${n.item.offsetHeight + (request.data.length * 57) - 13}px`;
    }

    timers.maxHeight2 = null;
  }, 302);
};

export default matchingLogins;
