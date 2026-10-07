// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { Login, SecureNote, PaymentCard, Wifi } from '@/models/itemModels';
import * as LoginViews from '@/models/itemModels/Login/views';
import * as SecureNoteViews from '@/models/itemModels/SecureNote/views';
import * as PaymentCardViews from '@/models/itemModels/PaymentCard/views';
import * as WifiViews from '@/models/itemModels/Wifi/views';

const toItemViews = views => Object.freeze({
  ItemComponent: views.ItemView,
  AddNewComponent: views.AddNewView,
  DetailsComponent: views.DetailsView
});

const ITEM_VIEWS = Object.freeze({
  [Login.contentType]: toItemViews(LoginViews),
  [SecureNote.contentType]: toItemViews(SecureNoteViews),
  [PaymentCard.contentType]: toItemViews(PaymentCardViews),
  [Wifi.contentType]: toItemViews(WifiViews)
});

/**
* Resolves the popup React views of an item type. The views live here, in the popup, and not as static getters on the
* models, so the background service worker and content scripts can use the models without bundling React.
* @param {string|null|undefined} contentType - The item content type (e.g. 'login').
* @return {{ItemComponent: Function, AddNewComponent: Function, DetailsComponent: Function}|null} The views, or null for an unknown type.
*/
const getItemViews = contentType => {
  if (!contentType || !Object.hasOwn(ITEM_VIEWS, contentType)) {
    return null;
  }

  return ITEM_VIEWS[contentType];
};

export default getItemViews;
