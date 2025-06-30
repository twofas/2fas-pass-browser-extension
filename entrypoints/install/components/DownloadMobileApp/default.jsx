// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import AppStore from '@/assets/install-page/appstore.png?url';
import GooglePlay from '@/assets/install-page/googleplay.png?url';

/** 
* Function component for the DownloadMobileAppDefault.
* @return {JSX.Element} The rendered component.
*/
const DownloadMobileAppDefault = () => {
  return (
    <>
      <a href="https://apps.apple.com/us/app/2fas-pass/id6504464955" target="_blank" rel="noopener noreferrer">
        <img src={AppStore} alt="App Store" loading="lazy" />
      </a>
      <a href="https://play.google.com/store/apps/details?id=com.twofasapp.pass" target="_blank" rel="noopener noreferrer">
        <img src={GooglePlay} alt="Google Play" loading="lazy" />
      </a>
    </>
  );
};

export default DownloadMobileAppDefault;
