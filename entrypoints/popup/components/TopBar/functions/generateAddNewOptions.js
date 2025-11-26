// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { supportedFeatures } from '@/constants';

/** 
* Generates an array of options for adding new items based on device supported features.
* @param {Array} deviceSupportedFeatures - An array of features supported by the device.
* @return {Array} An array of options for adding new items.
*/
const generateAddNewOptions = deviceSupportedFeatures => {
  const addNewOptions = [
    { value: '/add-new/Login', label: browser.i18n.getMessage('login'), item: 'Login' }
  ];

  if (deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote)) {
    addNewOptions.push({ value: '/add-new/SecureNote', label: browser.i18n.getMessage('secure_note'), item: 'SecureNote' });
  }

  if (deviceSupportedFeatures.includes(supportedFeatures?.items?.paymentCard)) {
    addNewOptions.push({ value: '/add-new/PaymentCard', label: browser.i18n.getMessage('payment_card'), item: 'PaymentCard' });
  }

  return addNewOptions;
};

export default generateAddNewOptions;
