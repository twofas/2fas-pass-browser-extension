// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handleSsid from '../functions/handleSsid';
import CopyTooltip from '@/entrypoints/popup/components/CopyTooltip';
import ItemSsidIcon from '@/assets/popup-window/items/wifi.svg?react';

/**
* Function to render the SSID copy button.
* @param {Object} props - The component props.
* @param {string} props.deviceId - The ID of the device.
* @param {string} props.vaultId - The ID of the vault.
* @param {string} props.itemId - The ID of the item.
* @param {string} props.ssid - The network name (SSID) stored in the item.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const CopySsidBtn = ({ deviceId, vaultId, itemId, ssid, more, setMore }) => {
  const { getMessage } = useI18n();
  const isEmpty = !ssid || ssid.length === 0;

  return (
    <CopyTooltip text={getMessage('this_tab_copy_disabled_no_ssid')} active={isEmpty} position='bottom'>
      <button
        onClick={async () => await handleSsid(deviceId, vaultId, itemId, more, setMore)}
        title={isEmpty ? undefined : getMessage('this_tab_copy_ssid')}
        disabled={isEmpty}
      >
        <ItemSsidIcon className={S.itemSsid} />
      </button>
    </CopyTooltip>
  );
};

export default CopySsidBtn;
