// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Fetch.module.scss';
import { useRef, useEffect, useState } from 'react';

/**
* Function to render the connection error component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ConnectionError = ({ fetchState, errorText }) => {
  const [loaded, setLoaded] = useState(false);
  const ConnectionErrorComponent = useRef(null);

  useEffect(() => {
    if (ConnectionErrorComponent.current) {
      return false;
    }

    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { ConnectionErrorComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { ConnectionErrorComponent.current = module.default; setLoaded(true); });
    }

    return () => {
      ConnectionErrorComponent.current = null;
    };
  }, [fetchState]);

  return (
    <div className={`${S.fetchCase} ${S.active}`}>
      <h2>{errorText}</h2>
      <div className={S.fetchCaseAnimation}>
        {loaded ? <ConnectionErrorComponent.current /> : <div style={{ height: '86px' }} />}
      </div>
    </div>
  );
};

export default ConnectionError;
