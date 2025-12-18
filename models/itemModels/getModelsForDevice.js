// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Login from './Login/index.js';
import SecureNote from './SecureNote/index.js';
import PaymentCard from './PaymentCard/index.js';
import supportedFeatures from '@/constants/supportedFeatures.js';
import getSupportedFeatures from '@/partials/functions/getSupportedFeatures.js';

const modelsByDeviceId = new Map();

/**
 * Gets or initializes the model classes map for a specific device based on its supported features
 * @async
 * @param {string} deviceId - The device ID
 * @returns {Map} A map of contentType to Model class
 */
const getModelsForDevice = async deviceId => {
  if (modelsByDeviceId.has(deviceId)) {
    return modelsByDeviceId.get(deviceId);
  }

  const deviceSupportedFeatures = await getSupportedFeatures(deviceId);
  const modelClasses = [Login];

  const isSecureNoteSupported = deviceSupportedFeatures.includes(supportedFeatures?.items?.secureNote);
  const isPaymentCardSupported = deviceSupportedFeatures.includes(supportedFeatures?.items?.paymentCard);

  if (isSecureNoteSupported) {
    modelClasses.push(SecureNote);
  }

  if (isPaymentCardSupported) {
    modelClasses.push(PaymentCard);
  }
  
  const models = new Map(
    modelClasses
      .filter(Model => Model.contentType)
      .map(Model => [Model.contentType, Model])
  );

  modelsByDeviceId.set(deviceId, models);

  return models;
};

export default getModelsForDevice;
