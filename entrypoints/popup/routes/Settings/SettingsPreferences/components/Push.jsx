// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/TwofasNotification/TwofasNotification.scss';
import S from '../../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import Select from 'react-select';
import { useEffect, useState } from 'react';
import TwofasNotification from '@/partials/TwofasNotification';

/**
* Function to render the Push component.
* @return {JSX.Element} The rendered component.
*/
function Push (props) {
  const [loading, setLoading] = useState(true);
  const [push, setPush] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getNativePush = async () => {
      let storageNativePush = await storage.getItem('local:nativePush');

      if (storageNativePush === null) {
        storageNativePush = import.meta.env.BROWSER === 'safari' ? false : true;
      }

      setPush(storageNativePush);
      await storage.setItem('local:nativePush', storageNativePush);

      setLoading(false);
      setDisabled(false);

      if (props.onLoad) {
        props.onLoad();
      }
    };

    try {
      getNativePush();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const pushOptions = [
    { value: true, label: browser.i18n.getMessage('settings_push_native') },
    { value: false, label: browser.i18n.getMessage('settings_push_custom') }
  ];

  const handlePushChange = async change => {
    setDisabled(true);

    try {
      const value = change?.value;
      await storage.setItem('local:nativePush', value);
      setPush(value);
      showToast(browser.i18n.getMessage('settings_push_notifications_changing_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_saving_notification_settings'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };
  
  const handlePushTest = () => {
    return TwofasNotification.show({
      Title: browser.i18n.getMessage('notification_test_title'),
      Message: browser.i18n.getMessage('notification_test_message')
    });
  };

  if (import.meta.env.BROWSER === 'safari' || loading) {
    return null;
  }

  return (
    <div className={S.settingsPush}>
      <h4>{browser.i18n.getMessage('settings_notifications_header')}</h4>
      <p>{browser.i18n.getMessage('settings_notifications_description')}</p>

      <form action="#" className={S.settingsPushForm}>
        <Select
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={pushOptions}
          defaultValue={pushOptions.find(el => el.value === push)}
          onChange={handlePushChange}
        />
      </form>

      <button
        className={`${bS.btn} ${bS.btnClear} ${bS.btnPushTest}`}
        onClick={handlePushTest}
        disabled={disabled ? 'disabled' : ''}
      >
        {browser.i18n.getMessage('settings_notifications_send_test')}
      </button>
    </div>
  );
}

export default Push;
