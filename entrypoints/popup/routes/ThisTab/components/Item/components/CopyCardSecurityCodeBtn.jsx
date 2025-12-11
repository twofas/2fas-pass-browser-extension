// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import handleCardSecurityCode from '../../../functions/serviceList/handleCardSecurityCode';
import { lazy } from 'react';

const ItemCopyIcon = lazy(() => import('@/assets/popup-window/card-security-code.svg?react'));

/**
* Renders the copy security code button for payment card items.
* @param {Object} props - The component props.
* @param {Object} props.item - The payment card item object.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const CopyCardSecurityCodeBtn = ({ item, more, setMore }) => {
  if (item?.securityType === SECURITY_TIER.SECRET) {
    return (
      <button
        onClick={async () => await handleCardSecurityCode(item.deviceId, item.vaultId, item.id, more, setMore)}
        title={browser.i18n.getMessage('this_tab_copy_card_security_code')}
      >
        <ItemCopyIcon className={S.itemCopySecurityCode} />
      </button>
    );
  } else if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists) {
    return (
      <button
        onClick={async () => await handleCardSecurityCode(item.deviceId, item.vaultId, item.id, more, setMore)}
        title={browser.i18n.getMessage('this_tab_copy_card_security_code')}
      >
        <ItemCopyIcon className={S.itemCopySecurityCode} />
      </button>
    );
  } else {
    return null;
  }
};

export default CopyCardSecurityCodeBtn;
