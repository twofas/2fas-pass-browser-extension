// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import '@/partials/global-styles/global.scss';
import '@/partials/global-styles/toasts.scss';
import 'react-toastify/dist/ReactToastify.css';
import S from './Install.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useEffect, lazy, useCallback, useRef } from 'react';
import getKey from '@/partials/sessionStorage/getKey';
import getConfiguredBoolean from '@/partials/sessionStorage/configured/getConfiguredBoolean';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import ToastsContent from '@/entrypoints/popup/components/ToastsContent';
import Video1Light from '@/assets/videos/install_video_1_light.mp4?url';
import Video1Dark from '@/assets/videos/install_video_1_dark.mp4?url';
import Video2Light from '@/assets/videos/install_video_2_light.mp4?url';
import Video2Dark from '@/assets/videos/install_video_2_dark.mp4?url';
import VideoPoster from '@/assets/install-page/video-poster.png?url';
import openPopup from '@/partials/functions/openPopup';
import safariBlankLinks from '@/partials/functions/safariBlankLinks';
import detectDefaultTheme from './functions/detectDefaultTheme';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const Logo = lazy(() => import('@/assets/logo.svg?react'));
const LogoDark = lazy(() => import('@/assets/logo-dark.svg?react'));
const Domain = lazy(() => import('@/assets/popup-window/domain.svg?react'));
const Check = lazy(() => import('@/assets/install-page/check.svg?react'));
const Puzzle = lazy(() => import('@/assets/install-page/puzzle.svg?react'));
const Pin = lazy(() => import('@/assets/install-page/pin.svg?react'));
const Arrow = lazy(() => import('@/assets/install-page/arrow.svg?react'));
const Shield = lazy(() => import('@/assets/install-page/shield.svg?react'));
const Qr = lazy(() => import('@/assets/install-page/qr.svg?react'));
const LogsIcon = lazy(() => import('@/assets/install-page/logs.svg?react'));
const ArrowDecorLight = lazy(() => import('@/assets/install-page/arrow-decor-light.svg?react'));
const ArrowDecorDark = lazy(() => import('@/assets/install-page/arrow-decor-dark.svg?react'));
const PlayIcon = lazy(() => import('@/assets/install-page/play.svg?react'));
const DownloadMobileApp  = lazy(() => import('./components/DownloadMobileApp'));

const stepVariants = {
  hidden: { opacity: 0, display: 'none', transition: { duration: 0.3, ease: 'easeInOut' } },
  visible: { opacity: 1, display: 'block', transition: { duration: 0.3, ease: 'easeInOut' } }
};

