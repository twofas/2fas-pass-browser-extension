// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useCallback } from 'react';
import Select from 'react-select';
import CustomTierOption from './CustomTierOption';
import usePopupStateStore from '../../../store/popupState';
import getItem from '@/partials/sessionStorage/getItem';

const securityTiersOptions = [
  { value: SECURITY_TIER.SECRET, label: browser.i18n.getMessage('tier_2_name'), description: browser.i18n.getMessage('tier_2_description') },
  { value: SECURITY_TIER.HIGHLY_SECRET, label: browser.i18n.getMessage('tier_1_name'), description: browser.i18n.getMessage('tier_1_description') },
  { value: SECURITY_TIER.TOP_SECRET, label: browser.i18n.getMessage('tier_0_name'), description: browser.i18n.getMessage('tier_0_description') }
];

/**
* Function to render the security type selection field.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function SecurityType (props) {
  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  const { formData } = props;
  const { form } = formData;

  const handleTierEditable = async () => {
    if (data.tierEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);
      const itemData = data.item.toJSON();
      itemData.securityType = item.securityType;
      const updatedItem = new (data.item.constructor)(itemData);
      item = null;

      setData('tierEditable', false);
      setData('item', updatedItem);
    } else {
      setData('tierEditable', true);
    }
  };

  const handleSelectChange = useCallback(selectedOption => {
    const newValue = selectedOption ? selectedOption.value : null;
    const itemData = data.item.toJSON();
    itemData.securityType = newValue;
    itemData.internalData = { ...data.item.internalData };
    const updatedItem = new (data.item.constructor)(itemData);

    if (data.item.isPasswordDecrypted) {
      updatedItem.setPasswordDecrypted(data.item.passwordDecrypted);
    }

    setData('item', updatedItem);
    form.change('securityType', newValue);
  }, [data.item, setData, form]);

  return (
    <Field name="securityType">
      {({ input }) => (
        <div className={pI.passInput}>
          <div className={pI.passInputTop}>
            <label htmlFor="securityType">{browser.i18n.getMessage('details_security_type')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleTierEditable}
            >
              {data.tierEditable ? browser.i18n.getMessage('cancel') : browser.i18n.getMessage('edit')}
            </button>
          </div>
          <div className={`${pI.passInputBottom} ${pI.switch}`}>
            <Select
              className='react-select-container react-select-security-tier-container'
              classNamePrefix='react-select'
              isSearchable={false}
              options={securityTiersOptions}
              value={securityTiersOptions.find(option => option.value === input.value)}
              onChange={selectedOption => handleSelectChange(selectedOption)}
              onBlur={input.onBlur}
              menuPlacement='top'
              menuPosition='fixed'
              isDisabled={!data.tierEditable}
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

export default SecurityType;
