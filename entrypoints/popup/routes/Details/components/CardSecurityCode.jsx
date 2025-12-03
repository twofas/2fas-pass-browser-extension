// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import S from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput/PaymentCardSecurityCodeInput.module.scss';
import { Field } from 'react-final-form';
import { lazy, useEffect, useRef } from 'react';
import { copyValue, isText } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';
import PaymentCardSecurityCodeInput from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput';

const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

/**
* Renders the security code input field for PaymentCard details view.
* @param {Object} props - The component props.
* @param {boolean} props.sifDecryptError - Whether there was an error decrypting the SIF.
* @param {Object} props.formData - Form data containing form instance and original item.
* @return {JSX.Element} The rendered component.
*/
function CardSecurityCode (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const previousSecurityCodeRef = useRef(null);

  const getSecurityCodeValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (isText(data.item.internalData.editedSecurityCode)) {
      return data.item.internalData.editedSecurityCode;
    }

    if (data.item.isSifDecrypted && data.item.sifDecrypted?.securityCode) {
      return data.item.sifDecrypted.securityCode;
    }

    return '';
  };

  const getCardNumberValue = () => {
    if (isText(data.item.internalData.editedCardNumber)) {
      return data.item.internalData.editedCardNumber;
    }

    if (data.item.isSifDecrypted && data.item.sifDecrypted?.cardNumber) {
      return data.item.sifDecrypted.cardNumber;
    }

    return '';
  };

  useEffect(() => {
    const currentSecurityCode = getSecurityCodeValue();

    if (currentSecurityCode !== previousSecurityCodeRef.current) {
      form.change('editedSecurityCode', currentSecurityCode);
      previousSecurityCodeRef.current = currentSecurityCode;
    }
  }, [data.item.internalData.editedSecurityCode, data.item.sifDecrypted, data.item.isSifDecrypted, sifDecryptError, form]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_security_code_decrypt_error')}</span>
      </div>
    );
  };

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    return (
      <div className={pI.passInputTooltip}>
        <span>{browser.i18n.getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handleEditableClick = () => {
    if (data?.securityCodeEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isSifDecrypted) {
        updatedItem.setSifDecrypted(data.item.sifDecrypted);
      }

      updatedItem.internalData.editedSecurityCode = null;

      setData('item', updatedItem);
      setData('securityCodeEdited', false);
      setData('securityCodeEditable', false);
      form.change('editedSecurityCode', data.item.isSifDecrypted ? data.item.sifDecrypted?.securityCode : '');
    } else {
      setData('securityCodeEditable', true);
      setData('securityCodeVisible', true);
    }
  };

  const handleCopySecurityCode = async () => {
    try {
      let securityCodeToCopy;

      if (data.item.internalData.editedSecurityCode !== null) {
        securityCodeToCopy = data.item.internalData.editedSecurityCode;
      } else if (data.item.isSifDecrypted && data.item.sifDecrypted?.securityCode) {
        securityCodeToCopy = data.item.sifDecrypted.securityCode;
      } else if (data.item.securityCodeExists) {
        let decryptedData = await data.item.decryptSecurityCode();
        securityCodeToCopy = decryptedData;
        decryptedData = null;
      } else {
        securityCodeToCopy = '';
      }

      await copyValue(securityCodeToCopy, data.item.deviceId, data.item.vaultId, data.item.id, 'securityCode');
      showToast(browser.i18n.getMessage('notification_card_security_code_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_card_security_code_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleSecurityCodeVisibleClick = () => {
    setData('securityCodeVisible', !data?.securityCodeVisible);
  };

  const handleSecurityCodeChange = e => {
    const newValue = e.target.value;
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedSecurityCode = newValue;

    setData('item', updatedItem);
    form.change('editedSecurityCode', newValue);
  };

  return (
    <Field name='editedSecurityCode'>
      {() => (
        <div className={`${pI.passInput} ${!data?.securityCodeEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor='editedSecurityCode'>{browser.i18n.getMessage('details_security_code')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
              onClick={handleEditableClick}
              tabIndex={-1}
            >
              {data?.securityCodeEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            {data?.securityCodeVisible ? (
              <PaymentCardSecurityCodeInput
                value={getSecurityCodeValue()}
                id='editedSecurityCode'
                cardNumber={getCardNumberValue()}
                onChange={handleSecurityCodeChange}
                disabled={!data?.securityCodeEditable || sifDecryptError}
              />
            ) : (
              <input
                type='password'
                id='editedSecurityCode'
                className={S.paymentCardSecurityCodeInput}
                value='****'
                readOnly
              />
            )}

            <div className={pI.passInputBottomButtons}>
              <button
                type='button'
                onClick={handleSecurityCodeVisibleClick}
                className={`${pI.iconButton} ${pI.visibleButton} ${!(originalItem?.isT3orT2WithSif || data?.securityCodeEditable) || sifDecryptError ? pI.hidden : ''}`}
                title={browser.i18n.getMessage('details_toggle_security_code_visibility')}
                tabIndex={-1}
              >
                <VisibleIcon />
              </button>
              {((originalItem?.securityType === SECURITY_TIER.SECRET || data.item.securityCodeExists) && !sifDecryptError) && (
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton}`}
                  onClick={handleCopySecurityCode}
                  title={browser.i18n.getMessage('this_tab_copy_card_security_code')}
                  tabIndex={-1}
                >
                  <CopyIcon />
                </button>
              )}
            </div>

            {generateSecurityTypeTooltip(originalItem)}
            {generateErrorOverlay()}
          </div>
        </div>
      )}
    </Field>
  );
}

export default CardSecurityCode;
