// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Login, SecureNote, PaymentCard, Wifi } from '@/models/itemModels';
import LoginAddNewView from '@/models/itemModels/Login/views/AddNewView';
import SecureNoteAddNewView from '@/models/itemModels/SecureNote/views/AddNewView';
import PaymentCardAddNewView from '@/models/itemModels/PaymentCard/views/AddNewView';
import WifiAddNewView from '@/models/itemModels/Wifi/views/AddNewView';
import createItemViewResolver from '@/entrypoints/popup/utils/createItemViewResolver';

/**
* Resolves the add-new view of an item type. Bundled with the lazily loaded AddNew route.
* @param {string|null|undefined} contentType - The item content type (e.g. 'login').
* @return {Function|null} The add-new view, or null for an unknown type.
*/
const getAddNewView = createItemViewResolver({
  [Login.contentType]: LoginAddNewView,
  [SecureNote.contentType]: SecureNoteAddNewView,
  [PaymentCard.contentType]: PaymentCardAddNewView,
  [Wifi.contentType]: WifiAddNewView
});

export default getAddNewView;
