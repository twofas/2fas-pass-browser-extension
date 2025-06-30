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

const loadDomAnimation = () => import('@/features/domAnimation.js').then(res => res.default);

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
  const { service, usernameEditable, usernameMobile, inputError, form } = data;
  const { setUsernameEditable, setUsernameMobile } = actions;

  const handleUsernameEditable = form => {
    if (usernameEditable) {
      form.change('username', service.username);
    }

    setUsernameEditable(!usernameEditable);
  };

  const handleUsernameMobile = form => {
    if (!usernameMobile) {
      form.change('username', service.username);
    }

    setUsernameMobile(!usernameMobile);
  };

  return (
    <Field name="username">
      {({ input }) => (
        <div className={`${pI.passInput} ${usernameEditable && !usernameMobile ? '' : pI.disabled} ${inputError === 'username' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="username">{browser.i18n.getMessage('username')}</label>
            <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={() => handleUsernameEditable(form)}>{usernameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}</button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              id="username"
              disabled={!usernameEditable || usernameMobile ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="on"
              autoCapitalize="off"
            />
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
                <input type="checkbox" name="username-mobile" id="username-mobile" onChange={() => handleUsernameMobile(form)} />
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
