// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

function WifiSsid (props) {
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();
  const inputRef = useRef(null);
  const hasFocusedRef = useRef(false);

  const { formData } = props;
  const { inputError } = formData;

  const isSsidInvalid = useMemo(() => {
    const ssid = data?.item?.content?.ssid;

    if (!ssid || ssid.length === 0) {
      return false;
    }

    return ssid.length > 255;
  }, [data?.item?.content?.ssid]);

  const handleCopySsid = useCallback(async ssid => {
    try {
      await copyValue(ssid || '', data.item.deviceId, data.item.vaultId, data.item.id, 'ssid');
      showToast(getMessage('notification_wifi_ssid_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_wifi_ssid_copy_failed'), 'error');
      await CatchError(e);
    }
  }, [data.item.id]);

  const handleSsidEditable = async () => {
    if (data.ssidEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { ssid: item.content.ssid },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('ssidEditable', false);
    } else {
      setData('ssidEditable', true);
    }
  };

  const handleSsidChange = useCallback(async e => {
    const newSsid = e.target.value;

    const updatedItem = await updateItem(data.item, {
      content: { ssid: newSsid },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  useEffect(() => {
    if (data.ssidEditable && inputRef.current && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      inputRef.current.focus();
    }

    if (!data.ssidEditable) {
      hasFocusedRef.current = false;
    }
  }, [data.ssidEditable]);

  return (
    <Field name="content.ssid">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.ssidEditable ? '' : pI.disabled} ${inputError === 'ssid' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="ssid">{getMessage('details_wifi_network')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleSsidEditable}
              tabIndex={-1}
            >
              {data.ssidEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              ref={inputRef}
              className={isSsidInvalid ? pI.inputTextError : ''}
              onChange={e => {
                input.onChange(e);
                handleSsidChange(e);
              }}
              placeholder={getMessage('placeholder_wifi_ssid')}
              id="ssid"
              disabled={!data.ssidEditable ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
            />
            <button
              type='button'
              className={`${bS.btn} ${pI.iconButton}`}
              onClick={() => handleCopySsid(input.value)}
              title={getMessage('this_tab_copy_to_clipboard')}
              tabIndex={-1}
            >
              <CopyIcon />
            </button>
          </div>
        </div>
      )}
    </Field>
  );
}

export default WifiSsid;
