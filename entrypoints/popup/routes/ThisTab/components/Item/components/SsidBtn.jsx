// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleSsid from '../../../functions/serviceList/handleSsid';
import ItemSsidIcon from '@/assets/popup-window/items/wifi.svg?react';

/**
* Function to render the SSID copy button.
* @param {Object} props - The component props.
* @param {string} props.deviceId - The ID of the device.
* @param {string} props.vaultId - The ID of the vault.
* @param {string} props.itemId - The ID of the item.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const SsidBtn = ({ deviceId, vaultId, itemId, more, setMore }) => {
  const { getMessage } = useI18n();

  return (
    <button
      onClick={async () => await handleSsid(deviceId, vaultId, itemId, more, setMore)}
      title={getMessage('this_tab_copy_ssid')}
    >
      <ItemSsidIcon className={S.itemSsid} />
    </button>
  );
};

export default SsidBtn;
