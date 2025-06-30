// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { Link } from 'react-router';
import { lazy } from 'react';

const SettingsBack = lazy(() => import('../components/SettingsBack'));
const AutoClearClipboard = lazy(() => import('./components/AutoClearClipboard'));
const IdleLock = lazy(() => import('./components/IdleLock'));
const CancelIcon = lazy(() => import('@/assets/popup-window/cancel.svg?react'));
// const SafeBrowsing = lazy(() => import('./components/SafeBrowsing'));
// const SafeBrowsingReports = lazy(() => import('./components/SafeBrowsingReports'));

 /**
* Function to render the Settings Security component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsSecurity (props) {
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
                <h3>{browser.i18n.getMessage('settings_security')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <AutoClearClipboard />
    
                <IdleLock />
    
                {/* <div className={S.settingsAdvanced}>
                  <h4>{browser.i18n.getMessage('advanced')}</h4>
                
                  <div className={S.settingsAdvancedContainer}>
                    <SafeBrowsing />
                    <SafeBrowsingReports />
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsSecurity;
