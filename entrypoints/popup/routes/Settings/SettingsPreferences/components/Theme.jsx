// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import Select from 'react-select';
import { useEffect, useState } from 'react';

/**
* Function to render the Theme component.
* @return {JSX.Element} The rendered component.
*/
function Theme (props) {
  const [loading, setLoading] = useState(true);
  const [t, setT] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getDefaultTheme = async () => {
      const storageTheme = await storage.getItem('local:theme');
      setT(storageTheme);
      setLoading(false);
      setDisabled(false);

      if (props.onLoad) {
        props.onLoad();
      }
    };

    try {
      getDefaultTheme();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const themeOptions = [
    { value: 'unset', label: browser.i18n.getMessage('unset_mode') },
    { value: 'light', label: browser.i18n.getMessage('light_mode') },
    { value: 'dark', label: browser.i18n.getMessage('dark_mode') }
  ];

  const handleThemeChange = async change => {
    setDisabled(true);

    try {
      const value = change?.value;
      await storage.setItem('local:theme', value);
      setT(value);

      document.body.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.body.classList.add(`theme-${value}`);

      document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-unset');
      document.documentElement.classList.add(`theme-${value}`);

      showToast(browser.i18n.getMessage('notification_theme_setting_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_setting_theme_value'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsTheme}>
      <h4>{browser.i18n.getMessage('settings_theme')}</h4>

      <form action="#">
        <Select
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={themeOptions}
          defaultValue={themeOptions.find(el => el.value === t)}
          onChange={handleThemeChange}
          disabled={disabled ? 'disabled' : ''}
        />
      </form>
    </div>
  );
}

export default Theme;
