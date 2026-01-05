// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import LoginIcon from '@/assets/popup-window/items/login.svg?react';
import PaymentCardIcon from '@/assets/popup-window/items/payment-card.svg?react';
import SecureNoteIcon from '@/assets/popup-window/items/secure-note.svg?react';
import SSHKeyIcon from '@/assets/popup-window/items/ssh-key.svg?react';

const itemsUiData = {
  Login: {
    label: browser.i18n.getMessage('login'),
    selectClassName: 'icon-item-login',
    svg: <LoginIcon />
  },
  PaymentCard: {
    label: browser.i18n.getMessage('payment_card'),
    selectClassName: 'icon-item-payment-card',
    svg: <PaymentCardIcon />
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
