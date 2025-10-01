// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { LazyMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { lazy, useCallback } from 'react';
import copyValue from '@/partials/functions/copyValue';

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

const usernameMobileVariants = {
  hidden: { maxHeight: '0px' },
  visible: { maxHeight: '18px' }
};

/**
* Function to render the username input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Username (props) {
  const { data, actions } = props;
  const { service, originalService, usernameEditable, usernameMobile, inputError, form } = data;
  const { setUsernameEditable, setUsernameMobile, updateFormValues } = actions;

  const handleCopyUsername = useCallback(async username => {
    if (!username) {
      await copyValue('', service.id, 'username');
    } else {
      await copyValue(username, service.id, 'username');
    }

    showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
  }, [service.id]);

  const handleUsernameEditable = (form, input) => {
    if (usernameEditable) {
      const valueToRestore = originalService?.username || '';

      form.change('username', valueToRestore);

      if (input) {
        input.onChange(valueToRestore);
      }

      setUsernameEditable(false);

      if (updateFormValues) {
        const currentFormValues = form.getState().values;
        const updatedFormValues = { ...currentFormValues, username: valueToRestore };
        updateFormValues(updatedFormValues);
      }
    } else {
      setUsernameEditable(true);
    }
  };

  const handleUsernameMobile = form => {
    if (!usernameMobile) {
      form.change('username', originalService?.username || '');
    }

    setUsernameMobile(!usernameMobile);
  };

  return (
    <Field name="username">
      {({ input }) => (
        <div className={`${pI.passInput} ${usernameEditable && !usernameMobile ? '' : pI.disabled} ${inputError === 'username' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="username">{browser.i18n.getMessage('username')}</label>
            <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={() => handleUsernameEditable(form, input)}>{usernameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}</button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              placeholder={browser.i18n.getMessage('placeholder_username')}
              {...input}
              id="username"
              disabled={!usernameEditable || usernameMobile ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="on"
              autoCapitalize="off"
            />
          <button
            type='button'
            className={`${bS.btn} ${pI.iconButton}`}
            onClick={() => handleCopyUsername(input.value)}
            title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
          >
            <CopyIcon />
          </button>
        </div>
        <LazyMotion features={loadDomAnimation}>
          <m.div
            className={`${pI.passInputAdditional} ${usernameEditable ? '' : pI.removeMarginTop}`}
            variants={usernameMobileVariants}
            initial="hidden"
            transition={{ duration: 0.3 }}
            animate={usernameEditable ? 'visible' : 'hidden'}
          >
            <div className={`${bS.passToggle} ${bS.loaded}`}>
              <input type="checkbox" name="username-mobile" id="username-mobile" checked={usernameMobile} onChange={() => handleUsernameMobile(form)} />
              <label htmlFor="username-mobile">
                <span className={bS.passToggleText}>
                  <span>{browser.i18n.getMessage('enter_on_mobile')}</span>
                </span>

                <span className={bS.passToggleBox}>
                  <span className={bS.passToggleBoxCircle}></span>
                </span>
              </label>
            </div>
          </m.div>
        </LazyMotion>
      </div>
      )}
    </Field>
  );
}

export default Username;
