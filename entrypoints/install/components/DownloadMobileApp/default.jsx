// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Install.module.scss';
import AppStore from '@/assets/app_store.svg';
import GooglePlay from '@/assets/google_play.svg';
import ScanIcon from '@/assets/install-page/scan.svg?react';
import PassIosQR from '@/assets/install-page/pass-ios-qr.svg?react';
import PassAndroidQR from '@/assets/install-page/pass-android-qr.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Function component for the DownloadMobileAppDefault.
* @return {JSX.Element} The rendered component.
*/
const DownloadMobileAppDefault = () => {
  const { getMessage } = useI18n();
  
  return (
    <div className={S.appsDownload}>
      <div className={S.appsDownloadGroup}>
        <a
          href="https://apps.apple.com/us/app/2fas-pass/id6504464955"
          target="_blank"
          rel="noopener noreferrer"
          title={getMessage('install_download_ios_app')}
        >
          <img
            className={S.appStore}
            src={AppStore}
            alt="App Store"
            loading="lazy"
          />
        </a>
        <button className={S.appsDownloadButton} type='button'>
          <span className={S.appsDownloadButtonContent}>
            <ScanIcon />
          </span>
          <span className={S.appsDownloadButtonTooltip}>
            <span>{getMessage('install_point_camera')}</span>
            <PassIosQR />
          </span>
        </button>
      </div>
      <div className={S.appsDownloadGroup}>
        <a
          href="https://play.google.com/store/apps/details?id=com.twofasapp.pass"
          target="_blank"
          rel="noopener noreferrer"
          title={getMessage('install_download_android_app')}
        >
          <img
            className={S.googlePlay}
            src={GooglePlay}
            alt="Google Play"
            loading="lazy"
          />
        </a>
        <button className={S.appsDownloadButton} type='button'>
          <span className={S.appsDownloadButtonContent}>
            <ScanIcon />
          </span>
          <span className={S.appsDownloadButtonTooltip}>
            <span>{getMessage('install_point_camera')}</span>
            <PassAndroidQR />
          </span>
        </button>
      </div>
    </div>
  );
};

export default DownloadMobileAppDefault;
