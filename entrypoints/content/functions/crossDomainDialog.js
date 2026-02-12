// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';
import closeSrc from '@/assets/popup-window/cancel.svg?raw';
import chevronSrc from '@/assets/popup-window/chevron.svg?raw';

const DROPDOWN_OPTIONS = [
  { value: 'always_ask', labelKey: 'content_cross_domain_dialog_always_ask', descKey: 'content_cross_domain_dialog_always_ask_description' },
  { value: 'always_autofill', labelKey: 'content_cross_domain_dialog_always_autofill', descKey: 'content_cross_domain_dialog_always_autofill_description' },
  { value: 'never_autofill', labelKey: 'content_cross_domain_dialog_never_autofill', descKey: 'content_cross_domain_dialog_never_autofill_description' }
];

/**
* Creates a custom dropdown for a domain row.
* @param {string} domain - The domain this dropdown is for.
* @param {Object} domainSelections - The shared selections map.
* @return {HTMLElement} The dropdown container element.
*/
const createDropdown = (domain, domainSelections) => {
  const dropdown = createElement('div', 'twofas-pass-cross-domain-dialog-dropdown');
  const trigger = createElement('button', 'twofas-pass-cross-domain-dialog-dropdown-trigger');
  trigger.type = 'button';

  const triggerText = createTextElement('span', getMessage(DROPDOWN_OPTIONS[0].labelKey));
  triggerText.setAttribute('data-i18n-key', DROPDOWN_OPTIONS[0].labelKey);
  const triggerIcon = createElement('span', 'twofas-pass-cross-domain-dialog-dropdown-trigger-icon');
  triggerIcon.appendChild(createSVGElement(chevronSrc));

  trigger.appendChild(triggerText);
  trigger.appendChild(triggerIcon);

  const menu = createElement('div', 'twofas-pass-cross-domain-dialog-dropdown-menu');

  DROPDOWN_OPTIONS.forEach(option => {
    const menuItem = createElement('button', 'twofas-pass-cross-domain-dialog-dropdown-item');
    menuItem.type = 'button';
    menuItem.dataset.value = option.value;

    if (option.value === 'always_ask') {
      menuItem.classList.add('active');
    }

    const itemText = createElement('div', 'twofas-pass-cross-domain-dialog-dropdown-item-text');
    const itemLabel = createTextElement('span', getMessage(option.labelKey), 'twofas-pass-cross-domain-dialog-dropdown-item-label');
    itemLabel.setAttribute('data-i18n-key', option.labelKey);
    const itemDesc = createTextElement('span', getMessage(option.descKey), 'twofas-pass-cross-domain-dialog-dropdown-item-desc');
    itemDesc.setAttribute('data-i18n-key', option.descKey);
    itemText.appendChild(itemLabel);
    itemText.appendChild(itemDesc);

    const itemCircle = createElement('span', 'twofas-pass-cross-domain-dialog-dropdown-item-circle');

    menuItem.appendChild(itemText);
    menuItem.appendChild(itemCircle);

    menuItem.addEventListener('click', e => {
      e.stopPropagation();
      domainSelections[domain] = option.value;
      triggerText.textContent = getMessage(option.labelKey);
      triggerText.setAttribute('data-i18n-key', option.labelKey);

      menu.querySelectorAll('.twofas-pass-cross-domain-dialog-dropdown-item').forEach(item => {
        item.classList.remove('active');
      });

      menuItem.classList.add('active');
      dropdown.classList.remove('open');
    });

    menu.appendChild(menuItem);
  });

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');

    dropdown.closest('.twofas-pass-cross-domain-dialog-content')
      ?.querySelectorAll('.twofas-pass-cross-domain-dialog-dropdown.open')
      .forEach(d => d.classList.remove('open'));

    if (!isOpen) {
      dropdown.classList.add('open');

      const triggerRect = trigger.getBoundingClientRect();
      const menuHeight = menu.scrollHeight || 200;
      const spaceBelow = window.innerHeight - triggerRect.bottom - 8;
      const openAbove = spaceBelow < menuHeight && triggerRect.top > menuHeight;

      menu.style.setProperty('top', openAbove ? 'auto' : `${triggerRect.bottom + 4}px`, 'important');
      menu.style.setProperty('bottom', openAbove ? `${window.innerHeight - triggerRect.top + 4}px` : 'auto', 'important');
      menu.style.setProperty('right', `${window.innerWidth - triggerRect.right}px`, 'important');
    }
  });

  dropdown.appendChild(trigger);
  dropdown.appendChild(menu);

  return dropdown;
};

