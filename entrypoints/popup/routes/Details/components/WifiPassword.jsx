// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { copyValue, isText } from '@/partials/functions';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import usePopupState from '../../../store/popupState/usePopupState';
import Wifi from '@/models/itemModels/Wifi';
import getItem from '@/partials/sessionStorage/getItem';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

function WifiPassword (props) {
  const { getMessage } = useI18n();
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const { data, setData, setBatchData, setItem } = usePopupState();

  const [localDecryptedPassword, setLocalDecryptedPassword] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const previousPasswordValueRef = useRef(null);
  const inputRef = useRef(null);
  const latestItemRef = useRef(data.item);
  const latestPasswordRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  const itemInstance = useMemo(() => {
    if (!data.item) {
      return null;
    }

    if (data.item instanceof Wifi) {
      return data.item;
    }

    try {
      return new Wifi(data.item);
    } catch (e) {
      CatchError(e);
      return null;
    }
  }, [data.item]);

  const decryptPasswordOnDemand = useCallback(async () => {
    if (localDecryptedPassword !== null || isDecrypting || sifDecryptError) {
      return localDecryptedPassword;
    }

    if (!itemInstance?.sifExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await itemInstance.decryptSif();
      setLocalDecryptedPassword(decryptedData.wifiPassword);
      setData('sifDecryptError', false);
      return decryptedData.wifiPassword;
    } catch (e) {
      setData('sifDecryptError', true);
      CatchError(e);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [localDecryptedPassword, isDecrypting, sifDecryptError, itemInstance, setData]);

  const isHighlySecretWithoutSif = originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists;

  const getPasswordValue = () => {
    if (sifDecryptError || isHighlySecretWithoutSif) {
      return '';
    }

    if (!data?.wifiPasswordEditable && !data?.wifiPasswordVisible) {
      return itemInstance?.sifExists ? '******' : '';
    }

    if (isText(localDecryptedPassword)) {
      return localDecryptedPassword;
    }

    return '';
  };

  useEffect(() => {
    const currentPasswordValue = getPasswordValue();

    if (currentPasswordValue !== previousPasswordValueRef.current) {
      form.change('editedSif', currentPasswordValue);
      previousPasswordValueRef.current = currentPasswordValue;
    }
  }, [localDecryptedPassword, form]);

  useEffect(() => {
    const needsDecryption = (data?.wifiPasswordVisible || data?.wifiPasswordEditable) &&
                           localDecryptedPassword === null &&
                           !isDecrypting &&
                           itemInstance?.sifExists;

    if (needsDecryption) {
      decryptPasswordOnDemand();
    }
  }, [data?.wifiPasswordVisible, data?.wifiPasswordEditable, localDecryptedPassword, isDecrypting, itemInstance?.sifExists, decryptPasswordOnDemand]);

  useEffect(() => {
    if (data?.wifiPasswordEditable && inputRef.current) {
      inputRef.current.focus();

      requestAnimationFrame(() => {
        if (inputRef.current) {
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      });
    }
  }, [data?.wifiPasswordEditable]);

  useEffect(() => {
    latestItemRef.current = data.item;
  }, [data.item]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{getMessage('details_wifi_password_decrypt_error')}</span>
      </div>
    );
  };

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    return (
      <div className={pI.passInputTooltip}>
        <span>{getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handleCopyPassword = async () => {
    try {
      let passwordToCopy;

      if (isText(localDecryptedPassword)) {
        passwordToCopy = localDecryptedPassword;
      } else if (itemInstance?.sifExists) {
        passwordToCopy = await decryptPasswordOnDemand();
      } else {
        passwordToCopy = '';
      }

      await copyValue(passwordToCopy, itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id, 'wifiPassword');
      showToast(getMessage('notification_wifi_password_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_wifi_password_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleEditableClick = async () => {
    if (data?.wifiPasswordEditable) {
      let item = await getItem(itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id);

      const itemData = item.toJSON();
      const restoredItem = new Wifi(itemData);

      item = null;

      setLocalDecryptedPassword(null);
      setIsFocused(false);
      setItem(restoredItem);
      setData('wifiPasswordEditable', false);
      form.change('editedSif', '');
    } else {
      const decryptedPassword = await decryptPasswordOnDemand();
      setBatchData({
        wifiPasswordVisible: false,
        wifiPasswordEditable: true,
        editedSif: decryptedPassword || ''
      });
    }
  };

  const handlePasswordVisibleClick = async () => {
    if (!data?.wifiPasswordVisible) {
      await decryptPasswordOnDemand();
    }

    setData('wifiPasswordVisible', !data?.wifiPasswordVisible);
  };

  const updateItemWithPassword = useCallback(async passwordValue => {
    const currentItem = latestItemRef.current;

    if (!currentItem) {
      return;
    }

    try {
      const itemData = typeof currentItem.toJSON === 'function' ? currentItem.toJSON() : currentItem;
      const localItem = new Wifi(itemData);

      await localItem.setSif([{ s_wifi_password: passwordValue }]);

      if (latestPasswordRef.current !== passwordValue) {
        return;
      }

      latestItemRef.current = localItem.toJSON();
      setItem(localItem);

      latestPasswordRef.current = null;
    } catch (e) {
      CatchError(e);
    }
  }, [setItem]);

  useEffect(() => {
    const flushPendingUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;

        if (latestPasswordRef.current !== null) {
          updateItemWithPassword(latestPasswordRef.current);
        }
      }
    };

    const handleBeforeUnload = () => {
      flushPendingUpdate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingUpdate();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flushPendingUpdate();
    };
  }, [updateItemWithPassword]);

  const handlePasswordChange = e => {
    const newValue = e.target.value;

    latestPasswordRef.current = newValue;
    setLocalDecryptedPassword(newValue);
    form.change('editedSif', newValue);
    setData('editedSif', newValue);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    const debounceTime = 50;
    updateTimeoutRef.current = setTimeout(() => {
      updateItemWithPassword(newValue);
    }, debounceTime);
  };

  return (
    <Field name="editedSif">
      {() => (
          <div className={`${pI.passInput} ${!data?.wifiPasswordEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor='editedSif'>{getMessage('wifi_password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
                tabIndex={-1}
              >
                {data?.wifiPasswordEditable ? getMessage('cancel') : getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              <input
                ref={inputRef}
                value={getPasswordValue()}
                type={data?.wifiPasswordVisible || (data?.wifiPasswordEditable && isFocused) ? 'text' : 'password'}
                placeholder={!sifDecryptError && !isDecrypting && originalItem?.isT3orT2WithSif || data?.wifiPasswordEditable ? getMessage('placeholder_wifi_password') : ''}
                id='editedSif'
                onChange={handlePasswordChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={!data?.wifiPasswordEditable || sifDecryptError}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              <div className={pI.passInputBottomButtons}>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${!originalItem?.isT3orT2WithSif || data?.wifiPasswordEditable || sifDecryptError ? pI.hiddenButton : ''}`}
                  title={getMessage('details_wifi_toggle_password_visibility')}
                  tabIndex={-1}
                >
                  <VisibleIcon />
                </button>
                {((originalItem?.securityType === SECURITY_TIER.SECRET || itemInstance?.sifExists) && !sifDecryptError) && (
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={handleCopyPassword}
                    title={getMessage('this_tab_copy_to_clipboard')}
                    tabIndex={-1}
                  >
                    <CopyIcon />
                  </button>
                )}
              </div>

              {generateSecurityTypeTooltip(originalItem)}
              {generateErrorOverlay()}
            </div>
          </div>
        )}
      </Field>
  );
}

export default WifiPassword;
