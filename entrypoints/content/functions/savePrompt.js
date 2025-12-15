// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import { selectors as S, SAVE_PROMPT_ACTIONS } from '@/constants';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';
import closeSrc from '@/assets/popup-window/cancel.svg?raw';

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
  return sendResponse({ status: SAVE_PROMPT_ACTIONS.CANCEL });
};

/**
* Function to handle the "Do Not Ask" action.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @param {Function} sendResponse - The function to send the response back.
* @return {void}
*/
const doNotAsk = (n, timers, sendResponse) => {
  closeNotification(n, timers);
  return sendResponse({ status: SAVE_PROMPT_ACTIONS.DO_NOT_ASK });
};

/**
* Function to add a login.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @param {Function} sendResponse - The function to send the response back.
* @return {void}
*/
const newLogin = (n, timers, sendResponse) => {
  closeNotification(n, timers);
  return sendResponse({ status: SAVE_PROMPT_ACTIONS.NEW_LOGIN });
};

/**
* Function to update a login.
* @param {Object} n - The notification object.
* @param {Object} timers - The timers object containing all timer IDs.
* @param {Object} itemData - The data related to the item to update.
* @param {Function} sendResponse - The function to send the response back.
* @return {void}
*/
const updateLogin = (n, timers, itemData, sendResponse) => {
  closeNotification(n, timers);
  return sendResponse({ status: SAVE_PROMPT_ACTIONS.UPDATE_LOGIN, ...itemData });
};

/** 
* Function to check if the save prompt is visible.
* @param {HTMLElement} container - The container element to search within.
* @return {boolean} True if the save prompt is visible, false otherwise.
*/
const savePromptVisible = container => {
  const savePromptEl = Array.from(container.querySelectorAll(S.savePrompt.el));

  if (!savePromptEl || savePromptEl.length <= 0) {
    return false;
  }

  const elements = savePromptEl.map(el => {
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
* Function to generate and display a save prompt notification.
* @param {Object} request - The request object.
* @param {Function} sendResponse - The function to send the response back.
* @param {HTMLElement} container - The container element to search within.
* @return {void}
*/
const savePrompt = (request, sendResponse, container) => {
  if (savePromptVisible(container)) {
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
    buttons: null
  };

  if (!n.container) {
    n.container = createElement('div', 'twofas-pass-notification-container');
    n.container.style.display = 'none';
    n.container.classList.add('twofas-pass-transitions');
    container.appendChild(n.container);
  }

  n.item = createElement('div', 'twofas-pass-notification-item twofas-pass-save-prompt');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.item.classList.add(request.theme);
  } else {
    n.item.classList.add('unset');
  }

  n.item.classList.add('twofas-pass-save-prompt');

  n.top = createElement('div', 'twofas-pass-notification-save-prompt-top');
  n.logo = createElement('div', 'twofas-pass-notification-save-prompt-top-logo');

  if (request?.theme && (request?.theme === 'light' || request?.theme === 'dark')) {
    n.logoSvg = createSVGElement(request.theme === 'dark' ? logoSrcDark : logoSrc);
  } else {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    n.logoSvg = createSVGElement(isDarkMode ? logoSrcDark : logoSrc);
  }

  const timers = {
    visible: null,
    cleanup: null
  };

  n.close = createElement('button', 'twofas-pass-notification-save-prompt-top-close');
  n.close.addEventListener('click', () => cancel(n, timers, sendResponse));
  n.closeSvg = createSVGElement(closeSrc);

  n.close.appendChild(n.closeSvg);
  n.logo.appendChild(n.logoSvg);
  n.top.appendChild(n.logo);
  n.top.appendChild(n.close);

  n.header = createElement('div', 'twofas-pass-notification-save-prompt-header');
  n.headerText = createTextElement('p', request?.serviceTypeData?.type === 'newService' ? browser.i18n.getMessage('content_save_prompt_add_header') : browser.i18n.getMessage('content_save_prompt_update_header'));
  n.header.appendChild(n.headerText);

  n.item.appendChild(n.top);
  n.item.appendChild(n.header);

  n.buttons = createElement('div', 'twofas-pass-notification-save-prompt-buttons');

  const doNotAskButton = createTextElement('button', browser.i18n.getMessage('content_save_prompt_don_t_ask'));
  doNotAskButton.classList.add('twofas-pass-notification-save-prompt-buttons-do-not-ask');
  doNotAskButton.addEventListener('click', () => doNotAsk(n, timers, sendResponse));
  n.buttons.appendChild(doNotAskButton);

  const addLoginButtonText = request?.serviceTypeData?.type === 'newService' ? browser.i18n.getMessage('content_save_prompt_add_login') : browser.i18n.getMessage('content_save_prompt_update_login');
  const addLoginButton = createTextElement('button', addLoginButtonText);
  addLoginButton.classList.add('twofas-pass-notification-save-prompt-buttons-add-login');
  addLoginButton.addEventListener('click', () => {
    if (request?.serviceTypeData?.type === 'newService') {
      return newLogin(n, timers, sendResponse);
    } else {
      return updateLogin(n, timers, request?.serviceTypeData, sendResponse);
    }
  });

  n.buttons.appendChild(addLoginButton);
  n.item.appendChild(n.buttons);
  n.container.appendChild(n.item);

  timers.visible = setTimeout(() => {
    if (n && n.item) {
      n.item.classList.add('twofas-pass-visible');
    }

    timers.visible = null;
  }, 300);
};

export default savePrompt;
