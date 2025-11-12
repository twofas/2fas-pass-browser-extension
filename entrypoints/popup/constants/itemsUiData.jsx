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
    selectClassName: 'icon-item-login',
    svg: <LoginIcon />
  },
  CreditCard: {
    selectClassName: 'icon-item-credit-card',
    svg: <CreditCardIcon />
  },
  SecureNote: {
    selectClassName: 'icon-item-secure-note',
    svg: <SecureNoteIcon />
  },
  SSHKey: {
    selectClassName: 'icon-item-ssh-key',
    svg: <SSHKeyIcon />
  }
};

export default itemsUiData;
