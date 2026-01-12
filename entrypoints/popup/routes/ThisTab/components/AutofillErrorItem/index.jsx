// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './styles/AutofillErrorItem.module.scss';
import generateIcon from '../../functions/serviceList/generateIcon';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import getItem from '@/partials/sessionStorage/getItem';
import AutofillErrorItemData from './components/AutofillErrorItemData';
import generateEncryptionAESKey from '@/partials/WebSocket/utils/generateEncryptionAESKey';
import getKey from '@/partials/sessionStorage/getKey';
import { ENCRYPTION_KEYS } from '@/constants';

/**
* Function to render an autofill error item.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function AutofillErrorItem (props) {
  const [faviconError, setFaviconError] = useState(false);
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

      if (sifData.length > 0 && props.state.hkdfSaltAB && props.state.sessionKeyForHKDF) {
        try {
          const encryptionItemT2Key = await generateEncryptionAESKey(
            props.state.hkdfSaltAB,
            ENCRYPTION_KEYS.ITEM_T2.crypto,
            props.state.sessionKeyForHKDF,
            true
          );

          const encryptionItemT2KeyAESRaw = await window.crypto.subtle.exportKey('raw', encryptionItemT2Key);
          const encryptionItemT2KeyAES_B64 = ArrayBufferToBase64(encryptionItemT2KeyAESRaw);

          const itemT2Key = await getKey(ENCRYPTION_KEYS.ITEM_T2.sK, { deviceId: props.deviceId, itemId: props.itemId });
          await storage.setItem(`session:${itemT2Key}`, encryptionItemT2KeyAES_B64);

          fetchedItem.setSifEncrypted(sifData);
        } catch (e) {
          await CatchError(e);
        }
      }
    }

    setItem(fetchedItem);
  }, [props?.deviceId, props?.vaultId, props?.itemId, props?.state]);

  useEffect(() => {
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
          {generateIcon(item, faviconError, setFaviconError)}
          <p>{item?.content?.name || browser.i18n.getMessage('no_item_name')}</p>
        </div>
        <AutofillErrorItemData item={item} />
      </div>
    </div>
  );
}

export default memo(AutofillErrorItem);
