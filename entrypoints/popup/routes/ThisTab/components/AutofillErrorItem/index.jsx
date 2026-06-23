// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/AutofillErrorItem.module.scss';
import ItemIcon from '@/entrypoints/popup/components/ItemIcon';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import getItem from '@/partials/sessionStorage/getItem';
import AutofillErrorItemData from './components/AutofillErrorItemData';
import getKey from '@/partials/sessionStorage/getKey';
import { ENCRYPTION_KEYS } from '@/constants';

/**
* Function to render an autofill error item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AutofillErrorItem (props) {
  const { getMessage } = useI18n();
  const [item, setItem] = useState(null);
  const ref = useRef(null);

  const getItemData = useCallback(async () => {
    if (!props?.deviceId || !props?.vaultId || !props?.itemId) {
      return false;
    }

    const fetchedItem = await getItem(props.deviceId, props.vaultId, props.itemId);

    if (fetchedItem && props.state && typeof fetchedItem.setSifEncrypted === 'function') {
      const sifData = [];

      if (props.state.s_password) {
        sifData.push({ s_password: props.state.s_password });
      }

      if (props.state.s_cardNumber) {
        sifData.push({ s_cardNumber: props.state.s_cardNumber });
      }

      if (props.state.s_expirationDate) {
        sifData.push({ s_expirationDate: props.state.s_expirationDate });
      }

      if (props.state.s_securityCode) {
        sifData.push({ s_securityCode: props.state.s_securityCode });
      }

      if (sifData.length > 0 && props.state.encryptionItemT2KeyB64) {
        try {
          // The autofill flow forwarded the raw ItemT2 key (Base64); store it so the SIF stays
          // decryptable. Re-deriving from the HKDF session key is impossible — it is
          // non-serializable and never reaches the popup intact (finding #29).
          const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: props.deviceId, itemId: props.itemId });
          await storage.setItem(`session:${itemT2Key}`, props.state.encryptionItemT2KeyB64);

          logger.debug(LOGGER_CONSTANTS.CATEGORIES.STORAGE, 'Popup - session write - AutofillErrorItem');

          fetchedItem.setSifEncrypted(sifData);
        } catch (e) {
          await CatchError(e);
        }
      }
    }

    setItem(fetchedItem);
  }, [props?.deviceId, props?.vaultId, props?.itemId, props?.state]);

  useEffect(function loadAutofillErrorItemData() {
    getItemData();
  }, [getItemData]);

  if (!item) {
    return null;
  }

  return (
    <div
      key={item.id}
      className={S.autofillErrorItem}
      ref={ref}
    >
      <div className={S.autofillErrorItemContent}>
        <div className={S.autofillErrorItemContentHeader}>
          <ItemIcon item={item} />
          <p>{item?.content?.name || getMessage('no_item_name')}</p>
        </div>
        <AutofillErrorItemData item={item} />
      </div>
    </div>
  );
}

export default memo(AutofillErrorItem);
