// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ShareImport.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice, copyValue } from '@/partials/functions';
import domainValidation from '@/partials/functions/domainValidation.jsx';
import usePopupState from '../../../store/popupState/usePopupState';
import Login from '@/models/itemModels/Login';
import URIMatcher from '@/partials/URIMatcher';
import { PULL_REQUEST_TYPES, REQUEST_STRING_ACTIONS } from '@/constants';
import { useI18n } from '@/partials/context/I18nContext';
import VisibleIcon from '@/assets/popup-window/visible.svg?react';
import CopyIcon from '@/assets/popup-window/copy-to-clipboard.svg?react';
import AddIcon from '@/assets/popup-window/add-new-2.svg?react';
import TrashIcon from '@/assets/popup-window/trash.svg?react';

function LoginShareImportView () {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const { data, setData } = usePopupState();
  const [inputError, setInputError] = useState(undefined);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const uris = data.uris || [];

  const handleUriChange = useCallback((index, value) => {
    const newUris = uris.map((u, i) => i === index ? { ...u, text: value } : u);
    setData('uris', newUris);
  }, [uris, setData]);

  const handleRemoveUri = useCallback(index => {
    const newUris = uris.filter((_, i) => i !== index);
    setData('uris', newUris);
  }, [uris, setData]);

  const handleAddUri = useCallback(() => {
    const newUris = [...uris, { text: '', matcher: String(URIMatcher.M_DOMAIN_TYPE) }];
    setData('uris', newUris);
  }, [uris, setData]);

  const handlePasswordVisibleClick = useCallback(() => {
    setPasswordVisible(prev => !prev);
  }, []);

  const handleCopyPassword = useCallback(async form => {
    try {
      const currentPassword = form.getFieldState('password').value;
      await copyValue(currentPassword, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'password');
      showToast(getMessage('notification_password_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_password_copy_failed'), 'error');
      await CatchError(e);
    }
  }, [getMessage]);

  const handleCopyUsername = useCallback(async form => {
    try {
      const currentUsername = form.getFieldState('username').value;
      await copyValue(currentUsername, '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'username');
      showToast(getMessage('notification_username_copied'), 'success');
    } catch (e) {
      showToast(getMessage('error_username_copy_failed'), 'error');
      await CatchError(e);
    }
  }, [getMessage]);

  const validate = useCallback(values => {
    const errors = {};

    if (!values?.name || values.name.length <= 0) {
      errors.name = getMessage('share_import_name_required');
    } else if (values.name.length > 255) {
      errors.name = getMessage('share_import_name_max_length');
    }

    if (values?.username && values.username.length > 255) {
      errors.username = getMessage('share_import_username_max_length');
    }

    if (values?.notes && values.notes.length > 16384) {
      errors.notes = getMessage('share_import_notes_max_length');
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

    const processedUris = uris
      .filter(uri => uri.text && uri.text.length > 0)
      .map(uri => ({
        text: uri.text,
        matcher: parseInt(uri.matcher, 10) || URIMatcher.M_DOMAIN_TYPE
      }));

    const formData = {
      contentType: Login.contentType,
      content: {
        name: e.name ? e.name : '',
        uris: processedUris,
        username: e.username
          ? { value: e.username, action: REQUEST_STRING_ACTIONS.SET }
          : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE },
        s_password: e.password
          ? { value: e.password, action: REQUEST_STRING_ACTIONS.SET }
          : { value: '', action: REQUEST_STRING_ACTIONS.GENERATE },
        notes: e.notes || ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'share-import',
        data: formData,
        model: Login.contentType,
        deviceId
      }
    });
  }, [validate, navigate, getMessage, uris]);

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, form, submitting, values }) => (
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-name'>{getMessage('name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_name')}
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
        {uris.map((uri, index) => (
          <div key={index} className={pI.passInput}>
            <div className={pI.passInputTop}>
              <label>{getMessage('domain_uri')}{uris.length > 1 ? ` ${index + 1}` : ''}</label>
            </div>
            <div className={pI.passInputBottom}>
              <input
                type='text'
                value={uri.text || ''}
                placeholder={getMessage('placeholder_domain_uri')}
                dir='ltr'
                spellCheck='false'
                autoCorrect='off'
                autoComplete='off'
                autoCapitalize='off'
                onChange={e => handleUriChange(index, e.target.value)}
              />
              <div className={pI.passInputBottomButtons}>
                {uris.length > 1 && (
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={() => handleRemoveUri(index)}
                    title={getMessage('details_remove_domain')}
                    tabIndex={-1}
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
            <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
              {domainValidation(uri.text || '')}
            </div>
          </div>
        ))}
        <div className={S.shareImportAddUri}>
          <button
            type='button'
            className={`${bS.btn} ${bS.btnClear} ${bS.domainAdd}`}
            onClick={handleAddUri}
          >
            <AddIcon />
            <span>{uris.length > 0 ? getMessage('details_add_another_domain') : getMessage('details_add_domain')}</span>
          </button>
        </div>
        <Field name='username'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'username' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-username'>{getMessage('username')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  id='share-import-username'
                  placeholder={getMessage('placeholder_username')}
                  onChange={e => {
                    input.onChange(e);
                    setData('username', e.target.value);
                  }}
                />
                <div className={pI.passInputBottomButtons}>
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={() => handleCopyUsername(form)}
                    title={getMessage('this_tab_copy_to_clipboard')}
                    tabIndex={-1}
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Field>
        <Field name='password'>
          {({ input }) => (
            <div className={pI.passInput}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-password'>{getMessage('password')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  {...input}
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder={getMessage('placeholder_password')}
                  id='share-import-password'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('password', e.target.value);
                  }}
                />
                <div className={pI.passInputBottomButtons}>
                  <button
                    type='button'
                    onClick={handlePasswordVisibleClick}
                    className={`${pI.iconButton} ${pI.visibleButton}`}
                    title={getMessage('details_toggle_password_visibility')}
                    tabIndex={-1}
                  >
                    <VisibleIcon />
                  </button>
                  <button
                    type='button'
                    className={`${bS.btn} ${pI.iconButton}`}
                    onClick={() => handleCopyPassword(form)}
                    title={getMessage('this_tab_copy_to_clipboard')}
                    tabIndex={-1}
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Field>
        <Field name='notes'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'notes' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-notes'>{getMessage('notes')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <textarea
                  {...input}
                  className={S.shareImportSecureNoteTextarea}
                  placeholder={getMessage('details_notes_placeholder')}
                  id='share-import-notes'
                  dir='ltr'
                  spellCheck='false'
                  autoCorrect='off'
                  autoComplete='off'
                  autoCapitalize='off'
                  onChange={e => {
                    input.onChange(e);
                    setData('notes', e.target.value);
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

export default LoginShareImportView;
