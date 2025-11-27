// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import usePopupStateStore from '@/entrypoints/popup/store/popupState';

/**
* Function to get the editable amount for PaymentCard details.
* @return {Object} An object containing the editable amount and a text description.
*/
const getEditableAmount = () => {
  const data = usePopupStateStore(state => state.data);

  let amount = 0;

  if (data?.nameEditable) { amount++; }
  if (data?.cardHolderEditable) { amount++; }
  if (data?.cardNumberEditable) { amount++; }
  if (data?.expirationDateEditable) { amount++; }
  if (data?.securityCodeEditable) { amount++; }
  if (data?.notesEditable) { amount++; }
  if (data?.tierEditable) { amount++; }
  if (data?.tagsEditable) { amount++; }

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
