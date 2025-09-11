// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { Link, useLocation } from 'react-router';
import { lazy, useEffect } from 'react';
import { usePopupState } from '@/hooks/usePopupState';

const ExtensionName = lazy(() => import('./components/ExtensionName'));
const Shortcut = lazy(() => import('./components/Shortcut'));
const Push = lazy(() => import('./components/Push'));
const Theme = lazy(() => import('./components/Theme'));
const SavePasswordPrompt = lazy(() => import('./components/SavePasswordPrompt'));
const ContextMenu = lazy(() => import('./components/ContextMenu'));
const Logs = lazy(() => import('./components/Logs'));
const MenuArrowIcon = lazy(() => import('@/assets/popup-window/menu-arrow.svg?react'));
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));

/**
* Function to render the Settings Preferences component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsPreferences (props) {
  const location = useLocation();
  const { setScrollElementRef, scrollElementRef, popupStateData, setHref } = usePopupState();

  useEffect(() => {
    setHref(location.pathname);
  }, [location.pathname, setHref]);
  
  useEffect(() => {
    if (popupStateData?.scrollPosition && popupStateData.scrollPosition !== 0 && scrollElementRef.current) {
      scrollElementRef.current.scrollTo(0, popupStateData.scrollPosition);
    }
  }, [popupStateData, scrollElementRef]);
  
  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={el => { setScrollElementRef(el); }}>
        <section className={S.settings}>
          <NavigationButton type='back' />
          <NavigationButton type='cancel' />

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
