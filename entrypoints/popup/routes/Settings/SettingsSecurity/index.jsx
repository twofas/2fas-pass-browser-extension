// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { lazy, useRef } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import MenuArrowIcon from '@/assets/popup-window/menu-arrow.svg?react';

const AutoClearClipboard = lazy(() => import('./components/AutoClearClipboard'));
const IdleLock = lazy(() => import('./components/IdleLock'));
// const SafeBrowsing = lazy(() => import('./components/SafeBrowsing'));
// const SafeBrowsingReports = lazy(() => import('./components/SafeBrowsingReports'));

 /**
* Function to render the Settings Security component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsSecurity (props) {
  const { getMessage } = useI18n();
  const scrollableRef = useRef(null);
  useScrollPosition(scrollableRef, false);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.settings}>
          <NavigationButton type='back' />
          <NavigationButton type='cancel' />

          <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
            <div className={S.settingsSubmenu}>
              <div className={S.settingsSubmenuHeader}>
                <h3>{getMessage('settings_security')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <div className={S.settingsCrossDomain}>
                  <h4>{getMessage('settings_cross_domain_header')}</h4>
                  <p className={S.noMargin}>{getMessage('settings_cross_domain_description')}</p>

                  <ClearLink
                    to='/settings/security/cross-domain'
                    className={S.settingsCrossDomainLink}
                    prefetch='intent'
                  >
                    <span>{getMessage('settings_cross_domain_button')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
                </div>

                <AutoClearClipboard />
                <IdleLock />

                {/* <div className={S.settingsAdvanced}>
                  <h4>{getMessage('advanced')}</h4>
                
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
