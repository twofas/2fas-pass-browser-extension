// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { lazy } from 'react';

const LoginIcon = lazy(() => import('@/assets/popup-window/items/login.svg?react'));
const CreditCardIcon = lazy(() => import('@/assets/popup-window/items/credit-card.svg?react'));
const SecureNoteIcon = lazy(() => import('@/assets/popup-window/items/secure-note.svg?react'));
const SSHKeyIcon = lazy(() => import('@/assets/popup-window/items/ssh-key.svg?react'));

const itemsUiData = {
  Login: {
    label: browser.i18n.getMessage('login'),
    selectClassName: 'icon-item-login',
    svg: <LoginIcon />
  },
  CreditCard: {
    label: browser.i18n.getMessage('credit_card'),
    selectClassName: 'icon-item-credit-card',
    svg: <CreditCardIcon />
  },
  SecureNote: {
    label: browser.i18n.getMessage('secure_note'),
    selectClassName: 'icon-item-secure-note',
    svg: <SecureNoteIcon />
  },
  SSHKey: {
    label: browser.i18n.getMessage('ssh_key'),
    selectClassName: 'icon-item-ssh-key',
    svg: <SSHKeyIcon />
  }
};

export default itemsUiData;
