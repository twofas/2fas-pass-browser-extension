// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createElement, createSVGElement, createTextElement } from '@/partials/DOMElements';
import logoSrc from '@/assets/logo.svg?raw';
import logoSrcDark from '@/assets/logo-dark.svg?raw';

/**
* Creates and shows a cross-domain confirmation dialog using HTMLDialogElement.
* @param {Object} request - The request object containing domains and theme.
* @param {Function} sendResponse - The function to send the response back.
* @param {HTMLElement} container - The container element (shadow DOM).
* @return {void}
*/
const crossDomainConfirmDialog = (request, sendResponse, container) => {
  const domains = request.domains || [];
  const theme = request.theme;
  const isSingleDomain = domains.length === 1;

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
  top.appendChild(logo);

  const header = createElement('div', 'twofas-pass-cross-domain-dialog-header');
  const headerText = createTextElement('h3', getMessage('content_cross_domain_dialog_title'));
  header.appendChild(headerText);

  const message = createElement('div', 'twofas-pass-cross-domain-dialog-message');
  const messageText = createTextElement('p', getMessage('content_cross_domain_dialog_message'));
  message.appendChild(messageText);

  const domainsList = createElement('div', 'twofas-pass-cross-domain-dialog-domains');
  const domainsUl = createElement('ul', 'twofas-pass-cross-domain-dialog-domains-list');

  domains.forEach(domain => {
    const li = createElement('li', 'twofas-pass-cross-domain-dialog-domains-item');
    const domainText = createTextElement('span', domain);
    li.appendChild(domainText);
    domainsUl.appendChild(li);
  });

  domainsList.appendChild(domainsUl);

  const buttons = createElement('div', 'twofas-pass-cross-domain-dialog-buttons');

  const cancelBtn = createTextElement('button', getMessage('content_cross_domain_dialog_cancel'));
  cancelBtn.className = 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-cancel';
  cancelBtn.type = 'button';

  const autofillBtn = createTextElement('button', getMessage('content_cross_domain_dialog_autofill'));
  autofillBtn.className = 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-autofill';
  autofillBtn.type = 'button';

  buttons.appendChild(cancelBtn);
  buttons.appendChild(autofillBtn);

  const trustSection = createElement('div', 'twofas-pass-cross-domain-dialog-trust');
  const trustDivider = createElement('div', 'twofas-pass-cross-domain-dialog-trust-divider');
  trustSection.appendChild(trustDivider);

  const selectedTrustDomains = new Set();

  if (isSingleDomain) {
    const trustBtn = createTextElement('button', getMessage('content_cross_domain_dialog_trust_domain'));
    trustBtn.className = 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-trust';
    trustBtn.type = 'button';

    trustBtn.addEventListener('click', () => {
      cleanup();
      sendResponse({
        status: 'ok',
        confirmed: true,
        trustedDomains: [domains[0]]
      });
    });

    trustSection.appendChild(trustBtn);
  } else {
    const trustHeader = createElement('div', 'twofas-pass-cross-domain-dialog-trust-header');
    const trustHeaderText = createTextElement('span', getMessage('content_cross_domain_dialog_trust_domains_header'));
    trustHeader.appendChild(trustHeaderText);
    trustSection.appendChild(trustHeader);

    const trustList = createElement('div', 'twofas-pass-cross-domain-dialog-trust-list');

    domains.forEach((domain, index) => {
      const trustItem = createElement('label', 'twofas-pass-cross-domain-dialog-trust-item');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'twofas-pass-cross-domain-dialog-trust-checkbox';
      checkbox.id = `trust-domain-${index}`;
      checkbox.value = domain;

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedTrustDomains.add(domain);
        } else {
          selectedTrustDomains.delete(domain);
        }

        trustConfirmBtn.disabled = selectedTrustDomains.size === 0;
      });

      const checkboxLabel = createTextElement('span', domain);
      checkboxLabel.className = 'twofas-pass-cross-domain-dialog-trust-label';

      trustItem.appendChild(checkbox);
      trustItem.appendChild(checkboxLabel);
      trustList.appendChild(trustItem);
    });

    trustSection.appendChild(trustList);

    const trustConfirmBtn = createTextElement('button', getMessage('content_cross_domain_dialog_trust_selected'));
    trustConfirmBtn.className = 'twofas-pass-cross-domain-dialog-btn twofas-pass-cross-domain-dialog-btn-trust';
    trustConfirmBtn.type = 'button';
    trustConfirmBtn.disabled = true;

    trustConfirmBtn.addEventListener('click', () => {
      if (selectedTrustDomains.size === 0) {
        return;
      }

      cleanup();
      sendResponse({
        status: 'ok',
        confirmed: true,
        trustedDomains: Array.from(selectedTrustDomains)
      });
    });

    trustSection.appendChild(trustConfirmBtn);
  }

  dialogContent.appendChild(top);
  dialogContent.appendChild(header);
  dialogContent.appendChild(message);
  dialogContent.appendChild(domainsList);
  dialogContent.appendChild(buttons);
  dialogContent.appendChild(trustSection);
  dialog.appendChild(dialogContent);

  const cleanup = () => {
    dialog.close();
    dialog.remove();
  };

  cancelBtn.addEventListener('click', () => {
    cleanup();
    sendResponse({ status: 'ok', confirmed: false, trustedDomains: [] });
  });

  autofillBtn.addEventListener('click', () => {
    cleanup();
    sendResponse({ status: 'ok', confirmed: true, trustedDomains: [] });
  });

  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    cleanup();
    sendResponse({ status: 'ok', confirmed: false, trustedDomains: [] });
  });

  container.appendChild(dialog);
  dialog.showModal();
};

export default crossDomainConfirmDialog;
