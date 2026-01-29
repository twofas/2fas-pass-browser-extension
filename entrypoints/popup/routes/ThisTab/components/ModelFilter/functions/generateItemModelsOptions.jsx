// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import { supportedFeatures } from '@/constants';
import AllIcon from '@/assets/popup-window/items/all.svg?react';
import LoginIcon from '@/assets/popup-window/items/login.svg?react';
import SecureNoteIcon from '@/assets/popup-window/items/secure-note.svg?react';
import PaymentCardIcon from '@/assets/popup-window/items/payment-card.svg?react';

/**
* Function to generate item models options based on device supported features.
* @param {Array} deviceSupportedFeatures - An array of features supported by the device.
* @param {Function} getMessage - The i18n getMessage function.
* @return {Array} An array of item model options.
*/
const generateItemModelsOptions = (deviceSupportedFeatures, getMessage) => {
  const itemModelsOptions = [
    { value: null, label: getMessage('this_tab_all_logins_header'), icon: <AllIcon className={S.modelAllIcon} /> },
    { value: 'Login', label: getMessage('login_plural'), icon: <LoginIcon className={S.modelLoginIcon} />, className: 'logins' }
  ];

  if (deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote)) {
    itemModelsOptions.push({ value: 'SecureNote', label: getMessage('secure_note_plural'), icon: <SecureNoteIcon className={S.modelSecureNoteIcon} />, className: 'secure-notes' });
  }

  if (deviceSupportedFeatures.includes(supportedFeatures?.items?.paymentCard)) {
    itemModelsOptions.push({ value: 'PaymentCard', label: getMessage('payment_card_plural'), icon: <PaymentCardIcon className={S.modelPaymentCardIcon} />, className: 'payment-cards' });
  }

  return itemModelsOptions;
};

export default generateItemModelsOptions;
