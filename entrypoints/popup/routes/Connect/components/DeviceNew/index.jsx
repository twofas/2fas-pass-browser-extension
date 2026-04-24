// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Connect.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { memo } from 'react';
import ConnectIcon from '@/assets/connect.svg?react';
import ConnectDevicePlusIcon from '@/assets/popup-window/connect-device-plus.svg?react';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

function DeviceNew ({ onConnect }) {
  const { getMessage } = useI18n();

  return (
    <div className={S.deviceNewContainer}>
      <h1>{getMessage('connect_device_new_header')}</h1>
      <p className={S.deviceNewSubtitle}>{getMessage('connect_device_new_subtitle')}</p>

      <div className={S.deviceNewIllustration}>
        <ConnectIcon />
      </div>

      <button
        className={`${bS.btn} ${bS.btnTheme} ${S.deviceNewButton}`}
        onClick={onConnect}
      >
        <ConnectDevicePlusIcon />
        <span>{getMessage('connect_device_new_connect_button')}</span>
      </button>

      <div className={S.deviceNewInfo}>
        <InfoIcon />
        <p>{getMessage('connect_description')}</p>
      </div>
    </div>
  );
}

export default memo(DeviceNew);
