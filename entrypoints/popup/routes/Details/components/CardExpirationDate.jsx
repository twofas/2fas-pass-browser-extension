// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useEffect, useRef } from 'react';
import { copyValue, isText, paymentCardExpirationDateValidation } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';
import PaymentCardExpirationDate from '@/entrypoints/popup/components/PaymentCardExpirationDate';

const InfoIcon = lazy(() => import('@/assets/popup-window/info.svg?react'));
const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

/**
* Renders the expiration date input field for PaymentCard details view.
* @param {Object} props - The component props.
* @param {boolean} props.sifDecryptError - Whether there was an error decrypting the SIF.
* @param {Object} props.formData - Form data containing form instance and original item.
* @return {JSX.Element} The rendered component.
*/
function CardExpirationDate (props) {
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const previousExpirationDateRef = useRef(null);

  const getExpirationDateValue = () => {
    if (sifDecryptError) {
      return '';
    }

    if (isText(data.item.internalData.editedExpirationDate)) {
      return data.item.internalData.editedExpirationDate;
    }

    if (data.item.isSifDecrypted && data.item.sifDecrypted?.expirationDate) {
      return data.item.sifDecrypted.expirationDate;
    }

    return '';
  };

  useEffect(() => {
    const currentExpirationDate = getExpirationDateValue();

    if (currentExpirationDate !== previousExpirationDateRef.current) {
      form.change('editedExpirationDate', currentExpirationDate);
      previousExpirationDateRef.current = currentExpirationDate;
    }
  }, [data.item.internalData.editedExpirationDate, data.item.sifDecrypted, data.item.isSifDecrypted, sifDecryptError, form]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{browser.i18n.getMessage('details_expiration_date_decrypt_error')}</span>
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
    if (data?.expirationDateEditable) {
      const itemData = data.item.toJSON();
      itemData.internalData = { ...data.item.internalData };
      const updatedItem = new (data.item.constructor)(itemData);

      if (data.item.isSifDecrypted) {
        updatedItem.setSifDecrypted(data.item.sifDecrypted);
      }

      updatedItem.internalData.editedExpirationDate = null;

      setData('item', updatedItem);
      setData('expirationDateEdited', false);
      setData('expirationDateEditable', false);
      form.change('editedExpirationDate', data.item.isSifDecrypted ? data.item.sifDecrypted?.expirationDate : '');
    } else {
      setData('expirationDateEditable', true);
    }
  };

  const handleCopyExpirationDate = async () => {
    try {
      let expirationDateToCopy;

      if (data.item.internalData.editedExpirationDate !== null) {
        expirationDateToCopy = data.item.internalData.editedExpirationDate;
      } else if (data.item.isSifDecrypted && data.item.sifDecrypted?.expirationDate) {
        expirationDateToCopy = data.item.sifDecrypted.expirationDate;
      } else if (data.item.expirationDateExists) {
        let decryptedData = await data.item.decryptExpirationDate();
        expirationDateToCopy = decryptedData;
        decryptedData = null;
      } else {
        expirationDateToCopy = '';
      }

      await copyValue(expirationDateToCopy, data.item.deviceId, data.item.vaultId, data.item.id, 'expirationDate');
      showToast(browser.i18n.getMessage('notification_expiration_date_copied'), 'success');
    } catch (e) {
      showToast(browser.i18n.getMessage('error_expiration_date_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleExpirationDateChange = formattedValue => {
    const itemData = data.item.toJSON();
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isSifDecrypted) {
      updatedItem.setSifDecrypted(data.item.sifDecrypted);
    }

    updatedItem.internalData.editedExpirationDate = formattedValue;

    setData('item', updatedItem);
    form.change('editedExpirationDate', formattedValue);
  };

  return (
    <Field name='editedExpirationDate'>
      {() => (
        <div className={`${pI.passInput} ${!data?.expirationDateEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor='editedExpirationDate'>{browser.i18n.getMessage('details_expiration_date')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
              onClick={handleEditableClick}
              tabIndex={-1}
            >
              {data?.expirationDateEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <PaymentCardExpirationDate
              value={getExpirationDateValue()}
              inputId='editedExpirationDate'
              onChange={handleExpirationDateChange}
              disabled={!data?.expirationDateEditable || sifDecryptError}
            />

            <div className={pI.passInputBottomButtons}>
              {((originalItem?.securityType === SECURITY_TIER.SECRET || data.item.expirationDateExists) && !sifDecryptError) && (
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton}`}
                  onClick={handleCopyExpirationDate}
                  title={browser.i18n.getMessage('details_copy_expiration_date')}
                  tabIndex={-1}
                >
                  <CopyIcon />
                </button>
              )}
            </div>

            {generateSecurityTypeTooltip(originalItem)}
            {generateErrorOverlay()}
          </div>
          <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
            <p className={paymentCardExpirationDateValidation(getExpirationDateValue()) ? '' : pI.empty}>{paymentCardExpirationDateValidation(getExpirationDateValue()) ? browser.i18n.getMessage('details_card_expired') : ''}</p>
          </div>
        </div>
      )}
    </Field>
  );
}

export default CardExpirationDate;
