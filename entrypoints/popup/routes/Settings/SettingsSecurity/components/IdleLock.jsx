// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import Select from 'react-select';
import { useEffect, useState, lazy } from 'react';
import isPaidDeviceConnected from '@/partials/functions/isPaidDeviceConnected';
import PremiumLockIcon from '@/assets/popup-window/premium-lock.svg?react';

const Tooltip = lazy(() => import('@/entrypoints/popup/components/Tooltip'));

/**
* Function to render the Idle Lock component.
* @return {JSX.Element} The rendered component.
*/
function IdleLock () {
  if (import.meta.env.BROWSER === 'safari') {
    return null;
  }
  
  const [loading, setLoading] = useState(true);
  const [iL, setIL] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    const getExpirationDates = async () => {
      const paidDeviceConnected = await isPaidDeviceConnected();
      setPremium(paidDeviceConnected);
    };

    const getDefaultIdleLock = async () => {
      let storageIdleLock = await storage.getItem('local:autoIdleLock');

      if (storageIdleLock === null) {
        storageIdleLock = config.defaultStorageIdleLock;
        await storage.setItem('local:autoIdleLock', storageIdleLock);
      }

      setIL(storageIdleLock);
      setLoading(false);
      setDisabled(false);
    };

    try {
      getExpirationDates().then(getDefaultIdleLock);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const idleLockOptions = [
    {
      value: 'default',
      label: premium ? browser.i18n.getMessage('settings_only_on_restart') : <span title={browser.i18n.getMessage('notification_idle_lock_premium_only')}><PremiumLockIcon /> Only on restart</span>,
      isDisabled: !premium,
    },
    { value: 1, label: browser.i18n.getMessage('settings_after_1_minute') },
    { value: 5, label: browser.i18n.getMessage('settings_after_5_minutes') },
    { value: 15, label: browser.i18n.getMessage('settings_after_15_minutes') },
    { value: 30, label: browser.i18n.getMessage('settings_after_30_minutes') },
    { value: 60, label: browser.i18n.getMessage('settings_after_60_minutes') },
  ];

  const handleIdleLockChange = async change => {
    setDisabled(true);

    try {
      const value = change?.value;
      await storage.setItem('local:autoIdleLock', value);

      if (value === 'default') {
        browser.idle.setDetectionInterval(15 * 60);
      } else {
        browser.idle.setDetectionInterval(value * 60);
      }

      setIL(value);

      showToast(browser.i18n.getMessage('notification_idle_lock_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_idle_lock_saving'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsIdleLock}>
      <h4>{browser.i18n.getMessage('settings_idle_lock_header')}</h4>
      <p>{browser.i18n.getMessage('settings_idle_lock_description')}</p>
    
      <form action="#" className={S.settingsIdleLockForm}>
        <Select
          className='react-select-idle-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={idleLockOptions}
          defaultValue={idleLockOptions.find(el => el.value === iL)}
          onChange={handleIdleLockChange}
          disabled={disabled ? 'disabled' : ''}
        />
      </form>
      <Tooltip>
        <h4>{browser.i18n.getMessage('settings_auto_clear_clipboard_tooltip_1')}</h4>
        <h5>{browser.i18n.getMessage('settings_auto_clear_clipboard_tooltip_2')}</h5>
        <p>{browser.i18n.getMessage('settings_auto_clear_clipboard_tooltip_3')}</p>
      </Tooltip>
    </div>
  );
}

export default IdleLock;
