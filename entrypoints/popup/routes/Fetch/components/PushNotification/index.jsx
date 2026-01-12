// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Fetch.module.scss';
import { useRef, useEffect, useState } from 'react';
import InfoIcon from '@/assets/popup-window/info.svg?react';

/**
* Function to render the push notification component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const PushNotification = ({ fetchState, description }) => {
  const [loaded, setLoaded] = useState(false);
  const PushNotificationComponent = useRef(null);

  useEffect(() => {
    if (PushNotificationComponent.current) {
      return false;
    }

    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { PushNotificationComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { PushNotificationComponent.current = module.default; setLoaded(true); });
    }

    return () => {
      PushNotificationComponent.current = null;
    };
  }, [fetchState]);

  return (
    <div className={`${S.fetchCase} ${S.active}`}>
      <h2>{browser.i18n.getMessage('fetch_push_header')}</h2>
      <div className={S.fetchCaseAnimation}>
        {loaded ? <PushNotificationComponent.current /> : <div style={{ height: '86px' }} />}
      </div>
      <div className={S.fetchCaseDescription}>
        <InfoIcon />
        <p>{description || browser.i18n.getMessage('fetch_continue_updating_description')}</p>
      </div>
    </div>
  );
};

export default PushNotification;
