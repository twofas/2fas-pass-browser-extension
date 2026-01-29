// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Settings.module.scss';
import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import getRatingLink from './functions/getRatingLink';
import getRatingText from './functions/getRatingText';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import ClearLink from '../../components/ClearLink';
import MenuArrowIcon from '@/assets/popup-window/menu-arrow.svg?react';
import StarIcon from '@/assets/popup-window/star.svg?react';

/**
* Function to render the Settings component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Settings (props) {
  const { getMessage } = useI18n();
  const [version, setVersion] = useState('');
  const ratingLink = getRatingLink();
  const ratingText = getRatingText();

  const scrollableRef = useRef(null);

  useScrollPosition(scrollableRef, false);

  useEffect(() => {
    try {
      const manifest = browser.runtime.getManifest();
      setVersion(manifest.version);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.settings}>
          <NavigationButton type='cancel' />

          <div className={S.settingsContainer}>
            <h2>{getMessage('settings_header')}</h2>

            <div className={S.settingsMenu}>
              <ul>
                <li>
                  <ClearLink to='/settings/preferences' prefetch='intent'>
                    <span>{getMessage('settings_preferences')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
                </li>
                <li>
                  <ClearLink to='/settings/security' prefetch='intent'>
                    <span>{getMessage('settings_security')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
                </li>
                <li>
                  <ClearLink to='/settings/devices' prefetch='intent'>
                    <span>{getMessage('settings_devices')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
                </li>
                <li>
                  <ClearLink to='/settings/about' prefetch='intent'>
                    <span>{getMessage('settings_about')}</span>
                    <MenuArrowIcon />
                  </ClearLink>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={S.settingsBottom}>
          <div className={S.settingsVersion}>
            <p>
              <span>{getMessage('version')}&nbsp;</span>
              <span>{version}</span>
            </p>
          </div>
    
          <div className={S.settingsRateUs}>
            <a href={ratingLink} className={S.settingsRateUsText} target='_blank' rel='noopener noreferrer'>{ratingText}</a>
            <a href={ratingLink} className={S.settingsRateUsStars} target='_blank' rel='noopener noreferrer' title={ratingText}>
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
              <StarIcon />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
