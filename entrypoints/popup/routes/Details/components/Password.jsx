// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { Link } from 'react-router';
import { copyValue } from '@/partials/functions';
import { findPasswordChangeUrl } from '../functions/checkPasswordChangeSupport';
import { useState, useEffect, useRef } from 'react';
import usePopupStateStore from '../../../store/popupState';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));
const ExternalLinkIcon = lazy(() => import('@/assets/popup-window/new-tab.svg?react'));
const PasswordInput = lazy(() => import('@/entrypoints/popup/components/PasswordInput'));

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
  const { passwordDecryptError, formData } = props;
  const { form } = formData;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const [changePasswordUrl, setChangePasswordUrl] = useState(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  const previousPasswordValueRef = useRef(null);

  const getPasswordValue = () => {
    if (data.item.internalData.editedPassword !== null) {
      return data.item.internalData.editedPassword;
    }

    if (data.item.isPasswordDecrypted) {
      return data.item.passwordDecrypted;
    }

    return '';
  };

  useEffect(() => {
    const currentPasswordValue = getPasswordValue();

    if (currentPasswordValue !== previousPasswordValueRef.current) {
      form.change('editedPassword', currentPasswordValue);
      previousPasswordValueRef.current = currentPasswordValue;
    }
  }, [data.item.internalData.editedPassword, data.item.passwordDecrypted, form]);

  const generateErrorOverlay = () => {
    if (!passwordDecryptError) {
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

      if (data.item.internalData.editedPassword !== null) {
        passwordToCopy = data.item.internalData.editedPassword;
      } else if (data.item.isPasswordDecrypted) {
        passwordToCopy = data.item.passwordDecrypted;
      } else if (data.item.sifExists) {
        let decryptedData = await data.item.decryptSif();
        passwordToCopy = decryptedData.password;
        decryptedData = null;
      } else {
        passwordToCopy = '';
      }

      await copyValue(passwordToCopy, data.item.deviceId, data.item.vaultId, data.item.id, 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
      return;
    }
  };

  const generateSecurityTypeTooltip = item => {
    if (item.isT3orT2WithPassword) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={pI.passInputTooltip}>
        <span>This information is only available on your mobile phone. Click the "Fetch" button at the top of this window to retrieve it.</span>
      </div>
    );
  };

  const handlePasswordOnMobileChange = () => {
    setData('passwordMobile', !data?.passwordMobile);
  };

  const handleEditableClick = () => {
    if (data?.passwordEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isPasswordDecrypted) {
        updatedItem.setPasswordDecrypted(data.item.passwordDecrypted);
      }

      updatedItem.internalData.editedPassword = null;

      setData('item', updatedItem);
      setData('passwordEdited', false);
      setData('passwordEditable', false);
      form.change('editedPassword', data.item.isPasswordDecrypted ? data.item.passwordDecrypted : '');
    } else {
      setData('passwordEditable', true);
    }
  };

  const handlePasswordVisibleClick = () => {
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

  const handlePasswordChange = e => {
    const newValue = e.target.value;
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isPasswordDecrypted) {
      updatedItem.setPasswordDecrypted(data.item.passwordDecrypted);
    }

    updatedItem.internalData.editedPassword = newValue;

    setData('item', updatedItem);
    form.change('editedPassword', newValue);
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name="editedPassword">
        {({ input }) => (
          <div className={`${pI.passInput} ${!data?.passwordEditable || data?.passwordMobile ? pI.disabled : ''} ${!data.item.isT3orT2WithPassword ? pI.nonFetched : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor="editedPassword">{browser.i18n.getMessage('password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!data.item.isT3orT2WithPassword ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
              >
                {data?.passwordEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              <PasswordInput
                value={getPasswordValue()}
                type={data?.passwordVisible ? 'text' : 'password'}
                placeholder={!data?.passwordMobile && data.item.isT3orT2WithPassword || data?.passwordEditable ? browser.i18n.getMessage('placeholder_password') : ''}
                id='editedPassword'
                onChange={handlePasswordChange}
                showPassword={data?.passwordVisible}
                isDecrypted={data.item.isPasswordDecrypted || data.item.internalData.editedPassword !== null}
                state={!data.item.isT3orT2WithPassword ? 'nonFetched' : ''}
                disabled={!data?.passwordEditable || data?.passwordMobile}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              <div className={pI.passInputBottomButtons}>
                <Link
                  to='/password-generator'
                  className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton} ${!data?.passwordEditable || data?.passwordMobile ? pI.hiddenButton : ''}`}
                  title={browser.i18n.getMessage('details_generate_password')}
                  state={{ from: 'details', data }}
                >
                  <RefreshIcon />
                </Link>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${!(data.item.isT3orT2WithPassword || data?.passwordEditable) ? pI.hidden : ''}`}
                  title={browser.i18n.getMessage('details_toggle_password_visibility')}
                >
                  <VisibleIcon />
                </button>
                {(data.item.securityType === SECURITY_TIER.SECRET || (data.item.passwordEncrypted && data.item.passwordEncrypted.length > 0)) && (
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={handleCopyPassword}
                    title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                  >
                    <CopyIcon />
                  </button>
                )}
              </div>

              {generateSecurityTypeTooltip(data.item)}
              {generateErrorOverlay()}
            </div>
            <m.div
              className={`${pI.passInputAdditional} ${data?.passwordEditable ? '' : pI.removeMarginTop}`}
              variants={passwordMobileVariants}
              initial="hidden"
              transition={{ duration: 0.3 }}
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
            </m.div>
            {!checkingUrl && changePasswordUrl && (
              <m.div
                className={pI.passInputLink}
                variants={changePasswordVariants}
                initial="hidden"
                transition={{ duration: .3 }}
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
              </m.div>
            )}
          </div>
        )}
      </Field>
    </LazyMotion>
  );
}

export default Password;
