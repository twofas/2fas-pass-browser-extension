// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/KeepItem.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useMemo, useState, useEffect, memo } from 'react';
import { useLocation } from 'react-router';
import { useKeepItem } from './hooks/useKeepItem';
import AutofillErrorItem from '../AutofillErrorItem';

/**
* Component displaying keep item popup after failed autofill.
* @return {JSX.Element} The rendered keep item popup component.
*/
function KeepItem () {
  const location = useLocation();
  const { state } = location;
  const [autofillFailed, setAutofillFailed] = useState(false);
  const { handleKeepItem, handleDontKeepItem } = useKeepItem(state, setAutofillFailed);

  const containerClass = useMemo(() => {
    return `${S.keepItem} ${autofillFailed ? S.active : ''}`;
  }, [autofillFailed]);

  useEffect(() => {
    // if (location?.state?.action === 'autofillT2Failed' || location?.state?.action === 'autofillCardT2Failed') {
    //   setAutofillFailed(true);
    // } else {
    //   setAutofillFailed(false);
    // }
    setAutofillFailed(true); // debug
  }, [location?.state]);

  return (
    <div className={containerClass}>
      <div className={S.keepItemBox}>
        <h2>{browser.i18n.getMessage('keep_item_popup_header')}</h2>

        <div className={S.keepItemBoxLoginItem}>
          <AutofillErrorItem
            // deviceId={state?.deviceId}
            // vaultId={state?.vaultId}
            // itemId={state?.itemId}
            deviceId="6CC62DF5-702A-4770-8331-69EEF99B4853"
            vaultId="af43f163-eec4-4153-99a7-a1bb2829a137"
            itemId="0361f9a4-32e9-4649-819d-8769cf14da07"
            state={state}
            setAutofillFailed={setAutofillFailed}
          />
        </div>
        
        <div className={S.keepItemBoxButtons}>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            onClick={handleKeepItem}
          >
            {browser.i18n.getMessage('keep_item_popup_keep')}
          </button>
          <button
            className={`${bS.btn} ${bS.btnClear}`}
            onClick={handleDontKeepItem}
          >
            {browser.i18n.getMessage('keep_item_popup_dont_keep')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(KeepItem);