/** 
* Function component for the Install page.
* @return {JSX.Element} The rendered component.
*/
function Install () {
  const [stepVisible, setStepVisible] = useState(0);
  const stepVisibleRef = useRef(stepVisible);

  const [appsVisible, setAppsVisible] = useState(false);
  const [logs, setLogs] = useState(false);

  const handleContinueWoPinning = async () => {
    goToStep(2);
    await openPopup();
  };

  const handleContinue = async () => {
    let settings;

    try {
      if (browser?.action?.getUserSettings !== null) {
        settings = await browser?.action?.getUserSettings();
      }
    } catch {}

    if (!settings || settings.isOnToolbar) {
      goToStep(2);
      await openPopup();
    } else {
      showToast(browser.i18n.getMessage('install_please_pin_extension'), 'error');
    }
  };

  const goToStep = useCallback(step => {
    if (step === stepVisibleRef.current) {
      return false;
    }

    const timeout = stepVisibleRef.current === 0 ? 0 : 301;

    setStepVisible(0);

    setTimeout(() => {
      setStepVisible(step);

      if (step === 2) {
        setAppsVisible(true);
      } else {
        setAppsVisible(false);
      }
    }, timeout);
  }, [stepVisible]);

  const onUserSettingsChanged = async prop => {
    const configured = await getConfiguredBoolean();

    if (configured) {
      goToStep(3);
    } else {
      if (prop.isOnToolbar) {
        goToStep(2);
        await openPopup();
      } else {
        goToStep(1);
      }
    }
  };

  const onStorageChange = async (change, areaName) => {
    let configuredKey, configured;

    try {
      configuredKey = await getKey('configured');
    } catch {}

    if (!configuredKey) {
      return false;
    }

    try {
      configured = await getConfiguredBoolean();
    } catch {}

    if (areaName !== 'session' && configured) {
      return;
    }

    if (configured) {
      goToStep(3);
    } else {
      let settings = false;

      try {
        if (browser?.action?.getUserSettings !== null) {
          settings = await browser?.action?.getUserSettings();
        }
      } catch {}

      if (!settings || settings.isOnToolbar) {
        goToStep(2);
      } else {
        goToStep(1);
      }
    }
  };

  const handleLogsChange = async () => {
    try {
      await storage.setItem('local:logging', !logs);
      setLogs(!logs);
      showToast(browser.i18n.getMessage('install_logging_settings_changed'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_logging_settings_changed'), 'error');
    }
  };

  const getDefaultLogs = useCallback(async () => {
    let storageLogging = await storage.getItem('local:logging');

    if (storageLogging === null) {
      storageLogging = false;
    }

    setLogs(storageLogging);
  }, []);

  const getInitialStep = async () => {
    const configured = await getConfiguredBoolean();

    if (configured) {
      goToStep(3);
    } else {
      let settings;

      if (browser?.action?.getUserSettings !== null) {
        try {
          settings = await browser?.action?.getUserSettings();
        } catch {}
      }

      if (!settings || settings.isOnToolbar) {
        goToStep(2);
      } else {
        goToStep(1);
      }
    }
  };

  useEffect(() => {
    stepVisibleRef.current = stepVisible;
  }, [stepVisible]);

  useEffect(() => {
    const unwatchTheme = storage.watch('local:theme', async (newValue, oldValue) => {
      if (oldValue) {
        document.body.classList.remove(`theme-${oldValue}`);
      }

      if (!newValue || newValue === 'unset') {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const themeValue = isDarkMode ? 'dark' : 'light';

        try {
          await storage.setItem('local:theme', themeValue);
          newValue = themeValue;
        } catch {
          newValue = 'light';
        }
      }

      document.body.classList.add(`theme-${newValue}`);
    });

    if (import.meta.env.BROWSER === 'safari') {
      document.addEventListener('click', safariBlankLinks);
    }

    detectDefaultTheme();
    getDefaultLogs();
    getInitialStep();

    try {
      browser?.action?.onUserSettingsChanged?.addListener(onUserSettingsChanged);
    } catch {}

    browser.storage.onChanged.addListener(onStorageChange);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      unwatchTheme();

      try {
        browser?.action?.onUserSettingsChanged?.removeListener(onUserSettingsChanged);
      } catch {}

      browser.storage.onChanged.removeListener(onStorageChange);

      if (import.meta.env.BROWSER === 'safari') {
        document.removeEventListener('click', safariBlankLinks);
      }

      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <>
      <section className={S.install}>
        <div className={S.installHeader}>
          <div className="container">
            <div className={S.installHeaderContainer}>
              <div className={S.installHeaderLogo}>
                <Logo className="theme-light" />
                <LogoDark className="theme-dark" />
              </div>
        
              <div className={S.installHeaderWebsite}>
                <a href="https://2fas.com/pass" target="_blank" rel="noopener noreferrer">
                  <Domain />
                  <span>2fas.com/pass</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={S.installContainer}>
          <div className="container">
            <div className={S.installContainerContent}>
              <LazyMotion features={loadDomAnimation}>
                <div className={S.installContainerContentLeft}>
                  <m.div
                    className={`${S.installContainerContentLeftBox}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 1 ? 'visible' : 'hidden'}
                  >
                    <h2>
                      <Check />
                      <span>{browser.i18n.getMessage('install_1_info')}</span>
                    </h2>
                    <h1>{browser.i18n.getMessage('install_1_header')}</h1>
                    <ul className={S.installList}>
                      <li className={S.installListItem}>
                        <span className={S.installListItemNumber}>
                          <span className={S.installListItemNumberNumber}>1</span>
                          <span className={S.installListItemNumberSeparator} />
                          <span className={S.installListItemNumberImg}>
                            <Puzzle className={S.installListItemNumberImgPuzzle} />
                          </span>
                        </span>
                        <span className={S.installListItemText}>{browser.i18n.getMessage('install_1_open_extension_menu')}</span>
                      </li>
                      <li className={S.installListItem}>
                        <span className={S.installListItemNumber}>
                          <span className={S.installListItemNumberNumber}>2</span>
                          <span className={S.installListItemNumberSeparator} />
                          <span className={S.installListItemNumberImg}>
                            <Pin className={S.installListItemNumberImgPin} />
                          </span>
                        </span>
                        <span className={S.installListItemText}>{browser.i18n.getMessage('install_1_pin_extension')}</span>
                      </li>
                    </ul>
                    <div className={S.installButtons}>
                      <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnInstallPage}`} onClick={handleContinue}>{browser.i18n.getMessage('continue')}</button>
                      <button className={`${bS.btn} ${bS.btnClear} ${bS.btnInstallPageWoPinning}`} onClick={handleContinueWoPinning}>
                        <span>{browser.i18n.getMessage('continue_without_pinning')}</span>
                        <Arrow />
                      </button>
                    </div>
                  </m.div>
                  <m.div
                    className={`${S.installContainerContentLeftBox}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 2 ? 'visible' : 'hidden'}
                  >
                    <h2>
                      <Check />
                      <span className={S.installPinnedText}>{browser.i18n.getMessage('install_2_info')}</span>
                    </h2>
                    <h1>{browser.i18n.getMessage('install_2_header')}</h1>
                    <ul className={S.installList}>
                      <li className={S.installListItem}>
                        <span className={S.installListItemNumber}>
                          <span className={S.installListItemNumberNumber}>1</span>
                          <span className={S.installListItemNumberSeparator} />
                          <span className={S.installListItemNumberImg}>
                            <Shield className={S.installListItemNumberImgShield} />
                          </span>
                        </span>
                        <span className={S.installListItemText}>{browser.i18n.getMessage('install_2_click_icon')}</span>
                      </li>
                      <li className={S.installListItem}>
                        <span className={S.installListItemNumber}>
                          <span className={S.installListItemNumberNumber}>2</span>
                          <span className={S.installListItemNumberSeparator} />
                          <span className={S.installListItemNumberImg}>
                            <Qr className={S.installListItemNumberImgQr} />
                          </span>
                        </span>
                        <span className={S.installListItemText}>{browser.i18n.getMessage('install_2_use_mobile_app')}</span>
                      </li>
                    </ul>

                    <div className={`${S.installContainerContentLeftBoxApps} ${appsVisible ? S.visible : ''}`}>
                      <DownloadMobileApp />
                    </div>
                  </m.div>
                  <m.div
                    className={`${S.installContainerContentLeftBox}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 3 ? 'visible' : 'hidden'}
                  >
                    <h2>
                      <Check />
                      <span className={S.installPinnedText}>{browser.i18n.getMessage('install_3_info')}</span>
                    </h2>
                    <h1>{browser.i18n.getMessage('install_3_header')}</h1>
                    <h3>
                      <span>{browser.i18n.getMessage('install_3_get_started')}</span>
                      <ArrowDecorLight className='theme-light' />
                      <ArrowDecorDark className='theme-dark' />
                    </h3>

                    <div className={S.installContainerContentLeftLogs}>
                      <h4>
                        <LogsIcon />
                        <span>{browser.i18n.getMessage('install_3_crash_logs_header')}</span>
                      </h4>

                      <p>{browser.i18n.getMessage('install_3_crash_logs_description')}</p>

                      <form action="#" className={`${bS.passToggle} ${S.installContainerContentLeftLogsForm}`}>
                        <input type="checkbox" name="pass-logs" id="pass-logs" defaultChecked={logs} onChange={handleLogsChange} />
                        <label htmlFor="pass-logs">
                          <span className={`${bS.passToggleBox} ${S.installContainerContentLeftLogsFormToggle}`}>
                            <span className={`${bS.passToggleBoxCircle} ${S.installContainerContentLeftLogsFormToggleCircle}`} />
                          </span>
                  
                          <span className={`${bS.passToggleText} ${S.installContainerContentLeftLogsFormText}`}>
                            <span>{browser.i18n.getMessage('install_3_crash_logs_checkbox_description')}</span>
                          </span>
                        </label>
                      </form>
                    </div>
                  </m.div>
                </div>
                <div className={S.installContainerContentRight}>
                  <m.div
                    className={`${S.installContainerContentRightBox}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 1 ? 'visible' : 'hidden'}
                  >
                    <video src={Video1Light} className="theme-light" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
                    <video src={Video1Dark} className="theme-dark" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
                  </m.div>
                  <m.div
                    className={`${S.installContainerContentRightBox}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 2 ? 'visible' : 'hidden'}
                  >
                    <video src={Video2Light} className="theme-light" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
                    <video src={Video2Dark} className="theme-dark" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
                  </m.div>
                  <m.div
                    className={`${S.installContainerContentRightBox} ${S.external}`}
                    variants={stepVariants}
                    initial="hidden"
                    animate={stepVisible === 3 ? 'visible' : 'hidden'}
                  >
                    <a href="https://2fas.com/pass/be-video" target='_blank' rel="noopener noreferrer" className={S.installContainerContentRightBoxExternalVideo}>
                      <PlayIcon />
                      <img src={VideoPoster} alt={browser.i18n.getMessage('install_3_get_started')} loading="lazy" />
                    </a>
                  </m.div>
                </div>
              </LazyMotion>
            </div>
          </div>
        </div>

        <div className={S.installFooter}>
          <div className="container">
            <div className={S.installFooterContainer}>
              <div className={`${S.installFooterApps} ${appsVisible ? S.visible : ''}`}>
                <DownloadMobileApp />
              </div>

              <div>
                <h6>{browser.i18n.getMessage('install_privacy_text')}</h6>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ToastsContent className='Toastify__install' />
    </>
  );
}

export default Install;