/**
* Creates and shows a cross-domain confirmation dialog using HTMLDialogElement.
* @param {Object} request - The request object containing unknownDomains and theme.
* @param {Function} sendResponse - The function to send the response back.
* @param {HTMLElement} container - The container element (shadow DOM).
* @return {void}
*/
const crossDomainDialog = (request, sendResponse, container) => {
  const unknownDomains = request.unknownDomains || [];
  const theme = request.theme;

  if (unknownDomains.length === 0) {
    sendResponse({ status: 'ok', confirmed: false, domainPreferences: {}, allowedDomains: [] });
    return;
  }

  const domainSelections = {};

  unknownDomains.forEach(domain => {
    domainSelections[domain] = 'always_ask';
  });

  let responded = false;

  const dialog = document.createElement('dialog');
  dialog.className = 'twofas-pass-cross-domain-dialog';

  if (theme === 'light' || theme === 'dark') {
    dialog.classList.add(theme);
  } else {
    dialog.classList.add('unset');
  }

  const dialogContent = createElement('div', 'twofas-pass-cross-domain-dialog-content');

  const top = createElement('div', 'twofas-pass-cross-domain-dialog-top');
  const logo = createElement('div', 'twofas-pass-cross-domain-dialog-top-logo');

  let logoSvg;

  if (theme === 'light' || theme === 'dark') {
    logoSvg = createSVGElement(theme === 'dark' ? logoSrcDark : logoSrc);
  } else {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    logoSvg = createSVGElement(isDarkMode ? logoSrcDark : logoSrc);
  }

  logo.appendChild(logoSvg);

  const closeBtn = createElement('button', 'twofas-pass-cross-domain-dialog-top-close');
  closeBtn.type = 'button';
  closeBtn.appendChild(createSVGElement(closeSrc));

  top.appendChild(logo);
  top.appendChild(closeBtn);

  const header = createElement('div', 'twofas-pass-cross-domain-dialog-header');
  const headerTitle = createTextElement('h3', getMessage('content_cross_domain_dialog_title'));
  headerTitle.setAttribute('data-i18n-key', 'content_cross_domain_dialog_title');
  const headerDesc = createTextElement('p', getMessage('content_cross_domain_dialog_description'));
  headerDesc.setAttribute('data-i18n-key', 'content_cross_domain_dialog_description');
  header.appendChild(headerTitle);
  header.appendChild(headerDesc);

  const table = createElement('div', 'twofas-pass-cross-domain-dialog-table');
  const tableContent = createElement('div', 'twofas-pass-cross-domain-dialog-table-content');
  const tableHeader = createElement('div', 'twofas-pass-cross-domain-dialog-table-header');
  const domainCol = createTextElement('span', getMessage('content_cross_domain_dialog_domain_column'));
  domainCol.setAttribute('data-i18n-key', 'content_cross_domain_dialog_domain_column');
  const behaviorCol = createTextElement('span', getMessage('content_cross_domain_dialog_behavior_column'));
  behaviorCol.setAttribute('data-i18n-key', 'content_cross_domain_dialog_behavior_column');
  tableHeader.appendChild(domainCol);
  tableHeader.appendChild(behaviorCol);

  const tableRows = createElement('div', 'twofas-pass-cross-domain-dialog-table-rows');

  unknownDomains.forEach(domain => {
    const row = createElement('div', 'twofas-pass-cross-domain-dialog-table-row');
    const domainText = createTextElement('span', domain, 'twofas-pass-cross-domain-dialog-domain-text');
    domainText.title = domain;
    const dropdown = createDropdown(domain, domainSelections);

    row.appendChild(domainText);
    row.appendChild(dropdown);
    tableRows.appendChild(row);
  });

  tableContent.appendChild(tableHeader);
  tableContent.appendChild(tableRows);
  table.appendChild(tableContent);

  const buttons = createElement('div', 'twofas-pass-cross-domain-dialog-buttons');

  const cancelBtn = createTextElement('button', getMessage('content_cross_domain_dialog_cancel'), 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-cancel');
  cancelBtn.type = 'button';
  cancelBtn.setAttribute('data-i18n-key', 'content_cross_domain_dialog_cancel');

  const acceptBtn = createTextElement('button', getMessage('content_cross_domain_dialog_accept'), 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-accept');
  acceptBtn.type = 'button';
  acceptBtn.setAttribute('data-i18n-key', 'content_cross_domain_dialog_accept');

  buttons.appendChild(cancelBtn);
  buttons.appendChild(acceptBtn);

  dialogContent.appendChild(top);
  dialogContent.appendChild(header);
  dialogContent.appendChild(table);
  dialogContent.appendChild(buttons);
  dialog.appendChild(dialogContent);

  const cleanup = () => {
    dialog.close();
    dialog.remove();
  };

  const respondCancel = () => {
    if (responded) {
      return;
    }

    responded = true;
    cleanup();
    sendResponse({ status: 'ok', confirmed: false, domainPreferences: {}, allowedDomains: [] });
  };

  const respondAccept = () => {
    if (responded) {
      return;
    }

    responded = true;

    const allowedDomains = [];

    for (const [domain, preference] of Object.entries(domainSelections)) {
      if (preference === 'always_ask' || preference === 'always_autofill') {
        allowedDomains.push(domain);
      }
    }

    cleanup();
    sendResponse({ status: 'ok', confirmed: true, domainPreferences: domainSelections, allowedDomains });
  };

  closeBtn.addEventListener('click', respondCancel);
  cancelBtn.addEventListener('click', respondCancel);
  acceptBtn.addEventListener('click', respondAccept);

  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    respondCancel();
  });

  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      return;
    }

    const openDropdowns = dialogContent.querySelectorAll('.twofas-pass-cross-domain-dialog-dropdown.open');

    openDropdowns.forEach(d => {
      if (!d.contains(e.target)) {
        d.classList.remove('open');
      }
    });
  });

  dialogContent.addEventListener('scroll', () => {
    dialogContent.querySelectorAll('.twofas-pass-cross-domain-dialog-dropdown.open')
      .forEach(d => d.classList.remove('open'));
  });

  container.appendChild(dialog);
  dialog.showModal();
};

export default crossDomainDialog;
