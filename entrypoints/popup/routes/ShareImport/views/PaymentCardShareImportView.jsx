// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ShareImport.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice, paymentCardExpirationDateValidation } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import PaymentCard from '@/models/itemModels/PaymentCard';
import { PULL_REQUEST_TYPES, PAYMENT_CARD_REGEX } from '@/constants';
import PaymentCardNumberInput from '@/entrypoints/popup/components/PaymentCardNumberInput';
import PaymentCardSecurityCodeInput from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput';
import PaymentCardExpirationDate from '@/entrypoints/popup/components/PaymentCardExpirationDate';
import isCardNumberInvalid from '@/entrypoints/popup/components/PaymentCardNumberInput/validateCardNumber';
import isExpirationDateInvalid from '@/entrypoints/popup/components/PaymentCardExpirationDate/validateExpirationDate';
import isSecurityCodeInvalid from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput/validateSecurityCode';
import { useI18n } from '@/partials/context/I18nContext';

function PaymentCardShareImportView () {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const { data, setData } = usePopupState();
  const [inputError, setInputError] = useState(undefined);
  const [securityCodeTooLong, setSecurityCodeTooLong] = useState(false);

  const handleSecurityCodeTooLongChange = useCallback(isTooLong => {
    setSecurityCodeTooLong(isTooLong);
  }, []);

  const hasLiveValidationErrors = useMemo(() => {
    const cardNumberError = isCardNumberInvalid(data?.cardNumber);
    const expirationDateError = isExpirationDateInvalid(data?.expirationDate);
    const securityCodeError = isSecurityCodeInvalid(data?.securityCode, data?.cardNumber);

    return cardNumberError || expirationDateError || securityCodeError || securityCodeTooLong;
  }, [data?.cardNumber, data?.expirationDate, data?.securityCode, securityCodeTooLong]);

  const validate = useCallback(values => {
    const errors = {};

    if (!values?.name || values.name.length <= 0) {
      errors.name = getMessage('add_new_validate_card_name_required');
    } else if (values.name.length > 255) {
      errors.name = getMessage('add_new_validate_card_name_length');
    }

    if (values?.cardHolder && values.cardHolder.length > 255) {
      errors.cardHolder = getMessage('add_new_validate_cardholder_length');
    }

    if (data?.cardNumber && data.cardNumber.length > 0) {
      const cleanCardNumber = data.cardNumber.replace(/\s/g, '');

      if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
        errors.cardNumber = getMessage('add_new_validate_card_number_invalid');
      } else if (!PAYMENT_CARD_REGEX.test(cleanCardNumber)) {
        errors.cardNumber = getMessage('add_new_validate_card_number_invalid');
      } else if (!PaymentCard.isValidLuhn(cleanCardNumber)) {
        errors.cardNumber = getMessage('add_new_validate_card_number_invalid');
      }
    }

    if (data?.expirationDate && data.expirationDate.length > 0) {
      const expDateParts = data.expirationDate.split('/');

      if (expDateParts.length !== 2) {
        errors.expirationDate = getMessage('add_new_validate_expiration_date_invalid');
      } else {
        const month = parseInt(expDateParts[0], 10);
        const year = parseInt(expDateParts[1], 10);

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
          errors.expirationDate = getMessage('add_new_validate_expiration_date_invalid');
        }
      }
    }

    if (data?.securityCode && data.securityCode.length > 0) {
      if (!/^\d{3,4}$/.test(data.securityCode)) {
        errors.securityCode = getMessage('add_new_validate_security_code_invalid');
      }
    }

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  }, [data?.cardNumber, data?.expirationDate, data?.securityCode, getMessage]);

  const onSubmit = useCallback(async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    const device = await getCurrentDevice();

    if (!device) {
      return showToast(getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: PaymentCard.contentType,
      content: {
        name: e.name ? e.name : '',
        cardHolder: e.cardHolder ? e.cardHolder : '',
        s_cardNumber: data?.cardNumber ? data.cardNumber.replace(/\s/g, '') : '',
        s_expirationDate: data?.expirationDate ? data.expirationDate : '',
        s_securityCode: data?.securityCode ? data.securityCode.replace(/\D/g, '') : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'share-import',
        data: formData,
        model: PaymentCard.contentType,
        deviceId
      }
    });
  }, [validate, navigate, getMessage, data?.cardNumber, data?.expirationDate, data?.securityCode]);

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting, values }) => (
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-name'>{getMessage('payment_card_name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_payment_card_name')}
                  id='share-import-name'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('name', e.target.value);
                  }}
                />
              </div>
            </div>
          )}
        </Field>
        <Field name='cardHolder'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'cardHolder' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-card-holder'>{getMessage('payment_card_cardholder')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_payment_card_cardholder')}
                  id='share-import-card-holder'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('cardHolder', e.target.value);
                  }}
                />
              </div>
            </div>
          )}
        </Field>
        <Field name='cardNumber'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'cardNumber' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-card-number'>{getMessage('payment_card_card_number')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <PaymentCardNumberInput
                  {...input}
                  id='share-import-card-number'
                  onChange={e => {
                    input.onChange(e);
                    setData('cardNumber', e.target.value);
                  }}
                />
              </div>
            </div>
          )}
        </Field>
        <div className={S.shareImportSplitBox}>
          <Field name='expirationDate'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'expirationDate' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='share-import-expiration-date'>{getMessage('payment_card_expiration_date')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <PaymentCardExpirationDate
                    value={input.value}
                    inputId='share-import-expiration-date'
                    onChange={formattedValue => {
                      input.onChange(formattedValue);
                      setData('expirationDate', formattedValue);
                    }}
                  />
                </div>
                <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
                  <p className={paymentCardExpirationDateValidation(input.value) ? '' : pI.empty}>
                    {paymentCardExpirationDateValidation(input.value) ? getMessage('details_card_expired') : ''}
                  </p>
                </div>
              </div>
            )}
          </Field>
          <Field name='securityCode'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'securityCode' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='share-import-security-code'>{getMessage('payment_card_security_code')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <PaymentCardSecurityCodeInput
                    {...input}
                    id='share-import-security-code'
                    cardNumber={data?.cardNumber}
                    onChange={e => {
                      input.onChange(e);
                      setData('securityCode', e.target.value);
                    }}
                    onTooLongChange={handleSecurityCodeTooLongChange}
                  />
                </div>
                <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
                  <p className={securityCodeTooLong ? '' : pI.empty}>
                    {securityCodeTooLong ? getMessage('add_new_security_code_too_long') : ''}
                  </p>
                </div>
              </div>
            )}
          </Field>
        </div>
        <div className={S.shareImportButtons}>
          <button
            type='submit'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={
              submitting ||
              !values?.name || values.name.length === 0 ||
              hasLiveValidationErrors
                ? 'disabled' : ''
            }
          >
            {getMessage('share_import_add_item')}
          </button>
        </div>
      </form>
    )}
    />
  );
}

export default PaymentCardShareImportView;
