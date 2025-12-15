// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import S from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput/PaymentCardSecurityCodeInput.module.scss';
import { Field } from 'react-final-form';
import { lazy, useEffect, useRef, useState, useCallback } from 'react';
import { copyValue, isText } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';
import PaymentCardSecurityCodeInput from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput';
import getSecurityCodeMask from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput/getSecurityCodeMask';

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

  const { data, setData, setBatchData } = usePopupState();

  const previousSecurityCodeRef = useRef(null);
  const [localDecryptedSecurityCode, setLocalDecryptedSecurityCode] = useState(null);
  const [localEditedSecurityCode, setLocalEditedSecurityCode] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const isHighlySecretWithoutSif = originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists;

  const decryptSecurityCodeOnDemand = useCallback(async () => {
    if (localDecryptedSecurityCode !== null || isDecrypting || sifDecryptError) {
      return localDecryptedSecurityCode;
    }

    if (!data.item?.securityCodeExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await data.item.decryptSecurityCode();
      setLocalDecryptedSecurityCode(decryptedData);
      setData('sifDecryptError', false);
      return decryptedData;
    } catch (e) {
      setData('sifDecryptError', true);
      CatchError(e);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [localDecryptedSecurityCode, isDecrypting, sifDecryptError, data.item, setData]);

  const getSecurityCodeValue = () => {
    if (sifDecryptError || isHighlySecretWithoutSif) {
      return '';
    }

    if (isText(localEditedSecurityCode)) {
      return localEditedSecurityCode;
    }

    if (isText(localDecryptedSecurityCode)) {
      return localDecryptedSecurityCode;
    }

    return '';
  };

  const getCardNumberValue = () => {
    const formState = form.getState();
    const cardNumber = formState?.values?.editedCardNumber;

    if (isText(cardNumber)) {
      return cardNumber;
    }

    return '';
  };

  useEffect(() => {
    const currentSecurityCode = getSecurityCodeValue();

    if (currentSecurityCode !== previousSecurityCodeRef.current) {
      form.change('editedSecurityCode', currentSecurityCode);
      previousSecurityCodeRef.current = currentSecurityCode;
    }
  }, [localEditedSecurityCode, localDecryptedSecurityCode, sifDecryptError, form]);

  useEffect(() => {
    const needsDecryption = (data?.securityCodeEditable || data?.securityCodeVisible) &&
                           localDecryptedSecurityCode === null &&
                           !isDecrypting &&
                           data.item?.securityCodeExists;

    if (needsDecryption) {
      decryptSecurityCodeOnDemand();
    }
  }, [data?.securityCodeEditable, data?.securityCodeVisible, localDecryptedSecurityCode, isDecrypting, data.item?.securityCodeExists, decryptSecurityCodeOnDemand]);

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

  const handleEditableClick = async () => {
    if (data?.securityCodeEditable) {
      setLocalEditedSecurityCode(null);
      setBatchData({
        securityCodeEdited: false,
        securityCodeEditable: false
      });
      form.change('editedSecurityCode', isText(localDecryptedSecurityCode) ? localDecryptedSecurityCode : '');
    } else {
      await decryptSecurityCodeOnDemand();
      setData('securityCodeEditable', true);
    }
  };

  const handleCopySecurityCode = async () => {
    try {
      let securityCodeToCopy;

      if (isText(localEditedSecurityCode)) {
        securityCodeToCopy = localEditedSecurityCode;
      } else if (isText(localDecryptedSecurityCode)) {
        securityCodeToCopy = localDecryptedSecurityCode;
      } else if (data.item.securityCodeExists) {
        securityCodeToCopy = await decryptSecurityCodeOnDemand();
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

  const handleSecurityCodeVisibleClick = async () => {
    if (!data?.securityCodeVisible) {
      await decryptSecurityCodeOnDemand();
    }

    setData('securityCodeVisible', !data?.securityCodeVisible);
  };

  const handleSecurityCodeChange = async e => {
    const newValue = e.target.value;

    setLocalEditedSecurityCode(newValue);
    form.change('editedSecurityCode', newValue);

    const itemData = data.item.toJSON();
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_securityCode: newValue }]);
    setData('item', localItem);
  };

  const getHiddenMaskValue = () => {
    if (isHighlySecretWithoutSif) {
      return '';
    }

    return '***';
  };

  const getRawSecurityCode = () => {
    const securityCode = getSecurityCodeValue();

    return securityCode.replace(/\D/g, '');
  };

  const handleRawSecurityCodeChange = async e => {
    const newValue = e.target.value.replace(/\D/g, '');

    setLocalEditedSecurityCode(newValue);
    form.change('editedSecurityCode', newValue);

    const itemData = data.item.toJSON();
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_securityCode: newValue }]);
    setData('item', localItem);
  };

  const renderInput = () => {
    const isEditable = data?.securityCodeEditable;
    const isVisible = data?.securityCodeVisible;

    if (!isEditable && !isVisible) {
      return (
        <input
          type='password'
          id='editedSecurityCode'
          className={S.paymentCardSecurityCodeInput}
          value={getHiddenMaskValue()}
          disabled
        />
      );
    }

    if (isEditable && !isVisible) {
      const cardNumber = getCardNumberValue();
      const securityCodeMaskData = getSecurityCodeMask(cardNumber);
      const maxLength = securityCodeMaskData.mask.length;

      return (
        <input
          type='password'
          id='editedSecurityCode'
          className={S.paymentCardSecurityCodeInput}
          value={getRawSecurityCode()}
          onChange={handleRawSecurityCodeChange}
          disabled={sifDecryptError}
          maxLength={maxLength}
        />
      );
    }

    if (!isEditable && isVisible) {
      return (
        <PaymentCardSecurityCodeInput
          value={getSecurityCodeValue()}
          id='editedSecurityCode'
          cardNumber={getCardNumberValue()}
          onChange={handleSecurityCodeChange}
          disabled
          securityType={originalItem?.securityType}
          sifExists={originalItem?.sifExists}
        />
      );
    }

    return (
      <PaymentCardSecurityCodeInput
        value={getSecurityCodeValue()}
        id='editedSecurityCode'
        cardNumber={getCardNumberValue()}
        onChange={handleSecurityCodeChange}
        disabled={sifDecryptError}
        securityType={originalItem?.securityType}
        sifExists={originalItem?.sifExists}
      />
    );
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
            {renderInput()}

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
