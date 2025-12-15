// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Settings.module.scss';
import { useEffect, useState, lazy } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';

const Tooltip = lazy(() => import('@/entrypoints/popup/components/Tooltip'));

/**
* Function to render the Auto Clear Clipboard component.
* @return {JSX.Element} The rendered component.
*/
function AutoClearClipboard () {
  const [loading, setLoading] = useState(true);
  const [cC, setCC] = useState(null);
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const getDefaultClearClipboard = async () => {
      let storageAutoClearClipboard = await storage.getItem('local:autoClearClipboard');

      if (storageAutoClearClipboard === null) {
        storageAutoClearClipboard = 'default';
      }

      setCC(storageAutoClearClipboard);
      setLoading(false);
      setDisabled(false);
    };

    try {
      getDefaultClearClipboard();
    } catch (e) {
      CatchError(e);
    }
  }, []);

  const autoClearClipboardOptions = [
    { value: 'default', label: browser.i18n.getMessage('settings_don_t_clear') },
    { value: 1, label: browser.i18n.getMessage('settings_after_1_minute') },
    { value: 5, label: browser.i18n.getMessage('settings_after_5_minutes') },
    { value: 15, label: browser.i18n.getMessage('settings_after_15_minutes') },
    { value: 30, label: browser.i18n.getMessage('settings_after_30_minutes') }
  ];

  const handleAutoClearClipboardChange = async change => {
    setDisabled(true);

    if (change.value !== 'default' && import.meta.env.BROWSER !== 'safari') {
      const clipboardReadPermission = await browser.permissions.request({ permissions: ['clipboardRead'] });
      
      if (!clipboardReadPermission) {
        showToast(browser.i18n.getMessage('error_auto_clear_clipboard_permission_denied'), 'error');
        setDisabled(false);
        return;
      }
    }

    try {
      const value = change?.value;
      await storage.setItem('local:autoClearClipboard', value);
      setCC(value);

      showToast(browser.i18n.getMessage('notification_auto_clear_clipboard_success'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_auto_clear_clipboard_saving'), 'error');
      await CatchError(e);
    } finally {
      setDisabled(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={S.settingsClearClipboard}>
      <h4>{browser.i18n.getMessage('settings_auto_clear_clipboard_header')}</h4>
      <p>{browser.i18n.getMessage('settings_auto_clear_clipboard_description')}</p>
    
      <form action="#" className={S.settingsClearClipboardForm}>
        <AdvancedSelect
          className='react-select-container'
          classNamePrefix='react-select'
          isSearchable={false}
          options={autoClearClipboardOptions}
          value={autoClearClipboardOptions.find(el => el.value === cC)}
          onChange={handleAutoClearClipboardChange}
          disabled={disabled ? 'disabled' : ''}
        />
      </form>
      <Tooltip type='bottom'>
        <h4>{browser.i18n.getMessage('settings_idle_lock_tooltip_1')}</h4>
        <h5>{browser.i18n.getMessage('settings_idle_lock_tooltip_2')}</h5>
        <p>{browser.i18n.getMessage('settings_idle_lock_tooltip_3')}</p>
      </Tooltip>
    </div>
  );
}

export default AutoClearClipboard;
