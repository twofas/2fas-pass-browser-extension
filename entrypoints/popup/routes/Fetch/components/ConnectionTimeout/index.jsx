// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Fetch.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Function to render the connection timeout component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ConnectionTimeout = ({ fetchState, tryAgainHandle }) => {
  const { getMessage } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const ConnectionTimeoutComponent = useRef(null);

  useEffect(() => {
    if (ConnectionTimeoutComponent.current) {
      return false;
    }

    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { ConnectionTimeoutComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { ConnectionTimeoutComponent.current = module.default; setLoaded(true); });
    }

    return () => {
      ConnectionTimeoutComponent.current = null;
    };
  }, [fetchState]);

  return (
    <div className={`${S.fetchCase} ${S.active}`}>
      <h2>{getMessage('fetch_connection_timeout_header')}</h2>
      <div className={S.fetchCaseAnimation}>
        {loaded ? <ConnectionTimeoutComponent.current /> : <div style={{ height: '86px' }} />}
      </div>
      <button className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction} ${bS.btnPushRetry}`} onClick={tryAgainHandle}>
        {getMessage('try_again')}
      </button>
    </div>
  );
};

export default ConnectionTimeout;
