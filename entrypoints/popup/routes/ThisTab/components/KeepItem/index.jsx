// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/KeepItem.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useMemo, useState, useEffect, memo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { useLocation } from 'react-router';
import { useKeepItem } from './hooks/useKeepItem';
import AutofillErrorItem from '../AutofillErrorItem';

/**
* Component displaying keep item popup after failed autofill.
* @return {JSX.Element} The rendered keep item popup component.
*/
function KeepItem () {
  const { getMessage } = useI18n();
  const location = useLocation();
  const { state } = location;
  const [autofillFailed, setAutofillFailed] = useState(false);
  const { handleKeepItem, handleDontKeepItem } = useKeepItem(state, setAutofillFailed);

  const containerClass = useMemo(() => {
    return `${S.keepItem} ${autofillFailed ? S.active : ''}`;
  }, [autofillFailed]);

  useEffect(() => {
    if (location?.state?.action === 'autofillT2Failed' || location?.state?.action === 'autofillCardT2Failed') {
      setAutofillFailed(true);
    } else {
      setAutofillFailed(false);
    }
  }, [location?.state]);

  return (
    <div className={containerClass}>
      <div className={S.keepItemBox}>
        <h2>{getMessage('keep_item_popup_header')}</h2>

        <div className={S.keepItemBoxLoginItem}>
          <AutofillErrorItem
            deviceId={state?.deviceId}
            vaultId={state?.vaultId}
            itemId={state?.itemId}
            state={state}
            setAutofillFailed={setAutofillFailed}
          />
        </div>
        
        <div className={S.keepItemBoxButtons}>
          <button
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            onClick={handleKeepItem}
          >
            {getMessage('keep_item_popup_keep')}
          </button>
          <button
            className={`${bS.btn} ${bS.btnClear}`}
            onClick={handleDontKeepItem}
          >
            {getMessage('keep_item_popup_dont_keep')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(KeepItem);
