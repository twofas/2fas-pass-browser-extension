// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Login from './Login.js';
import SecureNote from './SecureNote.js';
import CreditCard from './CreditCard.js';
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
  const isCreditCardSupported = deviceSupportedFeatures.includes(supportedFeatures?.items?.creditCard);

  if (isSecureNoteSupported) {
    modelClasses.push(SecureNote);
  }

  if (isCreditCardSupported) {
    modelClasses.push(CreditCard);
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
