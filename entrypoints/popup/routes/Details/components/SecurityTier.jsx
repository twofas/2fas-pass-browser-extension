// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import Select from 'react-select';
import CustomTierOption from './CustomTierOption';

const securityTiersOptions = [
  { value: SECURITY_TIER.SECRET, label: browser.i18n.getMessage('tier_2_name'), description: browser.i18n.getMessage('tier_2_description') },
  { value: SECURITY_TIER.HIGHLY_SECRET, label: browser.i18n.getMessage('tier_1_name'), description: browser.i18n.getMessage('tier_1_description') },
  { value: SECURITY_TIER.TOP_SECRET, label: browser.i18n.getMessage('tier_0_name'), description: browser.i18n.getMessage('tier_0_description') }
];

 /**
* Function to render the security tier selection field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SecurityTier (props) {
  const { data, actions } = props;
  const { service, tierEditable, form } = data;
  const { setTierEditable } = actions;

  const handleTierEditable = form => {
    if (tierEditable) {
      form.change('securityType', service.securityType);
    }

    setTierEditable(!tierEditable);
  };

  return (
    <Field name="securityType">
      {({ input }) => (
        <div className={pI.passInput}>
          <div className={pI.passInputTop}>
            <label htmlFor="securityType">{browser.i18n.getMessage('details_security_type')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={() => handleTierEditable(form)}
            >
              {tierEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={`${pI.passInputBottom} ${pI.switch}`}>
            <Select
              {...input}
              className='react-select-container'
              classNamePrefix='react-select'
              isSearchable={false}
              options={securityTiersOptions}
              value={securityTiersOptions.find(option => option.value === input.value)}
              menuPlacement='top'
              menuPosition='fixed'
              isDisabled={!tierEditable}
              components={{
                Option: CustomTierOption
              }}
            />
          </div>
        </div>
      )}
    </Field>
  );
}

export default SecurityTier;
