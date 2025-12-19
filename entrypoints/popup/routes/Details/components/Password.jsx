// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { motion } from 'motion/react';
import { copyValue, isText } from '@/partials/functions';
import { findPasswordChangeUrl } from '../functions/checkPasswordChangeSupport';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import usePopupState from '../../../store/popupState/usePopupState';
import Login from '@/models/itemModels/Login';
import getItem from '@/partials/sessionStorage/getItem';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import RefreshIcon from '@/assets/popup-window/refresh.svg?react';
import ExternalLinkIcon from '@/assets/popup-window/new-tab.svg?react';
import ClearLink from '@/entrypoints/popup/components/ClearLink';

const passwordMobileVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '18px' }
};

const changePasswordVariants = {
  hidden: { maxHeight: '0px', opacity: 0 },
  visible: { maxHeight: '16px', opacity: 1 }
};

 /**
* Function to render the password input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Password (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const { data, setData } = usePopupState();

  const [changePasswordUrl, setChangePasswordUrl] = useState(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
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

    if (data.item instanceof Login) {
      return data.item;
    }

    try {
      return new Login(data.item);
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
      setLocalDecryptedPassword(decryptedData.password);
      setData('sifDecryptError', false);
      return decryptedData.password;
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

    if (!data?.passwordEditable && !data?.passwordVisible) {
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
    const needsDecryption = (data?.passwordVisible || data?.passwordEditable) &&
                           localDecryptedPassword === null &&
                           !isDecrypting &&
                           itemInstance?.sifExists;

    if (needsDecryption) {
      decryptPasswordOnDemand();
    }
  }, [data?.passwordVisible, data?.passwordEditable, localDecryptedPassword, isDecrypting, itemInstance?.sifExists, decryptPasswordOnDemand]);

  useEffect(() => {
    if (data?.passwordEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [data?.passwordEditable]);

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
        <span>{browser.i18n.getMessage('details_password_decrypt_error')}</span>
      </div>
    );
  };

  useEffect(() => {
    const checkChangePasswordSupport = async () => {
      if (!data.item?.internalData?.normalizedUris || data?.item?.internalData?.normalizedUris?.length === 0) {
        setChangePasswordUrl(null);
        return;
      }
      
      setCheckingUrl(true);

      try {
        const url = await findPasswordChangeUrl(data.item.internalData.normalizedUris);
        setChangePasswordUrl(url);
      } catch (e) {
        setChangePasswordUrl(null);
        CatchError(e);
      } finally {
        setCheckingUrl(false);
      }
    };
    
    checkChangePasswordSupport();
  }, []);

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

      await copyValue(passwordToCopy, itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id, 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
      return;
    }
  };

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={pI.passInputTooltip}>
        <span>{browser.i18n.getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handlePasswordOnMobileChange = () => {
    setData('passwordMobile', !data?.passwordMobile);
  };

  const handleEditableClick = async () => {
    if (data?.passwordEditable) {
      let item = await getItem(itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id);

      const itemData = item.toJSON();
      const restoredItem = new Login(itemData);

      item = null;

      setLocalDecryptedPassword(null);
      setIsFocused(false);
      setData('item', restoredItem);
      setData('passwordEditable', false);
      form.change('editedSif', '');
    } else {
      await decryptPasswordOnDemand();
      setData('passwordVisible', false);
      setData('passwordEditable', true);
    }
  };

  const handlePasswordVisibleClick = async () => {
    if (!data?.passwordVisible) {
      await decryptPasswordOnDemand();
    }

    setData('passwordVisible', !data?.passwordVisible);
  };
  
  const handleChangePasswordClick = async e => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!changePasswordUrl) {
      return;
    }
    
    await browser.tabs.create({ url: changePasswordUrl });
  };

  const updateItemWithPassword = useCallback(async passwordValue => {
    const currentItem = latestItemRef.current;

    if (!currentItem) {
      return;
    }

    try {
      const itemData = typeof currentItem.toJSON === 'function' ? currentItem.toJSON() : currentItem;
      const localItem = new Login(itemData);
      await localItem.setSif([{ s_password: passwordValue }]);

      if (latestPasswordRef.current !== passwordValue) {
        return;
      }

      const localItemJSON = localItem.toJSON();
      latestItemRef.current = localItemJSON;
      setData('item', localItemJSON);

      latestPasswordRef.current = null;
    } catch (e) {
      CatchError(e);
    }
  }, [setData]);

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
          <div className={`${pI.passInput} ${!data?.passwordEditable || data?.passwordMobile || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor='editedSif'>{browser.i18n.getMessage('password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
                tabIndex={-1}
              >
                {data?.passwordEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              <input
                ref={inputRef}
                value={getPasswordValue()}
                type={data?.passwordVisible || (data?.passwordEditable && isFocused) ? 'text' : 'password'}
                placeholder={!sifDecryptError && !isDecrypting && (!data?.passwordMobile && originalItem?.isT3orT2WithSif || data?.passwordEditable) ? browser.i18n.getMessage('placeholder_password') : ''}
                id='editedSif'
                onChange={handlePasswordChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={!data?.passwordEditable || data?.passwordMobile || sifDecryptError}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              <div className={pI.passInputBottomButtons}>
                <ClearLink
                  to='/password-generator'
                  className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton} ${!data?.passwordEditable || data?.passwordMobile || sifDecryptError ? pI.hiddenButton : ''}`}
                  title={browser.i18n.getMessage('details_generate_password')}
                  state={{ from: 'details', data: { item: data.item } }}
                >
                  <RefreshIcon />
                </ClearLink>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${!originalItem?.isT3orT2WithSif || data?.passwordEditable || sifDecryptError ? pI.hiddenButton : ''}`}
                  title={browser.i18n.getMessage('details_toggle_password_visibility')}
                  tabIndex={-1}
                >
                  <VisibleIcon />
                </button>
                {((originalItem?.securityType === SECURITY_TIER.SECRET || itemInstance?.sifExists) && !sifDecryptError) && (
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={handleCopyPassword}
                    title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                    tabIndex={-1}
                  >
                    <CopyIcon />
                  </button>
                )}
              </div>

              {generateSecurityTypeTooltip(originalItem)}
              {generateErrorOverlay()}
            </div>
            <motion.div
              className={`${pI.passInputAdditional} ${data?.passwordEditable ? '' : pI.removeMarginTop}`}
              variants={passwordMobileVariants}
              initial="hidden"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              animate={data?.passwordEditable ? 'visible' : 'hidden'}
            >
              <div className={`${bS.passToggle} ${bS.loaded}`}>
                <input type="checkbox" name="password-mobile" id="password-mobile" checked={data?.passwordMobile || false} onChange={handlePasswordOnMobileChange} />
                <label htmlFor="password-mobile">
                  <span className={bS.passToggleBox}>
                    <span className={bS.passToggleBoxCircle}></span>
                  </span>

                  <span className={bS.passToggleText}>
                    <span>{browser.i18n.getMessage('autogenerate_on_mobile')}</span>
                  </span>
                </label>
              </div>
            </motion.div>
            {!checkingUrl && changePasswordUrl && (
              <motion.div
                className={pI.passInputLink}
                variants={changePasswordVariants}
                initial="hidden"
                transition={{ duration: 0.2, ease: 'easeOut' }}
                animate={changePasswordUrl ? 'visible' : 'hidden'}
              >
                <button
                  type="button"
                  onClick={handleChangePasswordClick}
                  className={`${bS.btn} ${bS.btnClear} ${pI.passInputLinkButton}`}
                  title={browser.i18n.getMessage('details_change_password_in_service_title')}
                >
                  <span>{browser.i18n.getMessage('details_change_password_in_service')}</span>
                  <ExternalLinkIcon />
                </button>
              </motion.div>
            )}
          </div>
        )}
      </Field>
  );
}

export default Password;
