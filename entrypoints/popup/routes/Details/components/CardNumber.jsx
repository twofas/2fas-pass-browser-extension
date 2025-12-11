// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useEffect, useRef, useState, useCallback } from 'react';
import { copyValue, isText } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';
import PaymentCardNumberInput from '@/entrypoints/popup/components/PaymentCardNumberInput';
import getCardNumberMask from '@/entrypoints/popup/components/PaymentCardNumberInput/getCardNumberMask';
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

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);
  const setBatchData = usePopupStateStore(state => state.setBatchData);

  const previousCardNumberRef = useRef(null);
  const [localDecryptedCardNumber, setLocalDecryptedCardNumber] = useState(null);
  const [localEditedCardNumber, setLocalEditedCardNumber] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const isHighlySecretWithoutSif = originalItem?.securityType === SECURITY_TIER.HIGHLY_SECRET && !originalItem?.sifExists;

  const decryptCardNumberOnDemand = useCallback(async () => {
    if (localDecryptedCardNumber !== null || isDecrypting || sifDecryptError) {
      return localDecryptedCardNumber;
    }

    if (!data.item?.cardNumberExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await data.item.decryptCardNumber();
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
  }, [localDecryptedCardNumber, isDecrypting, sifDecryptError, data.item, setData]);

  const getCardNumberValue = () => {
    if (sifDecryptError || isHighlySecretWithoutSif) {
      return '';
    }

    if (isText(localEditedCardNumber)) {
      return localEditedCardNumber;
    }

    if (isText(localDecryptedCardNumber)) {
      return localDecryptedCardNumber;
    }

    return '';
  };

  useEffect(() => {
    const currentCardNumber = getCardNumberValue();

    if (currentCardNumber !== previousCardNumberRef.current) {
      form.change('editedCardNumber', currentCardNumber);
      previousCardNumberRef.current = currentCardNumber;
    }
  }, [localEditedCardNumber, localDecryptedCardNumber, sifDecryptError, form]);

  useEffect(() => {
    const needsDecryption = (data?.cardNumberEditable || data?.cardNumberVisible) &&
                           localDecryptedCardNumber === null &&
                           !isDecrypting &&
                           data.item?.cardNumberExists;

    if (needsDecryption) {
      decryptCardNumberOnDemand();
    }
  }, [data?.cardNumberEditable, data?.cardNumberVisible, localDecryptedCardNumber, isDecrypting, data.item?.cardNumberExists, decryptCardNumberOnDemand]);

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
      setLocalEditedCardNumber(null);
      setBatchData({
        cardNumberEdited: false,
        cardNumberEditable: false
      });
      form.change('editedCardNumber', isText(localDecryptedCardNumber) ? localDecryptedCardNumber : '');
    } else {
      await decryptCardNumberOnDemand();
      setData('cardNumberEditable', true);
    }
  };

  const handleCopyCardNumber = async () => {
    try {
      let cardNumberToCopy;

      if (isText(localEditedCardNumber)) {
        cardNumberToCopy = localEditedCardNumber;
      } else if (isText(localDecryptedCardNumber)) {
        cardNumberToCopy = localDecryptedCardNumber;
      } else if (data.item.cardNumberExists) {
        cardNumberToCopy = await decryptCardNumberOnDemand();
      } else {
        cardNumberToCopy = '';
      }

      await copyValue(cardNumberToCopy, data.item.deviceId, data.item.vaultId, data.item.id, 'cardNumber');
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

    setLocalEditedCardNumber(newValue);
    form.change('editedCardNumber', newValue);

    const itemData = data.item.toJSON();
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_cardNumber: newValue }]);
    setData('item', localItem);
  };

  const getHiddenMaskValue = () => {
    if (isHighlySecretWithoutSif) {
      return '';
    }

    const cardNumberMask = data.item?.content?.cardNumberMask;

    if (isText(cardNumberMask)) {
      return `**** ${cardNumberMask}`;
    }

    return '********';
  };

  const getRawCardNumber = () => {
    const cardNumber = getCardNumberValue();

    return cardNumber.replace(/\D/g, '');
  };

  const handleRawCardNumberChange = async e => {
    const newValue = e.target.value.replace(/\D/g, '');

    setLocalEditedCardNumber(newValue);
    form.change('editedCardNumber', newValue);

    const itemData = data.item.toJSON();
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_cardNumber: newValue }]);
    setData('item', localItem);
  };

  const renderInput = () => {
    const isEditable = data?.cardNumberEditable;
    const isVisible = data?.cardNumberVisible;
    const placeholder = isHighlySecretWithoutSif ? '' : browser.i18n.getMessage('placeholder_payment_card_number');

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

    if (isEditable && !isVisible) {
      const rawCardNumber = getRawCardNumber();
      const mask = getCardNumberMask(rawCardNumber);
      const maxLength = mask.replace(/\s/g, '').length;

      return (
        <input
          type='password'
          id='editedCardNumber'
          value={rawCardNumber}
          onChange={handleRawCardNumberChange}
          disabled={sifDecryptError || isHighlySecretWithoutSif}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      );
    }

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

    return (
      <PaymentCardNumberInput
        value={getCardNumberValue()}
        id='editedCardNumber'
        onChange={handleCardNumberChange}
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
                className={`${pI.iconButton} ${pI.visibleButton} ${!(originalItem?.isT3orT2WithSif || data?.cardNumberEditable) || sifDecryptError ? pI.hidden : ''}`}
                title={browser.i18n.getMessage('details_toggle_card_number_visibility')}
                tabIndex={-1}
              >
                <VisibleIcon />
              </button>
              {((originalItem?.securityType === SECURITY_TIER.SECRET || data.item.cardNumberExists) && !sifDecryptError) && (
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
