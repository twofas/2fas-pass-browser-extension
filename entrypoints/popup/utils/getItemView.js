// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Login, SecureNote, PaymentCard, Wifi } from '@/models/itemModels';
import LoginItemView from '@/models/itemModels/Login/views/ItemView';
import SecureNoteItemView from '@/models/itemModels/SecureNote/views/ItemView';
import PaymentCardItemView from '@/models/itemModels/PaymentCard/views/ItemView';
import WifiItemView from '@/models/itemModels/Wifi/views/ItemView';
import createItemViewResolver from './createItemViewResolver';

/**
* Resolves the list row view of an item type. Only the row views live here, so the item list does not bundle
* the add-new and details views: those load with their own (lazy) routes.
* @param {string|null|undefined} contentType - The item content type (e.g. 'login').
* @return {Function|null} The row view, or null for an unknown type.
*/
const getItemView = createItemViewResolver({
  [Login.contentType]: LoginItemView,
  [SecureNote.contentType]: SecureNoteItemView,
  [PaymentCard.contentType]: PaymentCardItemView,
  [Wifi.contentType]: WifiItemView
});

export default getItemView;
