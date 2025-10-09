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
import { copyValue } from '@/partials/functions';
import { findPasswordChangeUrl } from '../functions/checkPasswordChangeSupport';
import { useState, useEffect } from 'react';
import usePopupStateStore from '../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';
import Login from '@/partials/models/Login';

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
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { form } = formData;

  // const { data, actions, generatorData } = props;
  // const { service, passwordEditable, passwordVisible, passwordMobile, form } = data;
  // const { setPasswordEditable, setPasswordVisible, setPasswordMobile, updateFormValues } = actions;
  const [passwordDecryptError, setPasswordDecryptError] = useState(false);
  const [changePasswordUrl, setChangePasswordUrl] = useState(null);
  const [checkingUrl, setCheckingUrl] = useState(false);

  useEffect(() => {
    const checkChangePasswordSupport = async () => {
      if (!data.item?.normalizedUris || data.item.normalizedUris.length === 0) {
        setChangePasswordUrl(null);
        return;
      }
      
      setCheckingUrl(true);

      try {
        const url = await findPasswordChangeUrl(data.item.normalizedUris);
        setChangePasswordUrl(url);
      } catch (e) {
        setChangePasswordUrl(null);
        CatchError(e);
      } finally {
        setCheckingUrl(false);
      }
    };
    
    checkChangePasswordSupport();
  }, [data.item?.normalizedUris]);

  const handleCopyPassword = async () => {
    try {
      let passwordToCopy;
      
      const currentPassword = data.item.s_password;
      
      if (currentPassword && currentPassword !== '******') {
        passwordToCopy = currentPassword;
      } else if (data.item.sifExists) {
        let decryptedData = await data.item.decryptSif();
        passwordToCopy = decryptedData.password;
        decryptedData = null;
      } else {
        passwordToCopy = '';
      }

      await copyValue(passwordToCopy, data.item.id, 'password');
      showToast(browser.i18n.getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
      return;
    }
  };

  const generateSecurityTypeOverlay = item => {
    if (item.isT3orT2WithPassword) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={`${pI.passInputBottomOverlay} ${data?.passwordEditable ? pI.hidden : ''}`}>
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

  const generateSecurityTypeDescription = item => {
    if (item.isT3orT2WithPassword) {
      return null;
    }

    return (
      <m.div
        className={`${pI.passInputDescription} ${data?.passwordEditable ? '' : pI.removeMarginTop}`}
        variants={passwordDescriptionVariants}
        initial='hidden'
        transition={{ duration: 0.3 }}
        animate={data?.passwordEditable ? 'visible' : 'hidden'}
      >
        <p>{browser.i18n.getMessage('details_password_description')}</p>
      </m.div>
    );
  };

  const handlePasswordOnMobileChange = async () => {
    if (!data?.passwordMobile) {
      await decryptFormPassword();
    }

    setData('passwordMobile', !data?.passwordMobile);
  };

  const decryptFormPassword = async () => {
    if (data.item.sifExists) {
      try {
        let decryptedData = await data.item.decryptSif();
        data.item.s_password = decryptedData.password;

        form.change('s_password', decryptedData.password);

        setData('item', data.item);
        setPasswordDecryptError(false);

        decryptedData = null;
      } catch (e) {
        setPasswordDecryptError(true);
        await CatchError(e);
        return;
      }
    } else {
      data.item.s_password = '';
      setData('item', data.item);
      form.change('s_password', '');
    }
  };

  const encryptFormPassword = () => {
    data.item.s_password = '******';
    setData('item', data.item);
    form.change('s_password', '******');
  };

  const handleEditableClick = async () => {
    if (data?.passwordEditable) {
      setData('passwordEditable', false);
      // service.passwordEdited = null;

      if (data?.passwordVisible) {
        // if (service.passwordEncrypted && service.passwordEncrypted.length > 0) {
        //   try {
        //     // @TODO: Fix this!
        //     // const tempService = { ...service, password: service.passwordEncrypted };
        //     // passwordValue = await decrypt_Password(tempService);
        //   } catch (e) {
        //     passwordValue = '******';
        //     setPasswordDecryptError(true);
        //     await CatchError(e);
        //   }
        // } else {
        //   passwordValue = '';
        // }
      } else {
        if (data.item.isT3orT2WithPassword) {
          data.item.s_password = '******';
          setData('item', data.item);
        } else {
          data.item.s_password = '';
          setData('item', data.item);
        }
      }

      form.change('s_password', data.item.s_password);
    } else {
      await decryptFormPassword();
      setData('passwordEditable', true);
    }
  };

  const handlePasswordVisibleClick = async () => {
    console.log('passwordEditable', data?.passwordEditable);
    console.log('passwordVisible', data?.passwordVisible);

    if (data?.passwordEditable) {
      if (data?.passwordVisible) {
        if (data.item.s_password !== '******') {
        //   const passwordFieldValue = form.getFieldState('password').value;
        //   service.passwordEdited = passwordFieldValue;
        }
      } else {
        if (data.item.s_password === '******') {
          if (data?.passwordEdited && data?.passwordEdited.length > 0) {
            // service.password = service.passwordEdited;
            // form.change('password', service.passwordEdited);
            // service.passwordEdited = null;
          } else {
            await decryptFormPassword();
          }
        }
      }
    } else {
      if (data?.passwordVisible) {
        encryptFormPassword();
      } else {
        await decryptFormPassword();
      }
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

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name="s_password">
        {({ input }) => (
          <div className={`${pI.passInput} ${!data?.passwordEditable || data?.passwordMobile ? pI.disabled : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor="s_password">{browser.i18n.getMessage('password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear}`}
                onClick={handleEditableClick}
              >
                {data?.passwordEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            {generateSecurityTypeDescription(data.item)}
            <div className={pI.passInputBottom}>
              <PasswordInput
                {...input}
                type={data?.passwordVisible ? 'text' : 'password'}
                placeholder={!data?.passwordMobile && data.item.isT3orT2WithPassword || data?.passwordEditable ? browser.i18n.getMessage('placeholder_password') : ''}
                id='s_password'
                showPassword={data?.passwordVisible}
                isDecrypted={data.item.s_password !== '******'}
                passwordDecryptError={passwordDecryptError}
                className={passwordDecryptError || (!data?.passwordEditable && !data.item.isT3orT2WithPassword) ? pI.hiddenValue : ''}
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
                  className={`${bS.btn} ${pI.iconButton} ${pI.refreshButton} ${passwordDecryptError || !data?.passwordEditable || data?.passwordMobile ? pI.hiddenButton : ''}`}
                  title={browser.i18n.getMessage('details_generate_password')}
                  state={{
                    from: 'details',
                    data: {
                      // formValues: { ...form.getState().values, securityType: form.getFieldState('securityType')?.value?.value || service.securityType },
                      // generatorData: { ...generatorData, passwordEditable, passwordVisible, passwordMobile },
                      // service
                    }
                  }}
                  prefetch='intent'
                >
                  <RefreshIcon />
                </Link>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${passwordDecryptError || !(data.item.isT3orT2WithPassword || data?.passwordEditable) ? pI.hidden : ''}`}
                  title={browser.i18n.getMessage('details_toggle_password_visibility')}
                >
                  <VisibleIcon />
                </button>
                {(data.item.securityType === SECURITY_TIER.SECRET || (data.item.passwordEncrypted && data.item.passwordEncrypted.length > 0)) && (
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton} ${passwordDecryptError ? pI.hidden : ''}`}
                    onClick={handleCopyPassword}
                    title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
                  >
                    <CopyIcon />
                  </button>
                )}
              </div>

              {generateSecurityTypeOverlay(data.item)}
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
