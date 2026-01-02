// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { copyValue, isText } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import PaymentCard from '@/models/itemModels/PaymentCard';
import PaymentCardNumberInput from '@/entrypoints/popup/components/PaymentCardNumberInput';
import getCardNumberMask from '@/entrypoints/popup/components/PaymentCardNumberInput/getCardNumberMask';
import getItem from '@/partials/sessionStorage/getItem';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';

/**
* Renders the card number input field for PaymentCard details view.
* @param {Object} props - The component props.
* @param {boolean} props.sifDecryptError - Whether there was an error decrypting the SIF.
* @param {Object} props.formData - Form data containing form instance and original item.
* @return {JSX.Element} The rendered component.
*/
function CardNumber (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const { data, setData, setBatchData, setItem } = usePopupState();

  const previousCardNumberRef = useRef(null);
  const passwordInputRef = useRef(null);
  const inputMaskRef = useRef(null);
  const [localDecryptedCardNumber, setLocalDecryptedCardNumber] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [shouldFocusInputMask, setShouldFocusInputMask] = useState(false);

  const itemInstance = useMemo(() => {
    if (!data.item) {
      return null;
    }

    if (data.item instanceof PaymentCard) {
      return data.item;
    }

    try {
      return new PaymentCard(data.item);
    } catch (e) {
      CatchError(e);
      return null;
    }
  }, [data.item]);

  const isHighlySecretWithoutSif = originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists;

  const decryptCardNumberOnDemand = useCallback(async () => {
    if (localDecryptedCardNumber !== null || isDecrypting || sifDecryptError) {
      return localDecryptedCardNumber;
    }

    if (!itemInstance?.cardNumberExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await itemInstance.decryptCardNumber();
      setLocalDecryptedCardNumber(decryptedData);
      setData('sifDecryptError', false);
      return decryptedData;
    } catch (e) {
      setData('sifDecryptError', true);
      CatchError(e);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [localDecryptedCardNumber, isDecrypting, sifDecryptError, itemInstance, setData]);

  const getHiddenMaskValue = () => {
    if (isHighlySecretWithoutSif) {
      return '';
    }

    const cardNumberMask = itemInstance?.content?.cardNumberMask;

    if (isText(cardNumberMask)) {
      return `**** ${cardNumberMask}`;
    }

    return '********';
  };

  const getCardNumberValue = () => {
    if (sifDecryptError || isHighlySecretWithoutSif) {
      return '';
    }

    if (!data?.cardNumberEditable && !data?.cardNumberVisible) {
      return getHiddenMaskValue();
    }

    if (isText(localDecryptedCardNumber)) {
      return localDecryptedCardNumber;
    }

    return '';
  };

  const getRawCardNumber = () => {
    const cardNumber = getCardNumberValue();

    return cardNumber.replace(/\D/g, '');
  };

  const focusInputMask = useCallback(() => {
    const inputElement = inputMaskRef.current?.getInput?.() || inputMaskRef.current;

    if (inputElement && !inputElement.disabled) {
      inputElement.focus();
      setShouldFocusInputMask(false);
    } else {
      setTimeout(focusInputMask, 50);
    }
  }, []);

  useEffect(() => {
    const currentCardNumber = getCardNumberValue();

    if (currentCardNumber !== previousCardNumberRef.current) {
      form.change('editedCardNumber', currentCardNumber);
      previousCardNumberRef.current = currentCardNumber;
    }
  }, [localDecryptedCardNumber, form]);

  useEffect(() => {
    const needsDecryption = (data?.cardNumberEditable || data?.cardNumberVisible) &&
                           localDecryptedCardNumber === null &&
                           !isDecrypting &&
                           itemInstance?.cardNumberExists;

    if (needsDecryption) {
      decryptCardNumberOnDemand();
    }
  }, [data?.cardNumberEditable, data?.cardNumberVisible, localDecryptedCardNumber, isDecrypting, itemInstance?.cardNumberExists, decryptCardNumberOnDemand]);

  useEffect(() => {
    if (shouldFocusInputMask && data?.cardNumberEditable && isFocused) {
      setTimeout(focusInputMask, 0);
    }
  }, [shouldFocusInputMask, data?.cardNumberEditable, isFocused, focusInputMask]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_card_number_decrypt_error')}</span>
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
    if (data?.cardNumberEditable) {
      let item = await getItem(itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id);

      const itemData = item.toJSON();
      const restoredItem = new PaymentCard(itemData);

      item = null;

      setLocalDecryptedCardNumber(null);
      setIsFocused(false);
      setShouldFocusInputMask(false);
      setItem(restoredItem);
      setData('cardNumberEditable', false);
      form.change('editedCardNumber', '');
    } else {
      await decryptCardNumberOnDemand();
      setIsFocused(true);
      setShouldFocusInputMask(true);
      setBatchData({
        cardNumberVisible: false,
        cardNumberEditable: true
      });
    }
  };

  const handleCopyCardNumber = async () => {
    try {
      let cardNumberToCopy;

      if (isText(localDecryptedCardNumber)) {
        cardNumberToCopy = localDecryptedCardNumber;
      } else if (itemInstance?.cardNumberExists) {
        cardNumberToCopy = await decryptCardNumberOnDemand();
      } else {
        cardNumberToCopy = '';
      }

      await copyValue(cardNumberToCopy, itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id, 'cardNumber');
      showToast(browser.i18n.getMessage('notification_card_number_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_card_number_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleCardNumberVisibleClick = async () => {
    if (!data?.cardNumberVisible) {
      await decryptCardNumberOnDemand();
    }

    setData('cardNumberVisible', !data?.cardNumberVisible);
  };

  const handleCardNumberChange = async e => {
    const newValue = e.target.value;

    setLocalDecryptedCardNumber(newValue);
    form.change('editedCardNumber', newValue);
    setData('editedCardNumber', newValue);

    const itemData = typeof data.item?.toJSON === 'function' ? data.item.toJSON() : data.item;
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_cardNumber: newValue }]);
    setItem(localItem);
  };

  const handleRawCardNumberChange = async e => {
    const newValue = e.target.value.replace(/\D/g, '');

    setLocalDecryptedCardNumber(newValue);
    form.change('editedCardNumber', newValue);
    setData('editedCardNumber', newValue);

    const itemData = typeof data.item?.toJSON === 'function' ? data.item.toJSON() : data.item;
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_cardNumber: newValue }]);
    setItem(localItem);
  };

  const handlePasswordInputFocus = () => {
    setIsFocused(true);
    setShouldFocusInputMask(true);
  };

  const handleInputMaskBlur = () => {
    setIsFocused(false);
  };

  const renderInput = () => {
    const isEditable = data?.cardNumberEditable;
    const isVisible = data?.cardNumberVisible;
    const placeholder = isHighlySecretWithoutSif ? '' : browser.i18n.getMessage('placeholder_payment_card_number');

    // Not editable and not visible - show masked value
    if (!isEditable && !isVisible) {
      return (
        <input
          type='text'
          id='editedCardNumber'
          value={getHiddenMaskValue()}
          disabled
          placeholder={placeholder}
        />
      );
    }

    // Visible but not editable - show PaymentCardNumberInput disabled
    if (!isEditable && isVisible) {
      return (
        <PaymentCardNumberInput
          value={getCardNumberValue()}
          id='editedCardNumber'
          onChange={handleCardNumberChange}
          disabled
          placeholder={placeholder}
          securityType={originalItem?.securityType}
          sifExists={originalItem?.sifExists}
        />
      );
    }

    // Editable - show password input when not focused, PaymentCardNumberInput when focused
    if (isEditable && !isFocused) {
      const rawCardNumber = getRawCardNumber();
      const mask = getCardNumberMask(rawCardNumber);
      const maxLength = mask.replace(/\s/g, '').length;

      return (
        <input
          ref={passwordInputRef}
          type='password'
          id='editedCardNumber'
          value={rawCardNumber}
          onChange={handleRawCardNumberChange}
          onFocus={handlePasswordInputFocus}
          disabled={sifDecryptError || isHighlySecretWithoutSif}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      );
    }

    // Editable and focused - show PaymentCardNumberInput (InputMask)
    return (
      <PaymentCardNumberInput
        ref={inputMaskRef}
        value={getCardNumberValue()}
        id='editedCardNumber'
        onChange={handleCardNumberChange}
        onBlur={handleInputMaskBlur}
        disabled={sifDecryptError || isHighlySecretWithoutSif}
        placeholder={placeholder}
        securityType={originalItem?.securityType}
        sifExists={originalItem?.sifExists}
      />
    );
  };

  return (
    <Field name='editedCardNumber'>
      {() => (
        <div className={`${pI.passInput} ${!data?.cardNumberEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor='editedCardNumber'>{browser.i18n.getMessage('details_card_number')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
              onClick={handleEditableClick}
              tabIndex={-1}
            >
              {data?.cardNumberEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            {renderInput()}

            <div className={pI.passInputBottomButtons}>
              <button
                type='button'
                onClick={handleCardNumberVisibleClick}
                className={`${pI.iconButton} ${pI.visibleButton} ${!originalItem?.isT3orT2WithSif || data?.cardNumberEditable || sifDecryptError ? pI.hiddenButton : ''}`}
                title={browser.i18n.getMessage('details_toggle_card_number_visibility')}
                tabIndex={-1}
              >
                <VisibleIcon />
              </button>
              {((originalItem?.securityType === SECURITY_TIER.SECRET || itemInstance?.cardNumberExists) && !sifDecryptError) && (
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton}`}
                  onClick={handleCopyCardNumber}
                  title={browser.i18n.getMessage('this_tab_copy_card_number')}
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

export default CardNumber;
