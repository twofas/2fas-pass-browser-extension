// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import Login from './Login/index.js';
import SecureNote from './SecureNote/index.js';
import PaymentCard from './PaymentCard/index.js';
import Wifi from './Wifi/index.js';

export { default as Item } from './Item.js';
export { default as getModelsForDevice } from './getModelsForDevice.js';
export { default as mapModel } from './mapModel.js';
export { default as matchModel } from './matchModel.js';
export { Login, SecureNote, PaymentCard, Wifi };

/**
* Resolves the model class for a given contentType. Works on raw data
* (plain objects from storage) and on model instances alike — both expose
* the `contentType` field. The lookup is performed lazily inside this
* function to avoid module-eval-time access to the imported classes —
* which would otherwise hit the temporal dead zone in cyclic-import paths
* (model → views → shared helper → this barrel → model).
* @param {string|null|undefined} contentType
* @returns {typeof Login|typeof SecureNote|typeof PaymentCard|typeof Wifi|null}
*/
export const getModelClass = contentType => {
  switch (contentType) {
    case Login.contentType:
      return Login;

    case SecureNote.contentType:
      return SecureNote;

    case PaymentCard.contentType:
      return PaymentCard;

    case Wifi.contentType:
      return Wifi;

    default:
      return null;
  }
};
