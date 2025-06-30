// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useRef, useEffect, useState } from 'react';

/** 
* Function component for the DownloadMobileApp.
* @return {JSX.Element} The rendered component.
*/
const DownloadMobileApp = () => {
  const [loaded, setLoaded] = useState(false);
  const DownloadMobileAppComponent = useRef(null);

  useEffect(() => {
    if (DownloadMobileAppComponent.current) {
      return false;
    }

    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { DownloadMobileAppComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { DownloadMobileAppComponent.current = module.default; setLoaded(true); });
    }

    return () => {
      DownloadMobileAppComponent.current = null;
    };
  }, []);

  return (
    <>
      {loaded ? <DownloadMobileAppComponent.current /> : <div style={{ height: '48px' }} />}
    </>
  );
};

export default DownloadMobileApp;
