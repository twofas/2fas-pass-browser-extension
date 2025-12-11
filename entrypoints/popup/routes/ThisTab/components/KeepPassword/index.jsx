// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/KeepPassword.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useMemo, useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router';
import { useKeepPassword } from './hooks/useKeepPassword';
import SmallLoginItem from '../SmallLoginItem';

/**
* Component displaying keep password popup after failed autofill.
* @return {JSX.Element} The rendered keep password popup component.
*/
function KeepPassword () {
  const location = useLocation();
  const { state } = location;
  const [autofillFailed, setAutofillFailed] = useState(false);
  const { handleKeepPassword, handleDontKeepPassword } = useKeepPassword(state, setAutofillFailed);

  const containerClass = useMemo(() => {
    return `${S.keepPassword} ${autofillFailed ? S.active : ''}`;
  }, [autofillFailed]);

  useEffect(() => {
    if (location?.state?.action === 'autofillT2Failed') {
      setAutofillFailed(true);
    } else {
      setAutofillFailed(false);
    }
  }, [location?.state]);

  return (
    <div className={containerClass}>
      <div className={S.keepPasswordBox}>
        <h2>{browser.i18n.getMessage('keep_password_popup_header')}</h2>
        <div className={S.keepPasswordBoxLoginItem}>
          <SmallLoginItem
            deviceId={state?.deviceId}
            vaultId={state?.vaultId}
            itemId={state?.itemId}
            state={state}
            setAutofillFailed={setAutofillFailed}
          />
        </div>
        <div className={S.keepPasswordBoxButtons}>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            onClick={handleKeepPassword}
          >
            {browser.i18n.getMessage('keep_password_popup_keep')}
          </button>
          <button
            className={`${bS.btn} ${bS.btnClear}`}
            onClick={handleDontKeepPassword}
          >
            {browser.i18n.getMessage('keep_password_popup_dont_keep')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(KeepPassword);
