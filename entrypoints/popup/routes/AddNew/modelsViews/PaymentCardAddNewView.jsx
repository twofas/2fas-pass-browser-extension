// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { memo, useState } from 'react';
import usePopupStateStore from '../../../store/popupState';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice } from '@/partials/functions';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';
import { useNavigate, useLocation } from 'react-router';
import { PULL_REQUEST_TYPES, PAYMENT_CARD_REGEX } from '@/constants';
import PaymentCardNumberInput from '@/entrypoints/popup/components/PaymentCardNumberInput';
import PaymentCardSecurityCodeInput from '@/entrypoints/popup/components/PaymentCardSecurityCodeInput';
import PaymentCardExpirationDate from '@/entrypoints/popup/components/PaymentCardExpirationDate';

/** 
* PaymentCardAddNewView component for adding a new Payment Card.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardAddNewView () {
  const navigate = useNavigate();
  const location = useLocation();

  const [inputError, setInputError] = useState(undefined);

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const validate = values => {
    const errors = {};

    if (!values?.name || values?.name?.length <= 0) {
      errors.name = browser.i18n.getMessage('add_new_validate_card_name_required');
    } else if (values.name?.length > 255) {
      errors.name = browser.i18n.getMessage('add_new_validate_card_name_length');
    }

    if (values?.cardHolder && values.cardHolder?.length > 255) {
      errors.cardHolder = browser.i18n.getMessage('add_new_validate_cardholder_length');
    }

    if (values?.cardNumber && values.cardNumber?.length > 0) {
      const cleanCardNumber = values.cardNumber.replace(/\s/g, '');

      if (!PAYMENT_CARD_REGEX.test(cleanCardNumber)) {
        errors.cardNumber = browser.i18n.getMessage('add_new_validate_card_number_invalid');
      }
    }

    if (values?.expirationDate && values.expirationDate?.length > 0) {
      const expDateParts = values.expirationDate.split('/');

      if (expDateParts.length !== 2) {
        errors.expirationDate = browser.i18n.getMessage('add_new_validate_expiration_date_invalid');
      } else {
        const month = parseInt(expDateParts[0], 10);
        const year = parseInt(expDateParts[1], 10);

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
          errors.expirationDate = browser.i18n.getMessage('add_new_validate_expiration_date_invalid');
        }
      }
    }

    if (values?.securityCode && values.securityCode?.length > 0) {
      if (!/^\d{3,4}$/.test(values.securityCode)) {
        errors.securityCode = browser.i18n.getMessage('add_new_validate_security_code_invalid');
      }
    }

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (location?.state?.data) {
      const stateData = location.state.data;
      if (stateData.name) setData('name', stateData.name);
      if (stateData.cardHolder) setData('cardHolder', stateData.cardHolder);
      if (stateData.cardNumber) setData('cardNumber', stateData.cardNumber);
      if (stateData.expirationDate) setData('expirationDate', stateData.expirationDate);
      if (stateData.securityCode) setData('securityCode', stateData.securityCode);
    }
  }, [location?.state?.data]);

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    // FUTURE - change to select device
    const device = await getCurrentDevice();

    if (!device) {
      return showToast(browser.i18n.getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: PaymentCard.contentType,
      content: {
        name: e.name ? e.name : '',
        cardHolder: e.cardHolder ? e.cardHolder : '',
        s_cardNumber: e.cardNumber ? e.cardNumber : '',
        s_expirationDate: e.expirationDate ? e.expirationDate : '',
        s_securityCode: e.securityCode ? e.securityCode : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'add-new',
        data: formData,
        originalData: e,
        model: PaymentCard.contentType,
        deviceId
      }
    });
  };

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting }) => ( // form
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='add-new-name'>{browser.i18n.getMessage('payment_card_name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={browser.i18n.getMessage('placeholder_payment_card_name')}
                  id='add-new-name'
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
                <label htmlFor='add-new-cardHolder'>{browser.i18n.getMessage('payment_card_cardholder')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={browser.i18n.getMessage('placeholder_payment_card_cardholder')}
                  id='add-new-cardHolder'
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
                <label htmlFor='add-new-cardNumber'>{browser.i18n.getMessage('payment_card_card_number')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <PaymentCardNumberInput
                  {...input}
                  id='add-new-cardNumber'
                  onChange={e => {
                    input.onChange(e);
                    setData('cardNumber', e.target.value);
                  }}
                />
              </div>
            </div>
          )}
        </Field>
        <div className={S.addNewSplitBox}>
          <Field name='expirationDate'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'expirationDate' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-expirationDate'>{browser.i18n.getMessage('payment_card_expiration_date')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <PaymentCardExpirationDate
                    value={input.value}
                    inputId='add-new-expirationDate'
                    onChange={formattedValue => {
                      input.onChange(formattedValue);
                      setData('expirationDate', formattedValue);
                    }}
                  />
                </div>
              </div>
            )}
          </Field>
          <Field name='securityCode'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'securityCode' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-securityCode'>{browser.i18n.getMessage('payment_card_security_code')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <PaymentCardSecurityCodeInput
                    {...input}
                    id='add-new-securityCode'
                    cardNumber={data?.cardNumber}
                    onChange={e => {
                      input.onChange(e);
                      setData('securityCode', e.target.value);
                    }}
                  />
                </div>
              </div>
            )}
          </Field>
        </div>
        <div className={S.addNewButtons}>
          <button
            type='submit'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={
              submitting || 
              !data?.name || data?.name?.length === 0 ||
              !data?.cardHolder || data?.cardHolder?.length === 0 ||
              !data?.cardNumber || data?.cardNumber?.length === 0 ||
              !data?.expirationDate || data?.expirationDate?.length === 0 ||
              !data?.securityCode || data?.securityCode?.length === 0
              ? 'disabled' : ''
            }
          >
            {browser.i18n.getMessage('continue')}
          </button>
        </div>
      </form>
    )}
    />
  );
}

export default memo(PaymentCardAddNewView);
