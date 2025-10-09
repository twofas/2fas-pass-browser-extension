// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import usePopupStateStore from '../../../store/popupState';

/**
* Function to get the editable amount.
* @param {boolean} nameEditable - Indicates if the name field is editable.
* @param {boolean} usernameEditable - Indicates if the username field is editable.
* @param {boolean} passwordEditable - Indicates if the password field is editable.
* @param {Array<boolean>} domainsEditable - Indicates if the domain fields are editable.
* @param {boolean} notesEditable - Indicates if the notes field is editable.
* @param {boolean} tierEditable - Indicates if the tier field is editable.
* @param {boolean} tagsEditable - Indicates if the tags field is editable.
* @param {Array} currentUris - Current URIs array.
* @param {Array} originalUris - Original URIs array from the service.
* @return {Object} An object containing the editable amount and a text description.
*/
const getEditableAmount = () => {
  const data = usePopupStateStore(state => state.data);

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
