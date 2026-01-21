// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { Field } from 'react-final-form';
import { useCallback, useMemo } from 'react';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import CustomTierOption from './CustomTierOption';
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import { useI18n } from '@/partials/context/I18nContext';

const selectComponents = { Option: CustomTierOption };

/**
* Function to render the security type selection field.
* @return {JSX.Element} The rendered component.
*/
function SecurityType () {
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();

  const securityTiersOptions = useMemo(() => [
    { value: SECURITY_TIER.SECRET, label: getMessage('tier_2_name'), description: getMessage('tier_2_description') },
    { value: SECURITY_TIER.HIGHLY_SECRET, label: getMessage('tier_1_name'), description: getMessage('tier_1_description') },
    { value: SECURITY_TIER.TOP_SECRET, label: getMessage('tier_0_name'), description: getMessage('tier_0_description') }
  ], [getMessage]);

  const handleTierEditable = async () => {
    if (data.tierEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        securityType: item.securityType,
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('tierEditable', false);
    } else {
      setData('tierEditable', true);
    }
  };

  const handleSelectChange = useCallback(async selectedOption => {
    const newValue = selectedOption ? selectedOption.value : null;

    const updatedItem = await updateItem(data.item, {
      securityType: newValue,
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  return (
    <Field name="securityType">
      {({ input }) => (
        <div className={pI.passInput}>
          <div className={pI.passInputTop}>
            <label htmlFor="securityType">{getMessage('details_security_type')}</label>
            <button
              type='button'
              className={`${bS.btn} ${bS.btnClear}`}
              onClick={handleTierEditable}
              tabIndex={-1}
            >
              {data.tierEditable ? getMessage('cancel') : getMessage('edit')}
            </button>
          </div>
          <div className={`${pI.passInputBottom} ${pI.switch}`}>
            <AdvancedSelect
              className='react-select-container'
              classNamePrefix='react-select'
              classNames={{ menuPortal: () => 'react-select-security-type__menu-portal' }}
              isSearchable={false}
              options={securityTiersOptions}
              value={securityTiersOptions.find(option => option.value === input.value)}
              onChange={handleSelectChange}
              onBlur={input.onBlur}
              menuPlacement='top'
              menuPosition='fixed'
              isDisabled={!data.tierEditable}
              components={selectComponents}
            />
          </div>
        </div>
      )}
    </Field>
  );
}

export default SecurityType;
