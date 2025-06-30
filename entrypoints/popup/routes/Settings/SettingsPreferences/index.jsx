// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { Link } from 'react-router';
import { lazy } from 'react';

const SettingsBack = lazy(() => import('../components/SettingsBack'));
const ExtensionName = lazy(() => import('./components/ExtensionName'));
const Shortcut = lazy(() => import('./components/Shortcut'));
const Push = lazy(() => import('./components/Push'));
const Theme = lazy(() => import('./components/Theme'));
const SavePasswordPrompt = lazy(() => import('./components/SavePasswordPrompt'));
const ContextMenu = lazy(() => import('./components/ContextMenu'));
const Logs = lazy(() => import('./components/Logs'));
const CancelIcon = lazy(() => import('@/assets/popup-window/cancel.svg?react'));
const MenuArrowIcon = lazy(() => import('@/assets/popup-window/menu-arrow.svg?react'));

/**
* Function to render the Settings Preferences component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsPreferences (props) {
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
                <h3>{browser.i18n.getMessage('settings_preferences')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <ExtensionName />
                <Shortcut />
                <Push />
                <Theme />
                <SavePasswordPrompt />

                <div className={S.settingsAdvanced}>
                  <h4>{browser.i18n.getMessage('advanced')}</h4>
          
                  <div className={S.settingsAdvancedContainer}>
                    <ContextMenu />
                    <Logs />
                  </div>
                </div>

                <div className={S.settingsDangerZone}>
                  <h4>{browser.i18n.getMessage('settings_danger_zone')}</h4>
                  
                  <Link to='/settings-reset' className={S.settingsDangerZoneLink}>
                    <span>{browser.i18n.getMessage('settings_danger_zone_reset')}</span>
                    <MenuArrowIcon />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPreferences;
