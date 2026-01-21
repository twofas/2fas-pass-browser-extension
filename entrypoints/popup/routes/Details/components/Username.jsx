// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';
import copyValue from '@/partials/functions/copyValue';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

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
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();
  const inputRef = useRef(null);

  const { formData } = props;
  const { inputError } = formData;

  const handleCopyUsername = useCallback(async username => {
    if (!username) {
      await copyValue('', data.item.deviceId, data.item.vaultId, data.item.id, 'username');
    } else {
      await copyValue(username, data.item.deviceId, data.item.vaultId, data.item.id, 'username');
    }

    showToast(getMessage('notification_username_copied'), 'success');
  }, [data.item.id]);

  const handleUsernameEditable = async () => {
    if (data.usernameEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { username: item.content.username },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('usernameEditable', false);
    } else {
      setData('usernameEditable', true);
    }
  };

  const handleUsernameMobile = async () => {
    if (!data.usernameMobile) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { username: item.content.username },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
    }

    setData('usernameMobile', !data.usernameMobile);
  };

  const handleUsernameChange = useCallback(async e => {
    const newUsername = e.target.value;

    const updatedItem = await updateItem(data.item, {
      content: { username: newUsername },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  useEffect(() => {
    if (data.usernameEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [data.usernameEditable]);

  return (
    <Field name="content.username">
      {({ input }) => (
        <div className={`${pI.passInput} ${data.usernameEditable && !data.usernameMobile ? '' : pI.disabled} ${inputError === 'username' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="username">{getMessage('username')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleUsernameEditable}
              tabIndex={-1}
            >
              {data.usernameEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              ref={inputRef}
              onChange={e => {
                input.onChange(e);
                handleUsernameChange(e);
              }}
              placeholder={getMessage('placeholder_username')}
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
            title={getMessage('this_tab_copy_to_clipboard')}
            tabIndex={-1}
          >
            <CopyIcon />
          </button>
        </div>
        <motion.div
          className={`${pI.passInputAdditional} ${data.usernameEditable ? '' : pI.removeMarginTop}`}
          variants={usernameMobileVariants}
          initial="hidden"
          transition={{ duration: 0.2, ease: 'easeOut' }}
          animate={data.usernameEditable ? 'visible' : 'hidden'}
        >
          <div className={`${bS.passToggle} ${bS.loaded}`}>
            <input type="checkbox" name="username-mobile" id="username-mobile" checked={data.usernameMobile} onChange={handleUsernameMobile} />
            <label htmlFor="username-mobile">
              <span className={bS.passToggleText}>
                <span>{getMessage('enter_on_mobile')}</span>
              </span>

              <span className={bS.passToggleBox}>
                <span className={bS.passToggleBoxCircle}></span>
              </span>
            </label>
          </div>
        </motion.div>
      </div>
      )}
    </Field>
  );
}

export default Username;
