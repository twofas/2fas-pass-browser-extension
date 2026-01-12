// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Settings.module.scss';
import { useState, useEffect, useRef } from 'react';
import getRatingLink from '../functions/getRatingLink';
import getRatingText from '../functions/getRatingText';
import useScrollPosition from '@/entrypoints/popup/hooks/useScrollPosition';
import NavigationButton from '@/entrypoints/popup/components/NavigationButton';
import StarIcon from '@/assets/popup-window/star.svg?react';
import AboutIcon from '@/assets/popup-window/about.svg?react';
import AboutDarkIcon from '@/assets/popup-window/about-dark.svg?react';
import Domain from '@/assets/popup-window/domain.svg?react';
import DiscordIcon from '@/assets/social/discord.svg?react';
import YoutubeIcon from '@/assets/social/youtube.svg?react';
import TwitterIcon from '@/assets/social/twitter.svg?react';
import GithubIcon from '@/assets/social/github.svg?react';

/**
* Function to render the Settings About component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SettingsAbout (props) {
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  const ratingLink = getRatingLink();
  const ratingText = getRatingText();

  const scrollableRef = useRef(null);

  useScrollPosition(scrollableRef, loading);

  useEffect(() => {
    try {
      const manifest = browser.runtime.getManifest();
      setVersion(manifest.version);
      setLoading(false);
    } catch (e) {
      CatchError(e);
    }
  }, []);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div ref={scrollableRef}>
        <section className={S.settings}>
          <NavigationButton type='back' />
          <NavigationButton type='cancel' />

          <div className={`${S.settingsContainer} ${S.submenuContainer}`}>
            <div className={S.settingsSubmenu}>
              <div className={S.settingsSubmenuHeader}>
                <h3>{browser.i18n.getMessage('settings_about_header')}</h3>
              </div>
    
              <div className={S.settingsSubmenuBody}>
                <div className={S.settingsAbout}>
                  <div className={S.settingsAboutThankYou}>
                    <AboutIcon className="theme-light" />
                    <AboutDarkIcon className="theme-dark" />
                  </div>

                  <div className={S.settingsAboutText}>
                    <h3>{browser.i18n.getMessage('settings_about_thank_you')}</h3>
                    <h4>{browser.i18n.getMessage('settings_about_thank_you_subheader')}</h4>
                    <p>{browser.i18n.getMessage('settings_about_thank_you_description')}</p>
                  </div>

                  <div className={S.settingsAboutWebsite}>
                    <h3>{browser.i18n.getMessage('settings_visit_our_website')}</h3>
                    <a href="https://2fas.com/pass" className={S.settingsAboutWebsiteLink} target="_blank" rel="noopener noreferrer">
                      <Domain />
                      <span>2fas.com/pass</span>
                    </a>

                    <h5>{browser.i18n.getMessage('settings_privacy_policy')}</h5>
                    <a href="https://2fas.com/pass/privacy-policy/" className={`${S.settingsAboutWebsiteLink} ${S.additionalLink}`} target="_blank" rel="noopener noreferrer">
                      <Domain />
                      <span>2fas.com/pass/privacy-policy/</span>
                    </a>

                    <h5>{browser.i18n.getMessage('settings_eula')}</h5>
                    <a href="https://2fas.com/pass/eula/" className={`${S.settingsAboutWebsiteLink} ${S.additionalLink}`} target="_blank" rel="noopener noreferrer">
                      <Domain />
                      <span>2fas.com/pass/eula/</span>
                    </a>

                    <h4>{browser.i18n.getMessage('settings_lets_connect')}</h4>
                    <div className={S.settingsAboutSocial}>
                      <ul>
                        <li>
                          <a href='https://2fas.com/discord' target='_blank' rel='noopener noreferrer' title='Discord'>
                            <DiscordIcon className={S.socialDiscord} />
                          </a>
                        </li>
                        <li>
                          <a href='https://www.youtube.com/@2fas' target='_blank' rel='noopener noreferrer' title='YouTube'>
                            <YoutubeIcon className={S.socialYoutube} />
                          </a>
                        </li>
                        <li>
                          <a href='https://twitter.com/2FAS_com' target='_blank' rel='noopener noreferrer' title='Twitter'>
                            <TwitterIcon className={S.socialTwitter} />
                          </a>
                        </li>
                        <li>
                          <a href='https://github.com/twofas' target='_blank' rel='noopener noreferrer' title='GitHub'>
                            <GithubIcon className={S.socialGithub} />
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
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

export default SettingsAbout;
