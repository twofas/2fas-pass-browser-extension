// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleCardSecurityCode from '../functions/handleCardSecurityCode';
import CopyTooltip from '@/entrypoints/popup/components/CopyTooltip';
import ItemCopyIcon from '@/assets/popup-window/card-security-code.svg?react';

/**
* Renders the copy security code button for payment card items.
* @param {Object} props - The component props.
* @param {Object} props.item - The payment card item object.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const CopyCardSecurityCodeBtn = ({ item, more, setMore }) => {
  const { getMessage } = useI18n();
  const isEmpty = !item?.securityCodeExists;

  if (item?.securityType === SECURITY_TIER.SECRET) {
    return (
      <CopyTooltip text={getMessage('this_tab_copy_disabled_no_security_code')} active={isEmpty} position='bottom'>
        <button
          onClick={async () => await handleCardSecurityCode(item.deviceId, item.vaultId, item.id, more, setMore)}
          title={isEmpty ? undefined : getMessage('this_tab_copy_card_security_code')}
          disabled={isEmpty}
        >
          <ItemCopyIcon className={S.itemCopySecurityCode} />
        </button>
      </CopyTooltip>
    );
  } else if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists) {
    return (
      <CopyTooltip text={getMessage('this_tab_copy_disabled_no_security_code')} active={isEmpty} position='bottom'>
        <button
          onClick={async () => await handleCardSecurityCode(item.deviceId, item.vaultId, item.id, more, setMore)}
          title={isEmpty ? undefined : getMessage('this_tab_copy_card_security_code')}
          disabled={isEmpty}
        >
          <ItemCopyIcon className={S.itemCopySecurityCode} />
        </button>
      </CopyTooltip>
    );
  } else {
    return null;
  }
};

export default CopyCardSecurityCodeBtn;
