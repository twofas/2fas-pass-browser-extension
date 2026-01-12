// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/TwofasNotification/TwofasNotification.scss';
import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useEffect, useState, useCallback } from 'react';
import TwofasNotification from '@/partials/TwofasNotification';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

/**
* Function to render the Push component.
* @return {JSX.Element} The rendered component.
*/
function Push () {
  const defaultPushValue = import.meta.env.BROWSER === 'safari' ? false : true;
  const [push, setPush] = useState(defaultPushValue);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getNativePush = async () => {
      try {
        let storageNativePush = await storage.getItem('local:nativePush');

        if (storageNativePush === null) {
          storageNativePush = defaultPushValue;
          await storage.setItem('local:nativePush', storageNativePush);
        }

        setPush(storageNativePush);
        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    getNativePush();
  }, [defaultPushValue]);

  const pushOptions = [
    { value: true, label: browser.i18n.getMessage('settings_push_native') },
    { value: false, label: browser.i18n.getMessage('settings_push_custom') }
  ];

  const handlePushChange = useCallback(async change => {
    if (!isInitialized) {
      return;
    }

    try {
      const value = change?.value;
      setPush(value);

      await storage.setItem('local:nativePush', value);
      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:nativePush') || defaultPushValue;
      setPush(previousValue);

      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [isInitialized, defaultPushValue]);

  const handlePushTest = useCallback(() => {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_test_title'),
      Message: browser.i18n.getMessage('notification_test_message')
    });
  }, []);

  if (import.meta.env.BROWSER === 'safari') {
    return null;
  }

  return (
    <div className={S.settingsPush}>
      <h4>{browser.i18n.getMessage('settings_notifications_header')}</h4>
      <p>{browser.i18n.getMessage('settings_notifications_description')}</p>

      <form action="#" className={S.settingsPushForm}>
        <AdvancedSelect
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={pushOptions}
          value={pushOptions.find(el => el.value === push)}
          onChange={handlePushChange}
          isDisabled={!isInitialized}
        />
      </form>

      <button
        className={`${bS.btn} ${bS.btnClear} ${bS.btnPushTest}`}
        onClick={handlePushTest}
        disabled={!isInitialized ? 'disabled' : ''}
      >
        {browser.i18n.getMessage('settings_notifications_send_test')}
      </button>
    </div>
  );
}

export default Push;
