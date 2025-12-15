// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useNavigate } from 'react-router';
import { useState, lazy } from 'react';
import getEditableAmount from './functions/getEditableAmount';
import { Form } from 'react-final-form';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';
import PaymentCard from '@/partials/models/itemModels/PaymentCard';
import { PULL_REQUEST_TYPES, PAYMENT_CARD_REGEX } from '@/constants';
import getItem from '@/partials/sessionStorage/getItem';

const Name = lazy(() => import('../../components/Name'));
const CardHolder = lazy(() => import('../../components/CardHolder'));
const CardNumber = lazy(() => import('../../components/CardNumber'));
const CardExpirationDate = lazy(() => import('../../components/CardExpirationDate'));
const CardSecurityCode = lazy(() => import('../../components/CardSecurityCode'));
const SecurityType = lazy(() => import('../../components/SecurityType'));
const Tags = lazy(() => import('../../components/Tags'));
const Notes = lazy(() => import('../../components/Notes'));
const DangerZone = lazy(() => import('../../components/DangerZone'));

/**
* Function to render the details component for Payment Card.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardDetailsView(props) {
  const { data } = usePopupState();
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();

  const validate = values => {
    const errors = {};

    if (data.nameEditable) {
      if (!values?.content?.name || values?.content?.name?.length <= 0) {
        errors.name = browser.i18n.getMessage('details_name_required');
      } else if (values.content?.name?.length > 255) {
        errors.name = browser.i18n.getMessage('details_name_max_length');
      }
    }

    if (data.cardHolderEditable) {
      if (values?.content?.cardHolder && values.content?.cardHolder?.length > 255) {
        errors.cardHolder = browser.i18n.getMessage('details_cardholder_max_length');
      }
    }

    if (data.cardNumberEditable) {
      const cardNumber = values?.editedCardNumber || '';

      if (cardNumber && cardNumber.length > 0) {
        const cleanCardNumber = cardNumber.replace(/\s/g, '');

        if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
          errors.cardNumber = browser.i18n.getMessage('details_card_number_invalid');
        } else if (!PAYMENT_CARD_REGEX.test(cleanCardNumber)) {
          errors.cardNumber = browser.i18n.getMessage('details_card_number_invalid');
        } else if (!PaymentCard.isValidLuhn(cleanCardNumber)) {
          errors.cardNumber = browser.i18n.getMessage('details_card_number_invalid');
        }
      }
    }

    if (data.expirationDateEditable) {
      const expirationDate = values?.editedExpirationDate || '';

      if (expirationDate && expirationDate.length > 0) {
        const expDateParts = expirationDate.split('/');

        if (expDateParts.length !== 2) {
          errors.expirationDate = browser.i18n.getMessage('details_expiration_date_invalid');
        } else {
          const month = parseInt(expDateParts[0], 10);
          const year = parseInt(expDateParts[1], 10);

          if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
            errors.expirationDate = browser.i18n.getMessage('details_expiration_date_invalid');
          }
        }
      }
    }

    if (data.securityCodeEditable) {
      const securityCode = values?.editedSecurityCode || '';

      if (securityCode && securityCode.length > 0) {
        if (!/^\d{3,4}$/.test(securityCode)) {
          errors.securityCode = browser.i18n.getMessage('details_security_code_invalid');
        }
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

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    const stateData = {
      contentType: PaymentCard.contentType,
      deviceId: e.deviceId,
      itemId: e.id,
      vaultId: e.vaultId,
      content: {}
    };

    if (data.item.isT3orT2WithSif) {
      stateData.sifFetched = true;
    }

    if (data.nameEditable) {
      stateData.content.name = e?.content?.name ? e.content.name : '';
    }

    if (data.cardHolderEditable) {
      stateData.content.cardHolder = e?.content?.cardHolder ? e.content.cardHolder : '';
    }

    const itemJSON = data.item.toJSON();

    if (data.cardNumberEditable) {
      stateData.content.s_cardNumber = itemJSON.content.s_cardNumber;
    }

    if (data.expirationDateEditable) {
      stateData.content.s_expirationDate = itemJSON.content.s_expirationDate;
    }

    if (data.securityCodeEditable) {
      stateData.content.s_securityCode = itemJSON.content.s_securityCode;
    }

    if (data.notesEditable) {
      stateData.content.notes = e?.content?.notes ? e.content.notes : '';
    }

    if (data.tierEditable) {
      const originalItem = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      if (originalItem.securityType !== e.securityType) {
        stateData.securityType = e.securityType;
      }
    }

    if (data.tagsEditable) {
      stateData.tags = e.tags || [];
    }

    stateData.uiState = {
      nameEditable: data.nameEditable,
      cardHolderEditable: data.cardHolderEditable,
      cardNumberEditable: data.cardNumberEditable,
      expirationDateEditable: data.expirationDateEditable,
      securityCodeEditable: data.securityCodeEditable,
      cardNumberVisible: data.cardNumberVisible,
      expirationDateVisible: data.expirationDateVisible,
      securityCodeVisible: data.securityCodeVisible,
      notesEditable: data.notesEditable,
      tierEditable: data.tierEditable,
      tagsEditable: data.tagsEditable,
      sifDecryptError: data.sifDecryptError
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.UPDATE_DATA,
        from: 'details',
        data: stateData
      }
    });
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={data.item}
      render={({ handleSubmit, form, submitting }) => (
        <form onSubmit={handleSubmit}>
          <Name
            key={`name-${data.item.id}`}
            formData={{ inputError }}
          />
          <CardHolder
            key={`cardholder-${data.item.id}`}
            formData={{ inputError }}
          />
          <CardNumber
            key={`cardnumber-${data.item.id}`}
            formData={{ form, originalItem: props.originalItem }}
            sifDecryptError={data.sifDecryptError}
          />
          <div className={S.detailsSplitBox}>
            <CardExpirationDate
              key={`expirationdate-${data.item.id}`}
              formData={{ form, originalItem: props.originalItem }}
              sifDecryptError={data.sifDecryptError}
            />
            <CardSecurityCode
              key={`securitycode-${data.item.id}`}
              formData={{ form, originalItem: props.originalItem }}
              sifDecryptError={data.sifDecryptError}
            />
          </div>
          <SecurityType key={`security-type-${data.item.id}`} />
          <Tags key={`tags-${data.item.id}`} />
          <Notes key={`notes-${data.item.id}`} />
          <div className={S.detailsButton}>
            <button
              type="submit"
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={(getEditableAmount().amount <= 0 || submitting) ? 'disabled' : ''}
            >
              {browser.i18n.getMessage('update')}{getEditableAmount().text}
            </button>
          </div>

          <DangerZone
            key={`danger-zone-${data.item.id}`}
            formData={{ submitting }}
          />
        </form>
      )}
    />
  );
}

export default PaymentCardDetailsView;
