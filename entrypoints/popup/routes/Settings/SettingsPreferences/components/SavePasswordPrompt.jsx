// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import MenuArrowIcon from '@/assets/popup-window/menu-arrow.svg?react';

/**
* Function to render the Save Password Prompt component.
* @return {JSX.Element} The rendered component.
*/
function SavePasswordPrompt () {
  const { getMessage } = useI18n();

  if (import.meta.env.BROWSER === 'safari') {
    return null; // Safari does not support this feature
  }

  const [sP, setSP] = useState('default');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeSavePrompt = async () => {
      try {
        let storageSavePasswordPrompt = await storage.getItem('local:savePrompt');

        if (!storageSavePasswordPrompt) {
          storageSavePasswordPrompt = 'default';
          await storage.setItem('local:savePrompt', storageSavePasswordPrompt);
        } else {
          setSP(storageSavePasswordPrompt);
        }

        browser.privacy.services.passwordSavingEnabled.set({
          value: storageSavePasswordPrompt === 'browser'
        }).catch(() => {});

        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    initializeSavePrompt();
  }, []);

  const promptOptions = [
    { value: 'default', label: getMessage('settings_save_prompt_pass') },
    { value: 'default_encrypted', label: getMessage('settings_save_prompt_pass_encrypted') },
    { value: 'browser', label: getMessage('settings_save_prompt_browser') },
    { value: 'none', label: getMessage('settings_save_prompt_none') },
  ];

  const handleSavePasswordPromptChange = useCallback(async change => {
    const value = change?.value;

    if (!value || !isInitialized) {
      return;
    }

    try {
      setSP(value);
      await storage.setItem('local:savePrompt', value);

      browser.privacy.services.passwordSavingEnabled.set({
        value: value === 'browser'
      }).catch(() => {});

      showToast(getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:savePrompt') || 'default';
      setSP(previousValue);

      showToast(getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [isInitialized]);

  return (
    <div className={S.settingsSavePasswordPrompt}>
      <h4>{getMessage('settings_save_prompt_header')}</h4>
      <p>{getMessage('settings_save_prompt_description')}</p>

      <form action="#" className={S.settingsSavePasswordPromptForm}>
        <AdvancedSelect
          className='react-select-container'
          classNamePrefix='react-select'
          classNames={{ menuPortal: () => 'react-select-save-prompt__menu-portal' }}
          isSearchable={false}
          options={promptOptions}
          value={promptOptions.find(el => el.value === sP)}
          onChange={handleSavePasswordPromptChange}
          isDisabled={!isInitialized}
        />
      </form>

      {sP === 'default' || sP === 'default_encrypted' ? (
        <ClearLink
          to='/settings/preferences/save-login-excluded-domains'
          className={S.settingsSavePasswordPromptExcludedDomainsLink}
          prefetch='intent'
        >
          <span>{getMessage('settings_excluded_domains')}</span>
          <MenuArrowIcon />
        </ClearLink>
      ) : null}
    </div>
  );
}

export default SavePasswordPrompt;
