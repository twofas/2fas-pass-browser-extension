// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Fetch.module.scss';
import { useRef, useEffect, useState } from 'react';
import InfoIcon from '@/assets/popup-window/info.svg?react';

/**
* Function to render the continue update component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
const ContinueUpdate = ({ fetchState }) => {
  const [loaded, setLoaded] = useState(false);
  const ContinueUpdateComponent = useRef(null);

  useEffect(() => {
    if (ContinueUpdateComponent.current) {
      return false;
    }

    if (import.meta.env.BROWSER === 'safari') {
      import('./safari.jsx').then(module => { ContinueUpdateComponent.current = module.default; setLoaded(true); });
    } else {
      import('./default.jsx').then(module => { ContinueUpdateComponent.current = module.default; setLoaded(true); });
    }

    return () => {
      ContinueUpdateComponent.current = null;
    };
  }, [fetchState]);

  return (
    <div className={`${S.fetchCase} ${S.active}`}>
      <h2>{browser.i18n.getMessage('fetch_continue_updating_header')}</h2>
      <div className={S.fetchCaseAnimation}>
        {loaded ? <ContinueUpdateComponent.current /> : <div style={{ height: '86px' }} />}
      </div>
      <div className={S.fetchCaseDescription}>
        <InfoIcon />
        <p>{browser.i18n.getMessage('fetch_continue_updating_description')}</p>
      </div>
    </div>
  );
};

export default ContinueUpdate;
