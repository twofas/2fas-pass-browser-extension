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
import { useI18n } from '@/partials/context/I18nContext';
import { motion } from 'motion/react';
import ToastsContent from '@/entrypoints/popup/components/ToastsContent';
import Video1Light from '@/assets/videos/install_video_1_light.mp4?url';
import Video1Dark from '@/assets/videos/install_video_1_dark.mp4?url';
import { openPopup, safariBlankLinks } from '@/partials/functions';
import detectDefaultTheme from './functions/detectDefaultTheme';
import Logo from '@/assets/logo.svg?react';
import LogoDark from '@/assets/logo-dark.svg?react';
import Puzzle from '@/assets/install-page/puzzle.svg?react';
import Pin from '@/assets/install-page/pin.svg?react';
import Arrow from '@/assets/install-page/arrow.svg?react';
import Arrow2 from '@/assets/install-page/arrow2.svg?react';
import ConnectIllustration from '@/assets/connect.svg?react';
import UnderlineDecor from '@/assets/install-page/underline-decor.svg?react';

const DownloadMobileApp = lazy(() => import('./components/DownloadMobileApp'));

const stepVariants = {
  hidden: { opacity: 0, display: 'none', transition: { duration: 0.2, ease: 'easeOut' } },
  visible: { opacity: 1, display: 'block', transition: { duration: 0.2, ease: 'easeOut' } }
};

function Install () {
  const { getMessage } = useI18n();
  const [stepVisible, setStepVisible] = useState(0);
  const stepVisibleRef = useRef(stepVisible);

  const handleContinue = useCallback(async () => {
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
      showToast(getMessage('install_please_pin_extension'), 'error');
    }
  }, []);

  const handleSkip = useCallback(async () => {
    goToStep(2);
    await openPopup();
  }, []);

  const goToStep = useCallback(step => {
    if (step === stepVisibleRef.current) {
      return false;
    }

    const timeout = stepVisibleRef.current === 0 ? 0 : 201;

    setStepVisible(0);

    setTimeout(() => {
      setStepVisible(step);
    }, timeout);
  }, []);

  const onUserSettingsChanged = useCallback(async prop => {
    if (prop.isOnToolbar) {
      goToStep(2);
      await openPopup();
    } else {
      goToStep(1);
    }
  }, []);

  const getInitialStep = async () => {
    let settings;

    if (browser?.action?.getUserSettings !== null) {
      try {
        settings = await browser?.action?.getUserSettings();
      } catch {}
    }

    if (!settings || settings.isOnToolbar) {
      goToStep(2);
      await openPopup();
    } else {
      goToStep(1);
    }
  };

  useEffect(() => {
    stepVisibleRef.current = stepVisible;
  }, [stepVisible]);

  useEffect(() => {
    const unwatchTheme = storage.watch('local:theme', async (newValue, oldValue) => {
      if (oldValue) {
        document.documentElement.classList.remove(`theme-${oldValue}`);
        document.body.classList.remove(`theme-${oldValue}`);
      }

      if (!newValue || (newValue !== 'unset' && newValue !== 'light' && newValue !== 'dark')) {
        newValue = 'unset';
      }

      document.documentElement.classList.add(`theme-${newValue}`);
      document.body.classList.add(`theme-${newValue}`);
    });

    if (import.meta.env.BROWSER === 'safari') {
      document.addEventListener('click', safariBlankLinks);
    }

    document.documentElement.classList.add(import.meta.env.BROWSER);

    detectDefaultTheme();
    getInitialStep();

    try {
      browser?.action?.onUserSettingsChanged?.addListener(onUserSettingsChanged);
    } catch {}

    return () => {
      unwatchTheme();

      try {
        browser?.action?.onUserSettingsChanged?.removeListener(onUserSettingsChanged);
      } catch {}

      if (import.meta.env.BROWSER === 'safari') {
        document.removeEventListener('click', safariBlankLinks);
      }
    };
  }, []);

  return (
    <>
      <section className={S.install}>
        <aside className={S.installCard}>
          <div className={S.installCardLogo}>
            <Logo className="theme-light" />
            <LogoDark className="theme-dark" />
          </div>

          <div className={S.installCardCenter}>
            <span className={S.installCardSubtitle}>{getMessage('install_made_to_work_together')}</span>
            <p className={S.installCardDescription}>{getMessage('install_extension_requires_mobile')}</p>
            <div className={S.installCardIllustration}>
              <ConnectIllustration />
            </div>
          </div>

          <div className={S.installCardDownload}>
            <p className={S.installCardDownloadText}>
              <span>{getMessage('install_dont_have_app')}</span>
              <br />
              <strong>{getMessage('install_download_it_here')}</strong>
            </p>
            <div className={S.installCardDownloadButtons}>
              <DownloadMobileApp />
            </div>
          </div>
        </aside>

        <main className={S.installContent}>
          <motion.div
            className={S.installContentStep}
            variants={stepVariants}
            initial="hidden"
            animate={stepVisible === 1 ? 'visible' : 'hidden'}
          >
            <h1 className={S.installContentHeading}>{getMessage('install_step1_heading')}</h1>

            <div className={S.installContentVideo}>
              <video src={Video1Light} className="theme-light" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
              <video src={Video1Dark} className="theme-dark" autoPlay loop muted playsInline disablePictureInPicture disableRemotePlayback />
            </div>

            <p className={S.installContentInstruction}>
              {getMessage('install_step1_instruction_part1')}
              {' '}
              <Puzzle className={S.installContentInstructionPuzzle} />
              {' '}
              {getMessage('install_step1_instruction_part2')}
              {' '}
              <Pin className={S.installContentInstructionPin} />
            </p>

            <div className={S.installContentButtons}>
              <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnInstallPage}`} onClick={handleContinue}>
                <span>{getMessage('install_i_have_pinned_it')}</span>
                <span className={S.installContentButtonsArrow}>
                  <Arrow />
                </span>
              </button>
              <button className={`${bS.btn} ${bS.btnClear} ${bS.btnInstallPageSkip}`} onClick={handleSkip}>
                {getMessage('install_skip_for_now')}
              </button>
            </div>
          </motion.div>

          <motion.div
            className={S.installContentStep}
            variants={stepVariants}
            initial="hidden"
            animate={stepVisible === 2 ? 'visible' : 'hidden'}
          >
            <button className={S.installContentArrowCircle} onClick={openPopup} type="button">
              <Arrow2 />
              <span className={S.installContentPulse} />
              <span className={S.installContentPulse} style={{ animationDelay: '-1s' }} />
            </button>

            <h1 className={S.installContentHeading}>
              {getMessage('install_step2_heading_before')}
              {' '}
              <span className={S.installContentUnderlined}>
                {getMessage('install_step2_heading_underlined')}
                <UnderlineDecor />
              </span>
            </h1>

            <p className={S.installContentDescription}>{getMessage('install_step2_description')}</p>
          </motion.div>
        </main>
      </section>

      <ToastsContent className='Toastify__install' />
    </>
  );
}

export default Install;
