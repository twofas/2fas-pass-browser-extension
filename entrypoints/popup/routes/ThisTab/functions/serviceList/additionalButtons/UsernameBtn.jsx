// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../components/Item/styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleUsername from '../handleUsername';
import ItemUsernameIcon from '@/assets/popup-window/service-username.svg?react';

/** 
* Function to render the username button.
* @param {Object} props - The component props.
* @param {string} props.deviceId - The ID of the device.
* @param {string} props.vaultId - The ID of the vault.
* @param {number} props.itemId - The ID of the item.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const UsernameBtn = ({ deviceId, vaultId, itemId, more, setMore }) => {
  const { getMessage } = useI18n();

  return (
    <button
      onClick={async () => await handleUsername(deviceId, vaultId, itemId, more, setMore)}
      title={getMessage('this_tab_copy_username')}
    >
      <ItemUsernameIcon className={S.itemUsername} />
    </button>
  );
};

export default UsernameBtn;
