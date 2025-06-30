// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';

/** 
* Function to render the name input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Name (props) {
  const { data, actions } = props;
  const { service, form, nameEditable, inputError } = data;
  const { setNameEditable } = actions;

  const handleNameEditable = form => {
    if (nameEditable) {
      form.change('name', service.name);
    }

    setNameEditable(!nameEditable);
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
              onClick={() => handleNameEditable(form)}
            >
              {nameEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              id="name"
              disabled={!nameEditable ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="off"
              autoCapitalize="off"
            />
          </div>
        </div>
      )}
    </Field>
  );
}

export default Name;
