// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { copyValue, isText, paymentCardExpirationDateValidation } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import PaymentCard from '@/models/itemModels/PaymentCard';
import PaymentCardExpirationDate from '@/entrypoints/popup/components/PaymentCardExpirationDate';
import InfoIcon from '@/assets/popup-window/info.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import { useI18n } from '@/partials/context/I18nContext';

/**
* Renders the expiration date input field for PaymentCard details view.
* @param {Object} props - The component props.
* @param {boolean} props.sifDecryptError - Whether there was an error decrypting the SIF.
* @param {Object} props.formData - Form data containing form instance and original item.
* @return {JSX.Element} The rendered component.
*/
function CardExpirationDate (props) {
  const { getMessage } = useI18n();
  const { sifDecryptError, formData } = props;
  const { form, originalItem } = formData;

  const { data, setData, setBatchData, setItem } = usePopupState();

  const previousExpirationDateRef = useRef(null);
  const inputRef = useRef(null);
  const [localDecryptedExpirationDate, setLocalDecryptedExpirationDate] = useState(null);
  const [localEditedExpirationDate, setLocalEditedExpirationDate] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

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

  const decryptExpirationDateOnDemand = useCallback(async () => {
    if (localDecryptedExpirationDate !== null || isDecrypting || sifDecryptError) {
      return localDecryptedExpirationDate;
    }

    if (!itemInstance?.expirationDateExists) {
      return null;
    }

    setIsDecrypting(true);

    try {
      const decryptedData = await itemInstance.decryptExpirationDate();
      setLocalDecryptedExpirationDate(decryptedData);
      setData('sifDecryptError', false);
      return decryptedData;
    } catch (e) {
      setData('sifDecryptError', true);
      CatchError(e);
      return null;
    } finally {
      setIsDecrypting(false);
    }
  }, [localDecryptedExpirationDate, isDecrypting, sifDecryptError, itemInstance, setData]);

  const getExpirationDateValue = () => {
    if (sifDecryptError || isHighlySecretWithoutSif) {
      return '';
    }

    if (isText(localEditedExpirationDate)) {
      return localEditedExpirationDate;
    }

    if (isText(localDecryptedExpirationDate)) {
      return localDecryptedExpirationDate;
    }

    return '';
  };

  useEffect(() => {
    const currentExpirationDate = getExpirationDateValue();

    if (currentExpirationDate !== previousExpirationDateRef.current) {
      form.change('editedExpirationDate', currentExpirationDate);
      previousExpirationDateRef.current = currentExpirationDate;
    }
  }, [localEditedExpirationDate, localDecryptedExpirationDate, sifDecryptError, form]);

  useEffect(() => {
    if (data?.expirationDateEditable && isText(data?.editedExpirationDate) && localEditedExpirationDate === null) {
      setLocalEditedExpirationDate(data.editedExpirationDate);
    }
  }, []);

  useEffect(() => {
    const needsDecryption = localDecryptedExpirationDate === null &&
                           !isDecrypting &&
                           itemInstance?.expirationDateExists;

    if (needsDecryption) {
      decryptExpirationDateOnDemand();
    }
  }, [localDecryptedExpirationDate, isDecrypting, itemInstance?.expirationDateExists, decryptExpirationDateOnDemand]);

  useEffect(() => {
    if (data?.expirationDateEditable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [data?.expirationDateEditable]);

  const generateErrorOverlay = () => {
    if (!sifDecryptError) {
      return null;
    }

    return (
      <div className={pI.passInputBottomOverlay}>
        <InfoIcon />
        <span>{getMessage('details_expiration_date_decrypt_error')}</span>
      </div>
    );
  };

  const generateSecurityTypeTooltip = item => {
    if (item?.isT3orT2WithSif) {
      return null;
    }

    return (
      <div className={pI.passInputTooltip}>
        <span>{getMessage('details_sif_not_fetched')}</span>
      </div>
    );
  };

  const handleEditableClick = async () => {
    if (data?.expirationDateEditable) {
      setLocalEditedExpirationDate(null);
      setBatchData({
        expirationDateEdited: false,
        expirationDateEditable: false
      });
      form.change('editedExpirationDate', isText(localDecryptedExpirationDate) ? localDecryptedExpirationDate : '');
    } else {
      await decryptExpirationDateOnDemand();
      setData('expirationDateEditable', true);
    }
  };

  const handleCopyExpirationDate = async () => {
    try {
      let expirationDateToCopy;

      if (isText(localEditedExpirationDate)) {
        expirationDateToCopy = localEditedExpirationDate;
      } else if (isText(localDecryptedExpirationDate)) {
        expirationDateToCopy = localDecryptedExpirationDate;
      } else if (itemInstance?.expirationDateExists) {
        expirationDateToCopy = await decryptExpirationDateOnDemand();
      } else {
        expirationDateToCopy = '';
      }

      await copyValue(expirationDateToCopy, itemInstance?.deviceId, itemInstance?.vaultId, itemInstance?.id, 'expirationDate');
      showToast(getMessage('notification_expiration_date_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_expiration_date_copy_failed'), 'error');
      await CatchError(e);
    }
  };

  const handleExpirationDateChange = async formattedValue => {
    setLocalEditedExpirationDate(formattedValue);
    form.change('editedExpirationDate', formattedValue);
    setData('editedExpirationDate', formattedValue);

    const itemData = typeof data.item?.toJSON === 'function' ? data.item.toJSON() : data.item;
    const localItem = new PaymentCard(itemData);
    await localItem.setSif([{ s_expirationDate: formattedValue }]);
    setItem(localItem);
  };

  return (
    <Field name='editedExpirationDate'>
      {() => (
        <div className={`${pI.passInput} ${!data?.expirationDateEditable || sifDecryptError ? pI.disabled : ''} ${!originalItem?.isT3orT2WithSif ? pI.nonFetched : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor='editedExpirationDate'>{getMessage('details_expiration_date')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear} ${!originalItem?.isT3orT2WithSif || sifDecryptError ? bS.btnHidden : ''}`}
              onClick={handleEditableClick}
              tabIndex={-1}
            >
              {data?.expirationDateEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <PaymentCardExpirationDate
              ref={inputRef}
              value={getExpirationDateValue()}
              inputId='editedExpirationDate'
              onChange={handleExpirationDateChange}
              disabled={!data?.expirationDateEditable || sifDecryptError}
              securityType={originalItem?.securityType}
              sifExists={originalItem?.sifExists}
            />

            <div className={pI.passInputBottomButtons}>
              {((originalItem?.securityType === SECURITY_TIER.SECRET || itemInstance?.expirationDateExists) && !sifDecryptError) && (
                <button
                  type='button'
                  className={`${bS.btn} ${pI.iconButton}`}
                  onClick={handleCopyExpirationDate}
                  title={getMessage('details_copy_expiration_date')}
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
            <p className={paymentCardExpirationDateValidation(getExpirationDateValue()) ? '' : pI.empty}>{paymentCardExpirationDateValidation(getExpirationDateValue()) ? getMessage('details_card_expired') : ''}</p>
          </div>
        </div>
      )}
    </Field>
  );
}

export default CardExpirationDate;
