// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Link, useNavigate } from 'react-router';
import { lazy } from 'react';

const CancelIcon = lazy(() => import('@/assets/popup-window/cancel.svg?react'));
const WarningIconLight = lazy(() => import('@/assets/popup-window/warning-light.svg?react'));
const WarningIconDark = lazy(() => import('@/assets/popup-window/warning-dark.svg?react'));
const SettingsBack = lazy(() => import('../components/SettingsBack'));

/**
* Function to reset the extension.
* @async
* @return {Promise<void>} A promise that resolves when the extension is reset.
*/
const resetExtension = async () => {
  const res = await browser.runtime.sendMessage({
    action: REQUEST_ACTIONS.RESET_EXTENSION,
    target: REQUEST_TARGETS.BACKGROUND
  });

  if (res.status === 'error') {
    showToast(browser.i18n.getMessage('error_general'), 'error');
  }

  if (window && typeof window?.close === 'function' && import.meta.env.BROWSER !== 'safari') {
    window.close();
    return;
  }
};

/** 
* Function to render the SettingsReset component.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered component.
*/
function SettingsReset (props) {
  const navigate = useNavigate();

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.settings}>
          <Link to='/' className='cancel' title={browser.i18n.getMessage('cancel')}>
            <CancelIcon />
          </Link>

          <SettingsBack />

          <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
            <div className={S.settingsSubmenu}>
              <div className={S.settingsSubmenuHeader}>
                <h3>{browser.i18n.getMessage('settings_reset_header')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <div className={S.settingsReset}>
                  <div className={S.settingsResetText}>
                    <WarningIconLight className='theme-light' />
                    <WarningIconDark className='theme-dark' />
                    <p>{browser.i18n.getMessage('settings_reset_description')}</p>
                  </div>
                  <div className={S.settingsResetButtons}>
                    <button
                      className={`${bS.btn} ${bS.btnClear} ${bS.btnReset}`}
                      onClick={resetExtension}
                    >
                      {browser.i18n.getMessage('settings_reset_action_confirm_button')}
                    </button>
                    <Link
                      to='..'
                      className={`${bS.btn} ${bS.btnClear} ${bS.btnSimpleAction} ${bS.btnCancel}`}
                      onClick={e => {
                        e.preventDefault();
                        navigate(-1);
                      }}
                    >
                      {browser.i18n.getMessage('settings_reset_action_cancel_button')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsReset;
