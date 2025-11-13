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

 /**
* Function to render the password input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SecureNoteText (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const previousPasswordValueRef = useRef(null);

  const getTextValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (data.item.internalData.editedSif !== null) {
      return data.item.internalData.editedSif;
    }

    if (data.item.isSifDecrypted) {
      return data.item.sifDecrypted;
    }

    return '';
  };

  useEffect(() => {
    const currentTextValue = getTextValue();

    if (currentTextValue !== previousPasswordValueRef.current) {
      form.change('editedSif', currentTextValue);
      previousPasswordValueRef.current = currentTextValue;
    }
  }, [data.item.internalData.editedSif, data.item.sifDecrypted, form]);

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

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    // FUTURE - move to separate component
    return (
      <div className={pI.passInputTooltip}>
        <span>This information is only available on your mobile phone. Click the "Fetch" button at the top of this window to retrieve it.</span>
      </div>
    );
  };

  // const handlePasswordOnMobileChange = () => {
  //   setData('passwordMobile', !data?.passwordMobile);
  // };

  const handleEditableClick = () => {
    if (data?.passwordEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isSifDecrypted) {
        updatedItem.setSifDecrypted(data.item.sifDecrypted);
      }

      updatedItem.internalData.editedSif = null;

      setData('item', updatedItem);
      setData('passwordEdited', false);
      setData('passwordEditable', false);
      form.change('editedSif', data.item.isSifDecrypted ? data.item.sifDecrypted : '');
    } else {
      setData('passwordEditable', true);
    }
  };

  // const handlePasswordVisibleClick = () => {
  //   setData('passwordVisible', !data?.passwordVisible);
  // };
  
  // const handleChangePasswordClick = async e => {
  //   e.preventDefault();
  //   e.stopPropagation();
    
  //   if (!changePasswordUrl) {
  //     return;
  //   }
    
  //   await browser.tabs.create({ url: changePasswordUrl });
  // };

  const handleTextChange = e => {
    const newValue = e.target.value;
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedSif = newValue;

    setData('item', updatedItem);
    form.change('editedSif', newValue);
  };

  return (
    <LazyMotion features={loadDomAnimation}>
      <Field name='editedSif'>
        {() => (
          <div className={`${pI.passInput} ${!data?.passwordEditable || data?.passwordMobile || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
            <div className={pI.passInputTop}>
              <label htmlFor='editedSif'>{browser.i18n.getMessage('password')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
                onClick={handleEditableClick}
              >
                {data?.passwordEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
              </button>
            </div>
            <div className={pI.passInputBottom}>
              <textarea
                value={getTextValue()}
                // type={data?.passwordVisible ? 'text' : 'password'}
                placeholder={!sifDecryptError && (!data?.passwordMobile && originalItem?.isT3orT2WithSif || data?.passwordEditable) ? browser.i18n.getMessage('placeholder_password') : ''}
                id='editedSif'
                onChange={handleTextChange}
                // showPassword={data?.passwordVisible}
                // isDecrypted={data.item.isSifDecrypted || data.item.internalData.editedSif !== null}
                // state={!originalItem?.isT3orT2WithSif ? 'nonFetched' : ''}
                // disabled={!data?.passwordEditable || data?.passwordMobile || sifDecryptError}
                dir="ltr"
                spellCheck="false"
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="off"
              />
              {/* <div className={pI.passInputBottomButtons}>
                <button
                  type="button"
                  onClick={handlePasswordVisibleClick}
                  className={`${pI.iconButton} ${pI.visibleButton} ${!(originalItem?.isT3orT2WithSif || data?.passwordEditable) || sifDecryptError ? pI.hidden : ''}`}
                  title={browser.i18n.getMessage('details_toggle_password_visibility')}
                >
                  <VisibleIcon />
                </button>
              </div> */}

              {generateSecurityTypeTooltip(originalItem)}
              {generateErrorOverlay()}
            </div>
          </div>
        )}
      </Field>
    </LazyMotion>
  );
}

export default SecureNoteText;
