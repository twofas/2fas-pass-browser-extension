// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { useRef } from 'react';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import ExtensionName from './components/ExtensionName';
import Shortcut from './components/Shortcut';
import Push from './components/Push';
import Theme from './components/Theme';
import SavePasswordPrompt from './components/SavePasswordPrompt';
import ContextMenu from './components/ContextMenu';
import Logs from './components/Logs';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import MenuArrowIcon from '@/assets/popup-window/menu-arrow.svg?react';

/**
* Function to render the Settings Preferences component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsPreferences (props) {
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

                  <ClearLink to='/settings/preferences/reset' className={S.settingsDangerZoneLink}>
                    <span>{browser.i18n.getMessage('settings_danger_zone_reset')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
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
