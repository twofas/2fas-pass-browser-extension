// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import domainValidation from '@/partials/functions/domainValidation.jsx';

/** 
* Function to render the URL input field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function URLComponent (props) {
  const { data, actions, index } = props;
  const { service, domainsEditable, inputError, form } = data;
  const { setDomainsEditable } = actions;

  const setDomainEditable = index => {
    const newDomainsEditable = [...domainsEditable];

    if (newDomainsEditable[index]) {
      form.change(`uris[${index}].text`, service.uris[index].text);
    }

    newDomainsEditable[index] = !newDomainsEditable[index];
    setDomainsEditable(newDomainsEditable);
  };

  return (
    <Field name={`uris[${index}].text`}>
      {({ input }) => (
        <div className={`${pI.passInput} ${domainsEditable[index] ? '' : pI.disabled} ${inputError === `uris[${index}]` ? pI.error : ''}`} key={index}>
          <div className={pI.passInputTop}>
            <label htmlFor={`uri-${index}`}>{browser.i18n.getMessage('domain_uri_index').replace('%INDEX%', index + 1)}</label>
            <button type='button' className={`${bS.btn} ${bS.btnClear}`} onClick={() => setDomainEditable(index)}>{domainsEditable[index] ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}</button>
          </div>
          <div className={pI.passInputBottom}>
            <input
              type="text"
              {...input}
              id={`uri-${index}`}
              disabled={!domainsEditable[index] ? 'disabled' : ''}
              dir="ltr"
              spellCheck="false"
              autoCorrect="off"
              autoComplete="on"
              autoCapitalize="off"
            />
          </div>
          <div className={`${pI.passInputAdditional} ${pI.noValidDomain}`}>
            {domainValidation(input.value)}
          </div>
        </div>
      )}
    </Field>
  );
}

export default URLComponent;
