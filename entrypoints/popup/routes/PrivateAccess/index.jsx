// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './PrivateAccess.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useMemo } from 'react';
import ClearLink from '@/entrypoints/popup/components/ClearLink';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Function to get the message key with the steps for the current browser.
* @return {string} The message key.
*/
const getStepsKey = () => {
  switch (import.meta.env.BROWSER) {
    case 'safari': {
      return 'private_access_steps_safari';
    }

    case 'firefox': {
      return 'private_access_steps_firefox';
    }

    case 'edge': {
      return 'private_access_steps_edge';
    }

    default: {
      return 'private_access_steps_chrome';
    }
  }
};

/**
* Function component that tells the user that autofill needs access to private windows.
* @param {Object} props - The properties passed to the component.
* @return {JSX.Element} The rendered PrivateAccess component.
*/
function PrivateAccess (props) {
  const { getMessage } = useI18n();

  const steps = useMemo(() => {
    return getMessage(getStepsKey())
      .split('\n')
      .map(step => step.trim())
      .filter(Boolean);
  }, [getMessage]);

  return (
    <div className={`${props.className ? props.className : ''}`}>
      <div>
        <section className={S.privateAccess}>
          <h1>{getMessage('private_access_title')}</h1>

          <div className={S.privateAccessSteps}>
            <h2>{getMessage('private_access_steps_header')}</h2>
            <ol>
              {steps.map(step => <li key={step}>{step}</li>)}
            </ol>
          </div>

          <p className={S.privateAccessCopy}>{getMessage('private_access_copy_info')}</p>

          <ClearLink
            to='/'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnQrReload} ${S.privateAccessButton}`}
          >
            {getMessage('private_access_go_to_list')}
          </ClearLink>
        </section>
      </div>
    </div>
  );
}

export default PrivateAccess;
