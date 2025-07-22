// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Install.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import ScanIcon from '@/assets/install-page/scan.svg?react';
import DownloadQR from '@/assets/install-page/download-qr.svg?react';

/** 
* Function component for the DownloadMobileAppDefault.
* @return {JSX.Element} The rendered component.
*/
const DownloadMobileAppDefault = () => {
  return (
    <div className={S.appsDownload}>
      <a
        className={`${bS.btn} ${bS.btnTheme} ${bS.btnInstallPageDownload} ${S.safari}`}
        href="https://2fas.com/download"
        target="_blank"
        rel="noopener noreferrer"
      >
        {browser.i18n.getMessage('install_get_mobile_app')}
      </a>
      <button className={S.appsDownloadButton} type='button'>
        <span className={S.appsDownloadButtonContent}>
          <ScanIcon />
          <span>{browser.i18n.getMessage('install_scan')}</span>
        </span>
        <span className={S.appsDownloadButtonTooltip}>
          <span>{browser.i18n.getMessage('install_point_camera')}</span>
          <DownloadQR />
        </span>
      </button>
    </div>
  );
};

export default DownloadMobileAppDefault;
