// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { lazy, useCallback } from 'react';
import copyValue from '@/partials/functions/copyValue';

const CopyIcon = lazy(() => import('@/assets/popup-window/copy-to-clipboard.svg?react'));

/** 
* Function to render the name input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Name (props) {
  const { data, actions } = props;
  const { service, originalService, form, nameEditable, inputError } = data;
  const { setNameEditable, updateFormValues } = actions;

  const handleCopyName = useCallback(async name => {
    if (!name) {
      return;
    }

    await copyValue(name, service.id, 'name');
    showToast(browser.i18n.getMessage('details_name_copied'), 'success');
  }, [service.id]);

  const handleNameEditable = (form, input) => {
    if (nameEditable) {
      const valueToRestore = originalService?.name || '';

      form.change('name', valueToRestore);

      if (input) {
        input.onChange(valueToRestore);
      }

      setNameEditable(false);

      if (updateFormValues) {
        const currentFormValues = form.getState().values;
        const updatedFormValues = { ...currentFormValues, name: valueToRestore };
        updateFormValues(updatedFormValues);
      }
    } else {
      setNameEditable(true);
    }
  };

  return (
    <Field name="name">
      {({ input }) => (
        <div className={`${pI.passInput} ${nameEditable ? '' : pI.disabled} ${inputError === 'name' ? pI.error : ''}`}>
          <div className={pI.passInputTop}>
            <label htmlFor="name">{browser.i18n.getMessage('name')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={() => handleNameEditable(form, input)}
            >
              {nameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              placeholder={browser.i18n.getMessage('placeholder_name')}
              id="name"
              disabled={!nameEditable ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
            />
          <button
            type='button'
            className={`${bS.btn} ${pI.iconButton}`}
            onClick={() => handleCopyName(input.value)}
            title={browser.i18n.getMessage('this_tab_copy_to_clipboard')}
          >
            <CopyIcon />
          </button>
        </div>
      </div>
      )}
    </Field>
  );
}

export default Name;
