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
import SecureNote from '@/models/itemModels/SecureNote';
import { PULL_REQUEST_TYPES } from '@/constants';
import { useI18n } from '@/partials/context/I18nContext';

const Name = lazy(() => import('../../components/Name'));
const SecureNoteText = lazy(() => import('../../components/SecureNoteText'));
const AdditionalInfo = lazy(() => import('../../components/AdditionalInfo'));
const SecurityType = lazy(() => import('../../components/SecurityType'));
const Tags = lazy(() => import('../../components/Tags'));
const DangerZone = lazy(() => import('../../components/DangerZone'));

/** 
* Function to render the details component for Secure Note.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SecureNoteDetailsView(props) {
  const { getMessage } = useI18n();
  const { data } = usePopupState();
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();

  const getFirstError = errors => {
    for (const key of Object.keys(errors)) {
      const value = errors[key];

      if (typeof value === 'string') {
        return { key, message: value };
      }

      if (typeof value === 'object' && value !== null) {
        const nestedResult = getFirstError(value);

        if (nestedResult) {
          return { key: `${key}.${nestedResult.key}`, message: nestedResult.message };
        }
      }
    }

    return null;
  };

  const validate = values => {
    const errors = {};

    if (!values?.content?.name || values?.content?.name?.length <= 0) {
      errors.name = getMessage('details_name_required');
    } else if (values.content?.name?.length > 255) {
      errors.name = getMessage('details_name_max_length');
    }

    if (data.sifEditable) {
      const tempText = values?.editedSif || '';

      if (tempText.length > 16384) {
        if (errors?.content === undefined) {
          errors.content = {};
        }

        errors.content.s_text = getMessage('details_secure_note_text_max_length');
      }
    }

    if (values?.content?.additionalInfo && values?.content?.additionalInfo?.length > 16384) {
      if (errors?.content === undefined) {
        errors.content = {};
      }

      errors.content.additionalInfo = getMessage('details_additional_info_max_length');
    }

    const firstError = getFirstError(errors);

    if (firstError) {
      showToast(firstError.message, 'error');
      setInputError(firstError.key);
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
      contentType: SecureNote.contentType,
      deviceId: e.deviceId,
      itemId: e.id,
      vaultId: e.vaultId,
      content: {}
    };

    if (props.originalItem?.isT3orT2WithSif) {
      stateData.sifFetched = true;
    }

    if (data.nameEditable) {
      stateData.content.name = e?.content?.name ? e.content.name : '';
    }

    if (data.sifEditable) {
      stateData.content.s_text = data.editedSif || '';
    }

    if (data.additionalInfoEditable) {
      stateData.content.additionalInfo = e?.content?.additionalInfo ? e.content.additionalInfo : '';
    }

    if (data.tierEditable) {
      if (props.originalItem?.securityType !== e.securityType) {
        stateData.securityType = e.securityType;
      }
    }

    if (data.tagsEditable) {
      stateData.tags = e.tags || [];
    }

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
      render={({ handleSubmit, form, submitting }) => ( // form, values
        <form onSubmit={handleSubmit}>
          <Name
            key={`name-${data.item.id}`}
            formData={{ inputError }}
          />
          <SecureNoteText
            key={`secure-note-text-${data.item.id}`}
            formData={{ form, originalItem: props.originalItem, inputError }}
            sifDecryptError={data.sifDecryptError}
          />
          {
            !data?.item?.content?.additionalInfo ? null : (
              <AdditionalInfo
                key={`additional-info-${data.item.id}`}
                formData={{ inputError }}
              />
            )
          }
          <SecurityType key={`security-type-${data.item.id}`} />
          <Tags key={`tags-${data.item.id}`} />
          <div className={S.detailsButton}>
            <button
              type="submit"
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={(getEditableAmount().amount <= 0 || submitting) ? 'disabled' : ''}
            >
              {getMessage('update')}{getEditableAmount().text}
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

export default SecureNoteDetailsView;
