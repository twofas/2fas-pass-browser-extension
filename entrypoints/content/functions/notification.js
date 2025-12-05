// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import iconSrc from '@/assets/notification-logo.svg?raw';
import { selectors as S } from '@/constants';

/** 
* Function to create a notification.
* @param {Object} request - The request object.
* @param {HTMLElement} container - The container element to search within.
* @return {void}
*/
const notification = (request, container) => {
  const containerEl = container || document;

  let n = {
    container: containerEl.querySelector(S.notification.container),
    item: null,
    logo: null,
    svg: null,
    content: null,
    text1: null,
    text2: null
  };

  if (!n.container) {
    n.container = createElement('div', 'twofas-pass-notification-container');
    n.container.style.display = 'none';
    n.container.classList.add('twofas-pass-transitions');

    if (container) {
      containerEl.appendChild(n.container);
    } else {
      window.top.document.body.appendChild(n.container);
    }
  }

  n.item = createElement('div', 'twofas-pass-notification-item');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.item.classList.add(request.theme);
  } else {
    n.item.classList.add('unset');
  }

  n.logo = createElement('div', 'twofas-pass-notification-item-logo');
  n.svg = createSVGElement(iconSrc);

  n.logo.appendChild(n.svg);
  n.item.appendChild(n.logo);

  n.content = createElement('div', 'twofas-pass-notification-item-content');
  n.text1 = createTextElement('p', request.title);
  n.text2 = createTextElement('p', request.message);

  n.content.appendChild(n.text1);
  n.content.appendChild(n.text2);
  n.item.appendChild(n.content);

  n.container.appendChild(n.item);

  let visibleTimer = null;
  let maxHeightTimer = null;
  let beforeUnloadTimer = null;
  let autoCloseTimer = null;
  let cleanupTimer = null;

  const handleBeforeUnload = () => {
    if (n && n.item) {
      n.item.classList.add('twofas-pass-hidden');
    }

    beforeUnloadTimer = setTimeout(() => {
      closeNotification();
    }, 1400);
  };

  const closeNotification = () => {
    if (visibleTimer !== null) {
      clearTimeout(visibleTimer);
      visibleTimer = null;
    }

    if (maxHeightTimer !== null) {
      clearTimeout(maxHeightTimer);
      maxHeightTimer = null;
    }

    if (beforeUnloadTimer !== null) {
      clearTimeout(beforeUnloadTimer);
      beforeUnloadTimer = null;
    }

    if (autoCloseTimer !== null) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }

    if (cleanupTimer !== null) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    window.removeEventListener('beforeunload', handleBeforeUnload);

    if (n && n.item) {
      n.item.classList.add('twofas-pass-hidden');

      cleanupTimer = setTimeout(() => {
        if (n && n.item) {
          n.item.classList.remove('twofas-pass-hidden');
          n.item.classList.remove('twofas-pass-visible');
          n.item.classList.add('twofas-pass-old');
        }

        n = null;
        cleanupTimer = null;
      }, 200);
    }
  };

  visibleTimer = setTimeout(() => {
    if (n && n.item) {
      n.item.classList.add('twofas-pass-visible');
    }

    visibleTimer = null;
  }, 200);

  maxHeightTimer = setTimeout(() => {
    if (n && n.item) {
      n.item.style.maxHeight = `${n.item.offsetHeight}px`;
    }

    maxHeightTimer = null;
  }, 1200);

  window.addEventListener('beforeunload', handleBeforeUnload);

  if (request.timeout) {
    autoCloseTimer = setTimeout(() => {
      closeNotification();
    }, 6400);
  }
};

export default notification;
