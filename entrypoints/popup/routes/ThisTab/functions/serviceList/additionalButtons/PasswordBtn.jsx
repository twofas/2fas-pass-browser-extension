// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../components/Item/styles/Item.module.scss';
import { useI18n } from '@/partials/context/I18nContext';
import handlePassword from '../handlePassword';
import { useState, useRef, useLayoutEffect } from 'react';
import getLoaderProgress from '@/partials/functions/getLoaderProgress';
import { PULL_REQUEST_TYPES } from '@/constants';
import Login from '@/models/itemModels/Login';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import ItemFetchIcon from '@/assets/popup-window/service-fetch.svg?react';
import ItemPasswordIcon from '@/assets/popup-window/service-password.svg?react';

/**
* Function to render the password button.
* @param {Object} props - The component props.
* @param {Object} props.item - The item object.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const PasswordBtn = ({ item, more, setMore }) => {
  const { getMessage } = useI18n();
  const [scheduledTime, setScheduledTime] = useState(false);
  const loaderRef = useRef(null);
  const intervalIdRef = useRef(0);

  const getItemAlarm = async () => {
    if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists) {
      let alarmTime;

      try {
        alarmTime = await browser.alarms.get(`sifT2Reset-${item.deviceId}|${item.vaultId}|${item.id}`);
      } catch {
        return false;
      }

      if (!alarmTime) {
        return false;
      }

      setScheduledTime(alarmTime.scheduledTime);

      return true;
    } else {
      return false;
    }
  };

  const updateProgress = () => {
    if (!scheduledTime || !loaderRef.current) {
      return;
    }

    const maxTime = item.internalData.sifResetTime ? item.internalData.sifResetTime * 60 * 1000 : config.passwordResetDelay * 60 * 1000;
    const leftTime = maxTime - (scheduledTime - Date.now());
    const percentTime = Math.round((leftTime / maxTime) * 100);
    const progress = getLoaderProgress(100 - percentTime);

    loaderRef.current.style.strokeDashoffset = progress;

    if (percentTime >= 100) {
      clearInterval(intervalIdRef.current);
    }
  };

  useLayoutEffect(() => {
    let isMounted = true;
    let localIntervalId = null;

    getItemAlarm()
      .then(ok => {
        if (!isMounted) {
          return;
        }

        if (ok) {
          updateProgress();
          localIntervalId = setInterval(() => {
            updateProgress();
          }, 1000);
          intervalIdRef.current = localIntervalId;
        }
      });

    return () => {
      isMounted = false;

      if (localIntervalId !== null) {
        clearInterval(localIntervalId);
        localIntervalId = null;
      }

      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [item, scheduledTime]);

  if (item?.securityType === SECURITY_TIER.SECRET) {
    return (
      <button
        onClick={async () => await handlePassword(item.deviceId, item.vaultId, item.id, more, setMore)}
        title={getMessage('this_tab_copy_password')}
      >
        <ItemPasswordIcon className={S.itemPassword} />
      </button>
    );
  } else if (item?.securityType === SECURITY_TIER.HIGHLY_SECRET && item?.sifExists) {
    return (
      <button
        onClick={async () => await handlePassword(item.deviceId, item.vaultId, item.id, more, setMore)}
        title={getMessage('this_tab_copy_password')}
        className={S.itemPasswordLoader}
      >
        <svg
          ref={loaderRef}
          className={S.itemLoader}
          viewBox="0 0 96 96"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="48" cy="48" r="42" className={S.itemLoaderBg} />
          <circle cx="48" cy="48" r="42" />
        </svg>
        <ItemPasswordIcon className={S.itemPassword} />
      </button>
    );
  } else {
    return (
      <ClearLink
        to='/fetch'
        state={{
          action: PULL_REQUEST_TYPES.SIF_REQUEST,
          from: 'service',
          data: {
            itemId: item.id,
            deviceId: item.deviceId,
            vaultId: item.vaultId,
            contentType: Login.contentType
          }
        }}
        onClick={() => { if (more) { setMore(false); } }}
        title={getMessage('this_tab_fetch_password')}
        prefetch='intent'
      >
        <ItemFetchIcon className={S.itemFetch} />
      </ClearLink>
    );
  }
};

export default PasswordBtn;
