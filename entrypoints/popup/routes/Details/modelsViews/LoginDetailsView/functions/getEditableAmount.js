// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

/**
* Function to get the editable amount.
* @return {Object} An object containing the editable amount and a text description.
*/
const getEditableAmount = () => {
  const { data } = usePopupState();

  let amount = 0;

  if (data?.nameEditable) { amount++; }
  if (data?.usernameEditable) { amount++; }
  if (data?.passwordEditable) { amount++; }
  if (data?.notesEditable) { amount++; }
  if (data?.tierEditable) { amount++; }
  if (data?.tagsEditable) { amount++; }

  let uriChanges = 0;

  const newUris = data?.uris?.filter(uri => uri.new) || [];
  uriChanges += newUris.length;

  uriChanges += data?.urisRemoved || 0;
  uriChanges += data?.domainsEditable ? Object.values(data.domainsEditable).filter(v => v).length : 0;

  amount += uriChanges;

  if (amount === 0) {
    return {
      text: '',
      amount: 0
    };
  }

  if (amount === 1) {
    return {
      text: ` (1 ${browser.i18n.getMessage('details_field')})`,
      amount: 1
    };
  }

  return {
    text: ` (${amount} ${browser.i18n.getMessage('details_fields')})`,
    amount: amount
  };
};

export default getEditableAmount;
