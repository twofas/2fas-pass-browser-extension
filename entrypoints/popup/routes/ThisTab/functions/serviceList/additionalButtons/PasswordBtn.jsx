// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../../ThisTab.module.scss';
import handlePassword from '../handlePassword';
import { Link } from 'react-router';
import { useEffect, useState, useRef, lazy } from 'react';
import getLoaderProgress from '@/partials/functions/getLoaderProgress';
import { PULL_REQUEST_TYPES } from '@/constants';
import Login from '@/partials/models/Login';

const ServiceFetchIcon = lazy(() => import('@/assets/popup-window/service-fetch.svg?react'));
const ServicePasswordIcon = lazy(() => import('@/assets/popup-window/service-password.svg?react'));

const maxTime = config.passwordResetDelay * 60 * 1000;

/**
* Function to render the password button.
* @param {Object} props - The component props.
* @param {Object} props.login - The login object.
* @param {boolean} props.more - Indicates if more actions are available.
* @param {function} props.setMore - Function to update the more state.
* @return {JSX.Element} The rendered button element.
*/
const PasswordBtn = ({ login, more, setMore }) => {
  const [scheduledTime, setScheduledTime] = useState(false);
  const loaderRef = useRef(null);
  const intervalIdRef = useRef(0);

  const getLoginAlarm = async () => {
    if (login?.securityType === SECURITY_TIER.HIGHLY_SECRET && login?.sifExists) {
      let alarmTime;

      try {
        alarmTime = await browser.alarms.get(`sifT2Reset-${login.id}`);
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

    const leftTime = maxTime - (scheduledTime - Date.now());
    const percentTime = Math.round((leftTime / maxTime) * 100);
    const progress = getLoaderProgress(100 - percentTime);

    loaderRef.current.style.strokeDashoffset = progress;

    if (percentTime >= 100) {
      clearInterval(intervalIdRef.current);
    }
  };

  useEffect(() => {
    getLoginAlarm()
      .then(ok => {
        if (ok) {
          updateProgress();

          intervalIdRef.current = setInterval(() => {
            updateProgress();
          }, 1000);
        }
      });

    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [login, scheduledTime]);

  if (login?.securityType === SECURITY_TIER.SECRET) {
    return (
      <button
        onClick={async () => await handlePassword(login.id, more, setMore)}
        title={browser.i18n.getMessage('this_tab_copy_password')}
      >
        <ServicePasswordIcon className={S.servicePassword} />
      </button>
    );
  } else if (login?.securityType === SECURITY_TIER.HIGHLY_SECRET && login?.sifExists) {
    return (
      <button
        onClick={async () => await handlePassword(login.id, more, setMore)}
        title={browser.i18n.getMessage('this_tab_copy_password')}
        className={S.servicePasswordLoader}
      >
        <svg
          ref={loaderRef}
          className={S.serviceLoader}
          viewBox="0 0 96 96"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="48" cy="48" r="42" className={S.serviceLoaderBg} />
          <circle cx="48" cy="48" r="42" />
        </svg>
        <ServicePasswordIcon className={S.servicePassword} />
      </button>
    );
  } else {
    return (
      <Link
        to='/fetch'
        state={{
          action: PULL_REQUEST_TYPES.SIF_REQUEST,
          from: 'service',
          data: {
            itemId: login.id,
            deviceId: login.deviceId,
            vaultId: login.vaultId,
            contentType: Login.contentType
          }
        }}
        onClick={() => { if (more) { setMore(false); } }}
        title={browser.i18n.getMessage('this_tab_fetch_password')}
        prefetch='intent'
      >
        <ServiceFetchIcon className={S.serviceFetch} />
      </Link>
    );
  }
};

export default PasswordBtn;
