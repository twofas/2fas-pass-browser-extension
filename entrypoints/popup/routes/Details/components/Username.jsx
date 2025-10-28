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
import usePopupStateStore from '../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';

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
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { inputError } = formData;

  const handleCopyUsername = useCallback(async username => {
    if (!username) {
      await copyValue('', data.item.id, 'username');
    } else {
      await copyValue(username, data.item.id, 'username');
    }

    showToast(browser.i18n.getMessage('notification_username_copied'), 'success');
  }, [data.item.id]);

  const handleUsernameEditable = async () => {
    if (data.usernameEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = updateItem(data.item, {
        content: { username: item.content.username },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setData('usernameEditable', false);
      setData('item', updatedItem);
    } else {
      setData('usernameEditable', true);
    }
  };

  const handleUsernameMobile = async () => {
    if (!data.usernameMobile) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = updateItem(data.item, {
        content: { username: item.content.username },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setData('item', updatedItem);
    }

    setData('usernameMobile', !data.usernameMobile);
  };

  const handleUsernameChange = useCallback(e => {
    const newUsername = e.target.value;

    const updatedItem = updateItem(data.item, {
      content: { username: newUsername },
      internalData: { ...data.item.internalData }
    });

    setData('item', updatedItem);
  }, [data.item, setData]);

  return (
    <Field name="content.username">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.usernameEditable && !data.usernameMobile ? '' : pI.disabled} ${inputError === 'username' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="username">{browser.i18n.getMessage('username')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleUsernameEditable}
            >
              {data.usernameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              onChange={e => {
                input.onChange(e);
                handleUsernameChange(e);
              }}
              placeholder={browser.i18n.getMessage('placeholder_username')}
              id="username"
              disabled={!data.usernameEditable || data.usernameMobile ? 'disabled' : ''}
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
            className={`${pI.passInputAdditional} ${data.usernameEditable ? '' : pI.removeMarginTop}`}
            variants={usernameMobileVariants}
            initial="hidden"
            transition={{ duration: 0.3 }}
            animate={data.usernameEditable ? 'visible' : 'hidden'}
          >
            <div className={`${bS.passToggle} ${bS.loaded}`}>
              <input type="checkbox" name="username-mobile" id="username-mobile" checked={data.usernameMobile} onChange={handleUsernameMobile} />
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
