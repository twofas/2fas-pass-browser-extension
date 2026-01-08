// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/AutofillErrorItem.module.scss';
import { memo, useState, useEffect, useCallback } from 'react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { copyValue } from '@/partials/functions';

const COPY_MESSAGES = {
  password: {
    success: 'notification_password_copied',
    error: 'error_password_copy_failed'
  },
  username: {
    success: 'notification_username_copied',
    error: 'error_username_copy_failed'
  },
  cardHolder: {
    success: 'details_cardholder_copied',
    error: 'error_cardholder_copy_failed'
  },
  cardNumber: {
    success: 'notification_card_number_copied',
    error: 'error_card_number_copy_failed'
  },
  securityCode: {
    success: 'notification_card_security_code_copied',
    error: 'error_card_security_code_copy_failed'
  },
  expirationDate: {
    success: 'notification_expiration_date_copied',
    error: 'error_expiration_date_copy_failed'
  }
};

/**
* Renders a single data line with copy functionality.
* @param {Object} props - The component props.
* @param {string} props.name - Display name of the field.
* @param {string} props.value - Value to copy.
* @param {string} props.displayValue - Value to display.
* @param {string} props.type - Type of the field for copy tracking.
* @param {string} props.deviceId - Device ID.
* @param {string} props.vaultId - Vault ID.
* @param {string} props.itemId - Item ID.
* @return {JSX.Element} The rendered component.
*/
const AutofillErrorItemDataLine = memo(function AutofillErrorItemDataLine (props) {
  const { name, value, displayValue, type, deviceId, vaultId, itemId } = props;

  const handleCopy = useCallback(async () => {
    const messages = COPY_MESSAGES[type] || { success: 'notification_copied', error: 'error_copy_failed' };

    try {
      await copyValue(value, deviceId, vaultId, itemId, type);
      showToast(browser.i18n.getMessage(messages.success), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage(messages.error), 'error');
      await CatchError(e);
    }
  }, [value, deviceId, vaultId, itemId, type]);

  return (
    <div className={S.autofillErrorItemContentDataLine}>
      <div className={S.autofillErrorItemContentDataLineContent}>
        <h4>{name || browser.i18n.getMessage('no_item_name')}</h4>
        <p>{displayValue || browser.i18n.getMessage('no_value')}</p>
      </div>
      <div className={S.autofillErrorItemContentDataLineActions}>
        <button
          type='button'
          onClick={handleCopy}
          title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
        >
          <CopyIcon />
        </button>
      </div>
    </div>
  );
});

/**
* Builds item data array for Login items.
* @param {Object} item - The Login item instance.
* @param {Object} decryptedSif - Decrypted secure input fields.
* @return {Array<Object>} Array of data line objects.
*/
const buildLoginData = (item, decryptedSif) => {
  return [
    {
      name: browser.i18n.getMessage('username'),
      value: item.content.username || '',
      displayValue: item.content.username || '',
      type: 'username',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    },
    {
      name: browser.i18n.getMessage('password'),
      value: decryptedSif?.password || '',
      displayValue: '••••••',
      type: 'password',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    }
  ];
};

/**
* Gets the card number display value with mask.
* @param {string|null} cardNumberMask - The last 4 digits mask.
* @return {string} The display value for card number.
*/
const getCardNumberDisplayValue = cardNumberMask => {
  if (cardNumberMask) {
    return `•••• ${cardNumberMask}`;
  }

  return '•••• ••••';
};

/**
* Builds item data array for PaymentCard items.
* @param {Object} item - The PaymentCard item instance.
* @param {Object} decryptedSif - Decrypted secure input fields.
* @return {Array<Object>} Array of data line objects.
*/
const buildPaymentCardData = (item, decryptedSif) => {
  return [
    {
      name: browser.i18n.getMessage('payment_card_cardholder'),
      value: item.content.cardHolder || '',
      displayValue: item.content.cardHolder || '',
      type: 'cardHolder',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    },
    {
      name: browser.i18n.getMessage('payment_card_card_number'),
      value: decryptedSif?.cardNumber || '',
      displayValue: getCardNumberDisplayValue(item.content.cardNumberMask),
      type: 'cardNumber',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    },
    {
      name: browser.i18n.getMessage('payment_card_security_code'),
      value: decryptedSif?.securityCode || '',
      displayValue: '•••',
      type: 'securityCode',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    },
    {
      name: browser.i18n.getMessage('payment_card_expiration_date'),
      value: decryptedSif?.expirationDate || '',
      displayValue: decryptedSif?.expirationDate || '',
      type: 'expirationDate',
      deviceId: item.deviceId,
      vaultId: item.vaultId,
      itemId: item.id
    }
  ];
};

/**
* Renders autofill error item data with copy functionality for each field.
* @param {Object} props - The component props.
* @param {Object} props.item - The item instance (Login or PaymentCard).
* @return {JSX.Element|null} The rendered component or null if no data.
*/
function AutofillErrorItemData (props) {
  const { item } = props;
  const [itemData, setItemData] = useState([]);

  useEffect(() => {
    if (!item) {
      return;
    }

    const buildItemData = async () => {
      let decryptedSif = null;

      if (item.sifExists) {
        try {
          decryptedSif = await item.decryptSif();
        } catch (e) {
          await CatchError(e);
        }
      }

      switch (item?.constructor?.name) {
        case 'Login': {
          setItemData(buildLoginData(item, decryptedSif));
          break;
        }

        case 'PaymentCard': {
          setItemData(buildPaymentCardData(item, decryptedSif));
          break;
        }

        default:
          break;
      }
    };

    buildItemData();
  }, [item]);

  if (itemData.length === 0) {
    return null;
  }

  return (
    <div className={S.autofillErrorItemContentData}>
      {itemData.map((dataLine, index) => (
        <AutofillErrorItemDataLine key={`${dataLine.type}-${index}`} {...dataLine} />
      ))}
    </div>
  );
}

export default memo(AutofillErrorItemData);
