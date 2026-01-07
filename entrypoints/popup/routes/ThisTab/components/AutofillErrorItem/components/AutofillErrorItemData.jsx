// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/AutofillErrorItem.module.scss';
import { memo, useState, useEffect } from 'react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { copyValue } from '@/partials/functions';

function AutofillErrorItemDataLine (props) {
  const handleCopy = async props => {
    // @TODO: encrypted values

    try {
      await copyValue(props.value, props.deviceId, props.vaultId, props.itemId, props.type);
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  return (
    <div className={S.autofillErrorItemContentDataLine}>
      <div className={S.autofillErrorItemContentDataLineContent}>
        <h4>{props?.name || browser.i18n.getMessage('no_item_name')}</h4>
        <p>{props?.type === 'password' ? '••••••••' : props?.value}</p>
      </div>
      <div className={S.autofillErrorItemContentDataLineActions}>
        <button onClick={() => handleCopy(props)} title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}>
          <CopyIcon />
        </button>
      </div>
    </div>
  );
}

/**
* Function to render an autofill error item data.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AutofillErrorItemData (props) {
  console.log(props.item);
  const [itemData, setItemData] = useState([]);

  useEffect(() => {
    switch (props?.item?.constructor?.name) {
      case 'Login': {
        const loginData = [];

        loginData.push({
          name: browser.i18n.getMessage('username'),
          value: props.item.content.username || browser.i18n.getMessage('no_value'),
          type: 'username',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        loginData.push({
          name: browser.i18n.getMessage('password'),
          value: props.item.content.s_password || browser.i18n.getMessage('no_value'),
          type: 'password',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        setItemData(loginData);

        break;
      }

      case 'PaymentCard': {
        const cardData = [];

        cardData.push({
          name: browser.i18n.getMessage('payment_card_cardholder'),
          value: props.item.content.cardholder_name || null,
          type: 'cardHolder',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        cardData.push({
          name: browser.i18n.getMessage('payment_card_card_number'),
          value: props.item.content.card_number || null,
          type: 'cardNumber',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        cardData.push({
          name: browser.i18n.getMessage('payment_card_security_code'),
          value: props.item.content.cvv || null,
          type: 'securityCode',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        cardData.push({
          name: browser.i18n.getMessage('payment_card_expiration_date'),
          value: props.item.content.expiration_date || null,
          type: 'expirationDate',
          deviceId: props.item.deviceId,
          vaultId: props.item.vaultId,
          itemId: props.item.id
        });

        setItemData(cardData);

        break;
      }

      default: break;
    }
  }, []);

  if (itemData.length === 0) {
    return null;
  }

  return (
    <div className={S.autofillErrorItemContentData}>
      {itemData.map((dataLine, index) => {
        return <AutofillErrorItemDataLine key={index} {...dataLine} />;
      })}
    </div>
  );
}

export default memo(AutofillErrorItemData);
