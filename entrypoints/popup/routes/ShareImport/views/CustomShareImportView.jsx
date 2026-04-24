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
import { getCurrentDevice } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import SecureNote from '@/models/itemModels/SecureNote';
import { PULL_REQUEST_TYPES } from '@/constants';
import { useI18n } from '@/partials/context/I18nContext';

function CustomShareImportView () {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const { data, setData } = usePopupState();
  const [inputError, setInputError] = useState(undefined);

  const isNameInvalid = useMemo(() => {
    const name = data?.name;

    if (!name || name.length === 0) {
      return false;
    }

    return name.length > 255;
  }, [data?.name]);

  const validate = useCallback(values => {
    const errors = {};

    if (!values?.name || values.name.length <= 0) {
      errors.name = getMessage('share_import_name_required');
    } else if (values.name.length > 255) {
      errors.name = getMessage('share_import_name_max_length');
    }

    if (values?.text && values.text.length > 16384) {
      errors.text = getMessage('share_import_text_max_length');
    }

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  }, [getMessage]);

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
      contentType: SecureNote.contentType,
      content: {
        name: e.name ? e.name : '',
        s_text: e.text ? e.text : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'share-import',
        data: formData,
        model: SecureNote.contentType,
        deviceId
      }
    });
  }, [validate, navigate, getMessage]);

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting, values }) => (
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-name'>{getMessage('secure_note_name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  className={isNameInvalid ? pI.inputTextError : ''}
                  placeholder={getMessage('secure_note_name_placeholder')}
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
        <Field name='text'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'text' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-text'>{getMessage('secure_note_note')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <textarea
                  {...input}
                  className={S.shareImportSecureNoteTextarea}
                  placeholder={getMessage('secure_note_placeholder')}
                  id='share-import-text'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('text', e.target.value);
                  }}
                />
              </div>
            </div>
          )}
        </Field>
        <div className={S.shareImportButtons}>
          <button
            type='submit'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={submitting || !values?.name || values.name.length === 0 ? 'disabled' : ''}
          >
            {getMessage('share_import_add_item')}
          </button>
        </div>
      </form>
    )}
    />
  );
}

export default CustomShareImportView;
