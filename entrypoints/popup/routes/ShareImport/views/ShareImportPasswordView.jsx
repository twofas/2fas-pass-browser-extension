// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ShareImport.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useCallback } from 'react';
import { useI18n } from '@/partials/context/I18nContext';

function ShareImportPasswordView ({ onSubmit, error }) {
  const { getMessage } = useI18n();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async e => {
    e.preventDefault();

    if (!password || submitting) {
      return;
    }

    setSubmitting(true);
    await onSubmit(password);
    setSubmitting(false);
  }, [password, submitting, onSubmit]);

  const handleChange = useCallback(e => {
    setPassword(e.target.value);
  }, []);

  return (
    <>
      <h2>{getMessage('share_import_password_header')}</h2>
      <h3>{getMessage('share_import_password_subheader')}</h3>

      <form onSubmit={handleSubmit}>
        <div className={`${pI.passInput} ${error ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor='share-import-password'>{getMessage('password')}</label>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type='password'
              id='share-import-password'
              placeholder={getMessage('share_import_password_placeholder')}
              value={password}
              onChange={handleChange}
              dir='ltr'
              spellCheck='false'
              autoCorrect='off'
              autoComplete='off'
              autoCapitalize='off'
              autoFocus
            />
          </div>
          {error && (
            <div className={pI.passInputAdditional}>
              <p className={pI.inputTextError}>{error}</p>
            </div>
          )}
        </div>
        <div className={S.shareImportButtons}>
          <button
            type='submit'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={!password || submitting ? 'disabled' : ''}
          >
            {getMessage('share_import_password_submit')}
          </button>
        </div>
      </form>
    </>
  );
}

export default ShareImportPasswordView;
