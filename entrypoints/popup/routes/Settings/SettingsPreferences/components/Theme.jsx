// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, useCallback } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

/**
* Function to render the Theme component.
* @return {JSX.Element} The rendered component.
*/
function Theme () {
  const [t, setT] = useState('unset');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const getDefaultTheme = async () => {
      try {
        const storageTheme = await storage.getItem('local:theme');

        if (storageTheme) {
          setT(storageTheme);
        }

        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    getDefaultTheme();
  }, []);

  const themeOptions = [
    { value: 'unset', label: browser.i18n.getMessage('unset_mode') },
    { value: 'light', label: browser.i18n.getMessage('light_mode') },
    { value: 'dark', label: browser.i18n.getMessage('dark_mode') }
  ];

  const handleThemeChange = useCallback(async change => {
    if (!isInitialized) {
      return;
    }

    try {
      const value = change?.value;
      setT(value);

      document.body.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.body.classList.add(`theme-${value}`);

      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.documentElement.classList.add(`theme-${value}`);

      await storage.setItem('local:theme', value);

      const tabs = await browser.tabs.query({});

      tabs.forEach(tab => {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            action: REQUEST_ACTIONS.REFRESH_THEME,
            theme: value,
            target: REQUEST_TARGETS.CONTENT
          }).catch(() => {});
        }
      });

      showToast(browser.i18n.getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:theme') || 'unset';
      setT(previousValue);

      document.body.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.body.classList.add(`theme-${previousValue}`);

      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.documentElement.classList.add(`theme-${previousValue}`);

      showToast(browser.i18n.getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [isInitialized]);

  return (
    <div className={S.settingsTheme}>
      <h4>{browser.i18n.getMessage('settings_theme')}</h4>

      <form action="#">
        <AdvancedSelect
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={themeOptions}
          value={themeOptions.find(el => el.value === t)}
          onChange={handleThemeChange}
          isDisabled={!isInitialized}
        />
      </form>
    </div>
  );
}

export default Theme;
