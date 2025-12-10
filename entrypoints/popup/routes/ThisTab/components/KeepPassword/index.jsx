// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../ThisTab.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useMemo, memo } from 'react';
import { useKeepPassword } from './hooks/useKeepPassword';
import SmallLoginItem from '../SmallLoginItem';

/**
* Component displaying keep password popup after successful autofill.
* @param {Object} props - The component props.
* @param {boolean} props.isActive - Whether the popup is active/visible.
* @param {Object} props.state - The location state containing password data.
* @param {Function} props.setAutofillFailed - Function to set autofill failed state.
* @return {JSX.Element} The rendered keep password popup component.
*/
function KeepPassword ({ isActive, state, setAutofillFailed }) {
  const { handleKeepPassword, handleDontKeepPassword } = useKeepPassword(state, setAutofillFailed);

  const containerClass = useMemo(() => {
    return `${S.thisTabAutofillPopup} ${isActive ? S.active : ''}`;
  }, [isActive]);

  return (
    <div className={containerClass}>
      <div className={S.thisTabAutofillPopupBox}>
        <h2>{browser.i18n.getMessage('this_tab_autofill_password_popup_header')}</h2>
        <div className={S.thisTabAutofillPopupBoxLoginItem}>
          <SmallLoginItem
            deviceId={state?.deviceId}
            vaultId={state?.vaultId}
            itemId={state?.itemId}
            state={state}
            setAutofillFailed={setAutofillFailed}
          />
        </div>
        <div className={S.thisTabAutofillPopupBoxButtons}>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            onClick={handleKeepPassword}
          >
            {browser.i18n.getMessage('this_tab_autofill_password_popup_keep')}
          </button>
          <button
            className={`${bS.btn} ${bS.btnClear}`}
            onClick={handleDontKeepPassword}
          >
            {browser.i18n.getMessage('this_tab_autofill_password_popup_dont_keep')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(KeepPassword);
