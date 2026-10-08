// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Login, SecureNote, PaymentCard, Wifi } from '@/models/itemModels';
import LoginDetailsView from '@/models/itemModels/Login/views/DetailsView';
import SecureNoteDetailsView from '@/models/itemModels/SecureNote/views/DetailsView';
import PaymentCardDetailsView from '@/models/itemModels/PaymentCard/views/DetailsView';
import WifiDetailsView from '@/models/itemModels/Wifi/views/DetailsView';
import createItemViewResolver from '@/entrypoints/popup/utils/createItemViewResolver';

/**
* Resolves the details view of an item type. Bundled with the lazily loaded Details route.
* @param {string|null|undefined} contentType - The item content type (e.g. 'login').
* @return {Function|null} The details view, or null for an unknown type.
*/
const getDetailsView = createItemViewResolver({
  [Login.contentType]: LoginDetailsView,
  [SecureNote.contentType]: SecureNoteDetailsView,
  [PaymentCard.contentType]: PaymentCardDetailsView,
  [Wifi.contentType]: WifiDetailsView
});

export default getDetailsView;
