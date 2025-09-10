// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, lazy } from 'react';
import Select from 'react-select';
import { Link } from 'react-router';

const MenuArrowIcon = lazy(() => import('@/assets/popup-window/menu-arrow.svg?react'));

/**
* Function to render the Save Password Prompt component.
* @return {JSX.Element} The rendered component.
*/
function SavePasswordPrompt () {
  if (import.meta.env.BROWSER === 'safari') {
    return null; // Safari does not support this feature
  }

  const [loading, setLoading] = useState(true);
  const [sP, setSP] = useState(null);

  useEffect(() => {
    const getDefaultSavePasswordPrompt = async () => {
      // default, default_encrypted, browser, none
      let storageSavePasswordPrompt = await storage.getItem('local:savePrompt');

      if (!storageSavePasswordPrompt) {
        storageSavePasswordPrompt = 'default';
        await storage.setItem('local:savePrompt', storageSavePasswordPrompt);
      }

      await browser.privacy.services.passwordSavingEnabled.set({ value: storageSavePasswordPrompt === 'browser' });

      setSP(storageSavePasswordPrompt);
      setLoading(false);
    };

    try {
      getDefaultSavePasswordPrompt();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const promptOptions = [
    { value: 'default', label: browser.i18n.getMessage('settings_save_prompt_pass') },
    { value: 'default_encrypted', label: browser.i18n.getMessage('settings_save_prompt_pass_encrypted') },
    { value: 'browser', label: browser.i18n.getMessage('settings_save_prompt_browser') },
    { value: 'none', label: browser.i18n.getMessage('settings_save_prompt_none') },
  ];

  const handleSavePasswordPromptChange = async change => {
    try {
      const value = change?.value;
      await storage.setItem('local:savePrompt', value);

      await browser.privacy.services.passwordSavingEnabled.set({ value: value === 'browser' });

      setSP(value);
      showToast(browser.i18n.getMessage('notification_save_password_prompt_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_save_password_prompt_saving'), 'error');
      await CatchError(e);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsSavePasswordPrompt}>
      <h4>{browser.i18n.getMessage('settings_save_prompt_header')}</h4>
      <p>{browser.i18n.getMessage('settings_save_prompt_description')}</p>

      <form action="#" className={S.settingsSavePasswordPromptForm}>
        <Select
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={promptOptions}
          defaultValue={promptOptions.find(el => el.value === sP)}
          onChange={handleSavePasswordPromptChange}
        />
      </form>

      {sP === 'default' || sP === 'default_encrypted' ? (
        <Link
          to='/settings-save-login-excluded-domains'
          className={S.settingsSavePasswordPromptExcludedDomainsLink}
          prefetch='intent'
        >
          <span>{browser.i18n.getMessage('settings_excluded_domains')}</span>
          <MenuArrowIcon />
        </Link>
      ) : null}
    </div>
  );
}

export default SavePasswordPrompt;
