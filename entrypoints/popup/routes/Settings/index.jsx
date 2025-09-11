// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './Settings.module.scss';
import { Link } from 'react-router';
import { useState, useEffect, lazy } from 'react';
import getRatingLink from './functions/getRatingLink';
import getRatingText from './functions/getRatingText';
import { usePopupState } from '@/hooks/usePopupState';

const MenuArrowIcon = lazy(() => import('@/assets/popup-window/menu-arrow.svg?react'));
const StarIcon = lazy(() => import('@/assets/popup-window/star.svg?react'));
const NavigationButton = lazy(() => import('@/entrypoints/popup/components/NavigationButton'));

/**
* Function to render the Settings component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Settings (props) {
  const [version, setVersion] = useState('');
  const ratingLink = getRatingLink();
  const ratingText = getRatingText();

  const { setScrollElementRef, scrollElementRef, popupStateData } = usePopupState();

  useEffect(() => {
    try {
      const manifest = browser.runtime.getManifest();
      setVersion(manifest.version);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  useEffect(() => {
    if (popupStateData?.scrollPosition && popupStateData.scrollPosition !== 0 && scrollElementRef.current) {
      scrollElementRef.current.scrollTo(0, popupStateData.scrollPosition);
    }
  }, [popupStateData, scrollElementRef]);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={el => { setScrollElementRef(el); }}>
        <section className={S.settings}>
          <NavigationButton type='cancel' />

          <div className={S.settingsContainer}>
            <h2>{browser.i18n.getMessage('settings_header')}</h2>

            <div className={S.settingsMenu}>
              <ul>
                <li>
                  <Link to='/settings-preferences' prefetch='intent'>
                    <span>{browser.i18n.getMessage('settings_preferences')}</span>
                    <MenuArrowIcon />
                  </Link>
                </li>
                <li>
                  <Link to='/settings-security' prefetch='intent'>
                    <span>{browser.i18n.getMessage('settings_security')}</span>
                    <MenuArrowIcon />
                  </Link>
                </li>
                <li>
                  <Link to='/settings-about' prefetch='intent'>
                    <span>{browser.i18n.getMessage('settings_about')}</span>
                    <MenuArrowIcon />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className={S.settingsBottom}>
          <div className={S.settingsVersion}>
            <p>
              <span>{browser.i18n.getMessage('version')}&nbsp;</span>
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
