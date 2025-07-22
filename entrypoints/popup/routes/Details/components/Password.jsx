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
import isT3orT2WithPassword from '@/partials/functions/isT3orT2WithPassword';
import decryptPassword from '@/partials/functions/decryptPassword';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));

const passwordDescriptionVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '31px' }
};

const passwordMobileVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '18px' }
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
              <input
                type={passwordVisible ? 'text' : 'password'}
                {...input}
                id="password"
                className={!passwordEditable && !isT3orT2WithPassword(service) ? pI.hiddenValue : ''}
                disabled={!passwordEditable || passwordMobile ? 'disabled' : ''}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              <button
                type="button"
                onClick={handlePasswordVisibleClick}
                className={`${service.securityType < SECURITY_TIER.SECRET ? (passwordEditable ? '' : pI.hidden) : ''}`}
              >
                <VisibleIcon />
              </button>

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
          </div>
        )}
      </Field>
    </LazyMotion>
  );
}

export default Password;
