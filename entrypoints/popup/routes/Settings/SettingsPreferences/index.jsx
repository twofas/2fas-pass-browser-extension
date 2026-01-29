// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { useRef } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import ExtensionName from './components/ExtensionName';
import Language from './components/Language';
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
                <h3>{getMessage('settings_preferences')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <ExtensionName />
                <Language />
                <Shortcut />
                <Push />
                <Theme />
                <SavePasswordPrompt />

                <div className={S.settingsAdvanced}>
                  <h4>{getMessage('advanced')}</h4>

                  <div className={S.settingsAdvancedContainer}>
                    <ContextMenu />
                    <Logs />
                  </div>
                </div>

                <div className={S.settingsDangerZone}>
                  <h4>{getMessage('settings_danger_zone')}</h4>

                  <ClearLink to='/settings/preferences/reset' className={S.settingsDangerZoneLink}>
                    <span>{getMessage('settings_danger_zone_reset')}</span>
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
