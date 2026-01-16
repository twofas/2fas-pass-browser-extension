// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

/**
* Function to get the editable amount for PaymentCard details.
* @return {Object} An object containing the editable amount and a text description.
*/
const getEditableAmount = () => {
  const { data } = usePopupState();

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
      text: ` (1 ${browser.i18n.getMessage('details_field_one')})`,
      amount: 1
    };
  }

  const lastDigit = amount % 10;
  const lastTwoDigits = amount % 100;
  const isFew = (lastDigit >= 2 && lastDigit <= 4) && !(lastTwoDigits >= 12 && lastTwoDigits <= 14);
  const pluralKey = isFew ? 'details_field_few' : 'details_field_many';

  return {
    text: ` (${amount} ${browser.i18n.getMessage(pluralKey)})`,
    amount: amount
  };
};

export default getEditableAmount;
