// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, useCallback } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { useI18n } from '@/partials/context/I18nContext';

/**
 * Function to render the Language component.
 * @return {JSX.Element} The rendered component.
 */
function Language () {
  const { getMessage, reloadI18n } = useI18n();
  const [lang, setLang] = useState('default');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(function loadStoredLanguage() {
    const getDefaultLang = async () => {
      try {
        const storageLang = await storage.getItem('local:lang');

        if (storageLang) {
          setLang(storageLang);
        }

        setIsInitialized(true);
      } catch (e) {
        await CatchError(e);
        setIsInitialized(true);
      }
    };

    getDefaultLang();
  }, []);

  const langOptions = [
    { value: 'default', label: getMessage('settings_language_default') },
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
    { value: 'de', label: 'Deutsch' }
  ];

  const handleLangChange = useCallback(async change => {
    if (!isInitialized) {
      return;
    }

    try {
      const value = change?.value;
      setLang(value);

      await storage.setItem('local:lang', value);
      await reloadI18n();

      logger.info(LOGGER_CONSTANTS.CATEGORIES.USER_ACTION, 'SettingsLanguage - language changed', { value });

      const tabs = await browser.tabs.query({});

      tabs.forEach(tab => {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, {
            action: REQUEST_ACTIONS.REFRESH_LANG,
            lang: value,
            target: REQUEST_TARGETS.CONTENT
          }).catch(() => {});
        }
      });

      showToast(getMessage('notification_settings_save_success'), 'success');
    } catch (e) {
      const previousValue = await storage.getItem('local:lang') || 'default';
      setLang(previousValue);

      showToast(getMessage('error_general_setting'), 'error');
      await CatchError(e);
    }
  }, [isInitialized, getMessage, reloadI18n]);

  return (
    <div className={S.settingsLanguage}>
      <h4>{getMessage('settings_language')}</h4>

      <form action="#">
        <AdvancedSelect
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={langOptions}
          value={langOptions.find(el => el.value === lang)}
          onChange={handleLangChange}
          isDisabled={!isInitialized}
        />
      </form>
    </div>
  );
}

export default Language;
