// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleUsername from '../functions/handleUsername';
import CopyTooltip from '@/entrypoints/popup/components/CopyTooltip';
import ItemUsernameIcon from '@/assets/popup-window/service-username.svg?react';

/**
* Function to render the username button.
* @param {Object} props - The component props.
* @param {string} props.deviceId - The ID of the device.
* @param {string} props.vaultId - The ID of the vault.
* @param {number} props.itemId - The ID of the item.
* @param {string} props.username - The username stored in the item.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const CopyUsernameBtn = ({ deviceId, vaultId, itemId, username, more, setMore }) => {
  const { getMessage } = useI18n();
  const isEmpty = !username || username.length === 0;

  return (
    <CopyTooltip text={getMessage('this_tab_copy_disabled_no_username')} active={isEmpty} position='bottom'>
      <button
        onClick={async () => await handleUsername(deviceId, vaultId, itemId, more, setMore)}
        title={isEmpty ? undefined : getMessage('this_tab_copy_username')}
        disabled={isEmpty}
      >
        <ItemUsernameIcon className={S.itemUsername} />
      </button>
    </CopyTooltip>
  );
};

export default CopyUsernameBtn;
