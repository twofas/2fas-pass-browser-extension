// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/TwofasNotification/TwofasNotification.scss';
import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import S from '@/constants/selectors';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';
import closeSrc from '@/assets/popup-window/cancel.svg?raw';
import { HEX_REGEX } from '@/constants/regex';
import getDomain from '@/partials/functions/getDomain';
import getTextColor from '@/partials/functions/getTextColor';
import URIMatcher from '@/partials/URIMatcher';

/** 
* Function to close the notification.
* @param {Object} n - The notification object.
* @return {void}
*/
const closeNotification = n => {
  n.item.classList.add('twofas-pass-hidden');

  setTimeout(() => {
    n.item.classList.remove('twofas-pass-hidden');
    n.item.classList.remove('twofas-pass-visible');
    n.item.classList.add('twofas-pass-old');
    n = null;
  }, 300);
};

/** 
* Function to cancel the notification.
* @param {Object} n - The notification object.
* @param {Function} sendResponse - The function to send the response back.
* @return {void}
*/
const cancel = (n, sendResponse) => {
  closeNotification(n);
  return sendResponse({ status: 'cancel' });
};

/** 
* Function to perform an action.
* @param {Object} n - The notification object.
* @param {Function} sendResponse - The function to send the response back.
* @param {string} id - The ID of the item.
* @param {string} deviceId - The device ID of the item.
* @return {void}
*/
const action = (n, sendResponse, id, deviceId) => {
  closeNotification(n);
  return sendResponse({ status: 'action', id, deviceId });
};

/** 
* Function to generate a label for an item.
* @param {Object} item - The item object.
* @param {HTMLElement} itemIcon - The icon element for the item.
* @return {void}
*/
const generateLabel = (item, itemIcon) => {
  let backgroundColor = '';

  if (item?.labelColor && HEX_REGEX.test(item.labelColor)) {
    backgroundColor = item.labelColor;
  }

  itemIcon.classList.add('icon-label');
  itemIcon.setAttribute('style', `background: ${backgroundColor} !important;`);
  const itemLabelText = createTextElement('span', item?.labelText?.toUpperCase() || item?.name?.substring(0, 2).toUpperCase() || '');
  itemLabelText.style.color = getTextColor(item.labelColor);
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

  let n = {
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
    n.item.classList.add('light');
  }

  n.item.classList.add('twofas-pass-matching-logins');

  n.top = createElement('div', 'twofas-pass-notification-matching-logins-top');
  n.logo = createElement('div', 'twofas-pass-notification-matching-logins-top-logo');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.logoSvg = createSVGElement(request.theme === 'dark' ? logoSrcDark : logoSrc);
  } else {
    n.logoSvg = createSVGElement(logoSrc);
  }

  n.close = createElement('button', 'twofas-pass-notification-matching-logins-top-close');
  n.close.addEventListener('click', () => cancel(n, sendResponse));
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
    itemBtn.addEventListener('click', () => action(n, sendResponse, item.id, item.deviceId ));

    const itemIcon = createElement('span', 'twofas-pass-notification-matching-logins-item-icon');

    if ((!item?.iconType && item?.iconType !== 0) || item?.iconType === 1) {
      // Label
      generateLabel(item, itemIcon)
    } else if (item?.iconType === 0) {
      // Default favicon
      let iconDomain = '';
      const iconUriIndex = item?.iconUriIndex || 0;

      try {
        iconDomain = getDomain(item?.uris[iconUriIndex]?.text);
        
        if (!iconDomain || URIMatcher.isIp(iconDomain) || iconDomain === 'localhost') {
          throw new Error('Invalid domain for favicon');
        }

        const imageUrl = `https://icon.2fas.com/${iconDomain}/favicon.png`;

        itemIcon.classList.add('icon-image');
        const iconImage = createElement('img');
        iconImage.src = imageUrl;
        iconImage.alt = item.name;
        itemIcon.appendChild(iconImage);

        iconImage.onerror = () => {
          itemIcon.removeChild(iconImage);
          itemIcon.classList.remove('icon-image');
          generateLabel(item, itemIcon);
        };
      } catch (e) {
        generateLabel(item, itemIcon);
      }
    } else {
      // Custom
      itemIcon.classList.add('icon-image');
      const iconImage = createElement('img');
      iconImage.src = `https://custom-icon.2fas.com/?url=${item?.customImageUrl}`;
      iconImage.alt = item.name;
      itemIcon.appendChild(iconImage);

      iconImage.onerror = () => {
        itemIcon.removeChild(iconImage);
        itemIcon.classList.remove('icon-image');
        generateLabel(item, itemIcon);
      };
    }

    const itemAccount = createElement('span');
    const itemAccountName = createTextElement('span', item.name || browser.i18n.getMessage('no_item_name'));

    let itemAccountUsername;

    if (item?.username && item?.username.length > 0) {
      itemAccountUsername = createTextElement('span', item.username);
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

  setTimeout(() => n.item.classList.add('twofas-pass-visible'), 300);
  setTimeout(() => { n.items.style.setProperty('max-height', `${(request.data.length * 57) - 13}px`, 'important'); }, 301);
  setTimeout(() => { n.item.style.maxHeight = `${n.item.offsetHeight + (request.data.length * 57) - 13}px`; }, 302);
};

export default matchingLogins;
