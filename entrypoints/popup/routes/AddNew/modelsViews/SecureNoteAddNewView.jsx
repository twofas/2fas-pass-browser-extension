// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { memo, useState } from 'react';
import usePopupState from '../../../store/popupState/usePopupState';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice } from '@/partials/functions';
import SecureNote from '@/models/itemModels/SecureNote';
import { useNavigate, useLocation } from 'react-router';
import { PULL_REQUEST_TYPES } from '@/constants';
import { useI18n } from '@/partials/context/I18nContext';

/** 
* SecureNoteAddNewView component for adding a new Secure Note.
* @return {JSX.Element} The rendered component.
*/
function SecureNoteAddNewView() {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, setData, setBatchData } = usePopupState();

  const [inputError, setInputError] = useState(undefined);

  const validate = values => {
    const errors = {};

    if (!values?.name || values?.name?.length <= 0) {
      errors.name = getMessage('secure_note_name_required');
    } else if (values.name?.length > 255) {
      errors.name = getMessage('secure_note_name_max_length');
    }
    
    if (values?.text && values?.text?.length > 16384) {
      errors.text = getMessage('secure_note_text_max_length');
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
      const batchUpdate = {};

      if (stateData.name) batchUpdate.name = stateData.name;
      if (stateData.text) batchUpdate.text = stateData.text;

      if (Object.keys(batchUpdate).length > 0) {
        setBatchData(batchUpdate);
      }
    }
  }, [location?.state?.data, setBatchData]);

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    // FUTURE - change to select device
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
        from: 'add-new',
        data: formData,
        originalData: e,
        model: SecureNote.contentType,
        deviceId
      }
    });
  };

  return (
    <>
      <h2>{getMessage('add_new_header_secure_note')}</h2>
      <h3>{getMessage('add_new_subheader')}</h3>

      <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting }) => ( // form
        <form onSubmit={handleSubmit}>
          <Field name='name'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-name'>{getMessage('secure_note_name')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type='text'
                    {...input}
                    placeholder={getMessage('secure_note_name_placeholder')}
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
          <Field name='text'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'text' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-text'>{getMessage('secure_note_note')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <textarea
                    {...input}
                    className={S.addNewSecureNoteTextarea}
                    placeholder={getMessage('secure_note_placeholder')}
                    id='add-new-text'
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
          <div className={S.addNewButtons}>
            <button
              type='submit'
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={submitting || !data?.name || data?.name?.length === 0 ? 'disabled' : ''}
            >
              {getMessage('continue')}
            </button>
          </div>
        </form>
      )}
      />
    </>
  );
}

export default memo(SecureNoteAddNewView);
