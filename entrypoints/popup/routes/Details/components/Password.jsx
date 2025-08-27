// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useCallback } from 'react';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { Link } from 'react-router';
import isT3orT2WithPassword from '@/partials/functions/isT3orT2WithPassword';
import decryptPassword from '@/partials/functions/decryptPassword';
import copyValue from '../../ThisTab/functions/serviceList/copyValue';
import { findPasswordChangeUrl } from '../functions/checkPasswordChangeSupport';
import { useState, useEffect } from 'react';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));
const RefreshIcon = lazy(() => import('@/assets/popup-window/refresh.svg?react'));
const ExternalLinkIcon = lazy(() => import('@/assets/popup-window/new-tab.svg?react'));
const PasswordInput = lazy(() => import('@/entrypoints/popup/components/PasswordInput'));

const passwordDescriptionVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '31px' }
};

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
  const { data, actions } = props;
  const { service, passwordEditable, passwordVisible, passwordMobile, passwordDecryptError, form } = data;
  const { setPasswordEditable, setPasswordVisible, setPasswordMobile, setPasswordDecryptError} = actions;
  const [changePasswordUrl, setChangePasswordUrl] = useState(null);
  const [checkingUrl, setCheckingUrl] = useState(false);
  
  useEffect(() => {
    const checkChangePasswordSupport = async () => {
      if (!service?.uris || service.uris.length === 0) {
        setChangePasswordUrl(null);
        return;
      }
      
      setCheckingUrl(true);
      try {
        const url = await findPasswordChangeUrl(service.uris);
        setChangePasswordUrl(url);
      } catch (e) {
        setChangePasswordUrl(null);
        CatchError(e);
      } finally {
        setCheckingUrl(false);
      }
    };
    
    checkChangePasswordSupport();
  }, [service?.uris]);

  const handleCopyPassword = useCallback(async () => {
    try {
      let passwordToCopy;
      
      const currentPassword = form.getFieldState('password').value;
      
      if (currentPassword && currentPassword !== '******') {
        passwordToCopy = currentPassword;
      } else if (service?.passwordEncrypted && service?.passwordEncrypted?.length > 0) {
        const tempService = { ...service, password: service.passwordEncrypted };
        passwordToCopy = await decryptPassword(tempService);
      } else {
        passwordToCopy = '';
      }
      
      await copyValue(passwordToCopy, service.id, 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  }, [service, form]);

  const generateSecurityTypeOverlay = service => {
    if (isT3orT2WithPassword(service)) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={`${pI.passInputBottomOverlay} ${passwordEditable ? pI.hidden : ''}`}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_password_overlay')}</span>
      </div>
    );
  };

  const generateErrorOverlay = () => {
    if (!passwordDecryptError) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_password_decrypt_error')}</span>
      </div>
    );
  };

  const generateSecurityTypeDescription = service => {
    if (isT3orT2WithPassword(service)) {
      return null;
    }

    return (
      <m.div
        className={`${pI.passInputDescription} ${passwordEditable ? '' : pI.removeMarginTop}`}
        variants={passwordDescriptionVariants}
        initial="hidden"
        transition={{ duration: 0.3 }}
        animate={passwordEditable ? 'visible' : 'hidden'}
      >
        <p>{browser.i18n.getMessage('details_password_description')}</p>
      </m.div>
    );
  };

  const handlePasswordOnMobileChange = async () => {
    if (!passwordMobile) {
      await decryptFormPassword();
    }

    setPasswordMobile(!passwordMobile);
  };

  const decryptFormPassword = async () => {
    if (service?.passwordEncrypted && service?.passwordEncrypted?.length > 0) {
      try {
        service.password = service.passwordEncrypted;
        const decryptedPassword = await decryptPassword(service);
        form.change('password', decryptedPassword);
      } catch (e) {
        setPasswordDecryptError(true);
        await CatchError(e);
      }
    } else {
      service.password = '';
      form.change('password', '');
    }
  };

  const encryptFormPassword = () => {
    if (service.passwordEncrypted && service.passwordEncrypted.length > 0) {
      service.password = '******';
      form.change('password', '******');
    }
  };

  const handleEditableClick = async () => {
    if (passwordEditable) {
      setPasswordEditable(false);
      service.passwordEdited = null;
      
      if (!passwordVisible) {
        encryptFormPassword();
      } else {
        await decryptFormPassword();
      }
    } else {
      await decryptFormPassword();
      setPasswordEditable(true);
    }
  };

  const handlePasswordVisibleClick = async () => {
    if (passwordEditable) {
      if (passwordVisible) {
        if (service.password !== '******') {
          const passwordFieldValue = form.getFieldState('password').value;
          service.passwordEdited = passwordFieldValue;
        }
      } else {
        if (service.password === '******') {
          if (service.passwordEdited && service.passwordEdited.length > 0) {
            service.password = service.passwordEdited;
            form.change('password', service.passwordEdited);
            service.passwordEdited = null;
          } else {
            await decryptFormPassword();
          }
        }
      }
    } else {
      if (passwordVisible) {
        if (service.password !== '******') {
          encryptFormPassword();
        }
      } else {
        if (service.password === '******') {
          await decryptFormPassword();
        }
      }
    }

    setPasswordVisible(!passwordVisible);
  };
  
  const handleChangePasswordClick = async e => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!changePasswordUrl) return;
    
    await browser.tabs.create({ url: changePasswordUrl });
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name="password">
        {({ input }) => (
          <div className={`${pI.passInput} ${passwordEditable ? '' : pI.disabled}`}>
            <div className={pI.passInputTop}>
              <label htmlFor="password">{browser.i18n.getMessage('password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear}`}
                onClick={handleEditableClick}
              >
                {passwordEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            {generateSecurityTypeDescription(service)}
            <div className={pI.passInputBottom}>
              <PasswordInput
                {...input}
                type={passwordVisible ? 'text' : 'password'}
                placeholder={!passwordMobile && !passwordDecryptError && isT3orT2WithPassword(service) || passwordEditable ? browser.i18n.getMessage('placeholder_password') : ''}
                id="password"
                showPassword={passwordVisible}
                isDecrypted={service.password !== '******'}
                className={!passwordEditable && !isT3orT2WithPassword(service) ? pI.hiddenValue : ''}
                disabled={!passwordEditable || passwordMobile}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              <div className={pI.passInputBottomButtons}>
                <Link
                  to='/password-generator'
                  className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton} ${passwordEditable ? '' : pI.hiddenButton}`}
                  title={browser.i18n.getMessage('details_generate_password')}
                  state={{ from: 'details', serviceId: service?.id }}
                >
                  <RefreshIcon />
                </Link>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${isT3orT2WithPassword(service) || passwordEditable ? '' : pI.hidden}`}
                  title={browser.i18n.getMessage('details_toggle_password_visibility')}
                >
                  <VisibleIcon />
                </button>
                {(service.securityType === SECURITY_TIER.SECRET || (service.passwordEncrypted && service.passwordEncrypted.length > 0)) && (
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

              {generateSecurityTypeOverlay(service)}
              {generateErrorOverlay()}
            </div>
            <m.div
              className={`${pI.passInputAdditional} ${passwordEditable ? '' : pI.removeMarginTop}`}
              variants={passwordMobileVariants}
              initial="hidden"
              transition={{ duration: 0.3 }}
              animate={passwordEditable ? 'visible' : 'hidden'}
            >
              <div className={`${bS.passToggle} ${bS.loaded}`}>
                <input type="checkbox" name="password-mobile" id="password-mobile" onChange={handlePasswordOnMobileChange} />
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
