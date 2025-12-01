// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import getItem from '@/partials/sessionStorage/getItem';
import Login from '@/partials/models/itemModels/Login';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';
import handleLoginAutofill from './handleLoginAutofill';
import handleCardAutofill from './handleCardAutofill';

/**
* Dispatches the autofill action to the appropriate handler based on item type.
* @async
* @param {string} deviceId - The ID of the device.
* @param {string} vaultId - The ID of the vault.
* @param {string} itemId - The ID of the item.
* @param {function} navigate - The navigate function.
* @param {boolean} more - Indicates if more actions are available.
* @param {function} setMore - Function to update the more state.
* @return {Promise<void>}
*/
const handleAutofill = async (deviceId, vaultId, itemId, navigate, more, setMore) => {
  if (more) {
    setMore(false);
  }

  let item;

  try {
    item = await getItem(deviceId, vaultId, itemId);
  } catch (e) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(e);
    return;
  }

  if (!item) {
    showToast(browser.i18n.getMessage('error_login_not_found'), 'error');
    await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoService, { additional: { func: 'handleAutofill' } }));
    return;
  }

  switch (item.contentType) {
    case Login.contentType:
      await handleLoginAutofill(item, navigate);
      break;
    case PaymentCard.contentType:
      await handleCardAutofill(item, navigate);
      break;
    default:
      showToast(browser.i18n.getMessage('error_autofill_failed'), 'error');
      await CatchError(new TwoFasError(TwoFasError.internalErrors.handleAutofillNoService, { additional: { func: 'handleAutofill', contentType: item.contentType } }));
      break;
  }
};

export default handleAutofill;
