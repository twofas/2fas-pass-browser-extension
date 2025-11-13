// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { memo } from 'react';
import usePopupStateStore from '../../../store/popupState';
import { Form, Field } from 'react-final-form';
import { valueToNFKD, getCurrentDevice } from '@/partials/functions';
import SecureNote from '@/partials/models/itemModels/SecureNote';
import { useNavigate } from 'react-router';
import { PULL_REQUEST_TYPES } from '@/constants';

/** 
* SecureNoteAddNewView component for adding a new Secure Note.
* @return {JSX.Element} The rendered component.
*/
function SecureNoteAddNewView () {
  const navigate = useNavigate();

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const onSubmit = async e => {
    // FUTURE - change to select device
    const device = await getCurrentDevice();

    if (!device) {
      return showToast(browser.i18n.getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: SecureNote.contentType,
      content: {
        name: e.name ? valueToNFKD(e.name) : '',
        s_text: e.note ? valueToNFKD(e.note) : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'add-new',
        data: formData,
        deviceId
      }
    });
  };

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting }) => ( // form
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='add-new-name'>{browser.i18n.getMessage('secure_note_name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={browser.i18n.getMessage('secure_note_name_placeholder')}
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
        <Field name='note'>
          {({ input }) => (
            <div className={`${pI.passInput}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='add-new-note'>{browser.i18n.getMessage('secure_note')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <textarea
                  {...input}
                  className={S.addNewSecureNoteTextarea}
                  placeholder={browser.i18n.getMessage('secure_note_placeholder')}
                  id='add-new-note'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('note', e.target.value);
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
            {browser.i18n.getMessage('continue')}
          </button>
        </div>
      </form>
      )}
    />
  );
}

export default memo(SecureNoteAddNewView);
