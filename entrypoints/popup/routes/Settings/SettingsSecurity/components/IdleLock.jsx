// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, lazy } from 'react';
import isPaidDeviceConnected from '@/partials/functions/isPaidDeviceConnected';
import PremiumLockIcon from '@/assets/popup-window/premium-lock.svg?react';
import setIdleInterval from '@/partials/functions/setIdleInterval';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

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
    const getPremium = async () => {
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
      getPremium().then(getDefaultIdleLock);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const idleLockOptions = [
    {
      value: 'default',
      label: premium ? browser.i18n.getMessage('settings_only_on_restart') : <span title={browser.i18n.getMessage('notification_idle_lock_premium_only')}><PremiumLockIcon /> {browser.i18n.getMessage('settings_only_on_restart')}</span>,
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
      
      setIdleInterval(value);
      setIL(value);

      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
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
        <AdvancedSelect
          className='react-select-container react-select-idle-lock-container'
          classNamePrefix='react-select'
          classNames={{ menuPortal: () => 'react-select-idle-lock__menu-portal' }}
          isSearchable={false}
          options={idleLockOptions}
          defaultValue={idleLockOptions.find(el => el.value === iL)}
          onChange={handleIdleLockChange}
          disabled={disabled ? 'disabled' : ''}
        />
      </form>
      <Tooltip>
        <h4>{browser.i18n.getMessage('settings_idle_lock_tooltip_1')}</h4>
        <h5>{browser.i18n.getMessage('settings_idle_lock_tooltip_2')}</h5>
        <p>{browser.i18n.getMessage('settings_idle_lock_tooltip_3')}</p>
      </Tooltip>
    </div>
  );
}

export default IdleLock;
