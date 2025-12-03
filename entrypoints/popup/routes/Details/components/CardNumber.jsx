// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useEffect, useRef } from 'react';
import { copyValue, isText } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';
import PaymentCardNumberInput from '@/entrypoints/popup/components/PaymentCardNumberInput';
import getCardNumberMask from '@/entrypoints/popup/components/PaymentCardNumberInput/getCardNumberMask';

const VisibleIcon = lazy(() => import('@/assets/popup-window/visible.svg?react'));
const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

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

  const previousCardNumberRef = useRef(null);

  const getCardNumberValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (isText(data.item.internalData.editedCardNumber)) {
      return data.item.internalData.editedCardNumber;
    }

    if (data.item.isSifDecrypted && data.item.sifDecrypted?.cardNumber) {
      return data.item.sifDecrypted.cardNumber;
    }

    return '';
  };

  useEffect(() => {
    const currentCardNumber = getCardNumberValue();

    if (currentCardNumber !== previousCardNumberRef.current) {
      form.change('editedCardNumber', currentCardNumber);
      previousCardNumberRef.current = currentCardNumber;
    }
  }, [data.item.internalData.editedCardNumber, data.item.sifDecrypted, data.item.isSifDecrypted, sifDecryptError, form]);

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

  const handleEditableClick = () => {
    if (data?.cardNumberEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isSifDecrypted) {
        updatedItem.setSifDecrypted(data.item.sifDecrypted);
      }

      updatedItem.internalData.editedCardNumber = null;

      setData('item', updatedItem);
      setData('cardNumberEdited', false);
      setData('cardNumberEditable', false);
      form.change('editedCardNumber', data.item.isSifDecrypted ? data.item.sifDecrypted?.cardNumber : '');
    } else {
      setData('cardNumberEditable', true);
    }
  };

  const handleCopyCardNumber = async () => {
    try {
      let cardNumberToCopy;

      if (data.item.internalData.editedCardNumber !== null) {
        cardNumberToCopy = data.item.internalData.editedCardNumber;
      } else if (data.item.isSifDecrypted && data.item.sifDecrypted?.cardNumber) {
        cardNumberToCopy = data.item.sifDecrypted.cardNumber;
      } else if (data.item.cardNumberExists) {
        let decryptedData = await data.item.decryptCardNumber();
        cardNumberToCopy = decryptedData;
        decryptedData = null;
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

  const handleCardNumberVisibleClick = () => {
    setData('cardNumberVisible', !data?.cardNumberVisible);
  };

  const handleCardNumberChange = e => {
    const newValue = e.target.value;
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedCardNumber = newValue;

    setData('item', updatedItem);
    form.change('editedCardNumber', newValue);
  };

  const getHiddenMaskValue = () => {
    return '********';
  };

  const getRawCardNumber = () => {
    const cardNumber = getCardNumberValue();

    return cardNumber.replace(/\D/g, '');
  };

  const handleRawCardNumberChange = e => {
    const newValue = e.target.value.replace(/\D/g, '');
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedCardNumber = newValue;

    setData('item', updatedItem);
    form.change('editedCardNumber', newValue);
  };

  const renderInput = () => {
    const isEditable = data?.cardNumberEditable;
    const isVisible = data?.cardNumberVisible;

    if (!isEditable && !isVisible) {
      return (
        <input
          type='password'
          id='editedCardNumber'
          value={getHiddenMaskValue()}
          disabled
          placeholder={browser.i18n.getMessage('placeholder_payment_card_number')}
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
          disabled={sifDecryptError}
          maxLength={maxLength}
          placeholder={browser.i18n.getMessage('placeholder_payment_card_number')}
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
          placeholder={browser.i18n.getMessage('placeholder_payment_card_number')}
        />
      );
    }

    return (
      <PaymentCardNumberInput
        value={getCardNumberValue()}
        id='editedCardNumber'
        onChange={handleCardNumberChange}
        disabled={sifDecryptError}
        placeholder={browser.i18n.getMessage('placeholder_payment_card_number')}
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
