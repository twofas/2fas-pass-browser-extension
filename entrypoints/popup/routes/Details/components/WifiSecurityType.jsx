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
import usePopupState from '../../../store/popupState/usePopupState';
import getItem from '@/partials/sessionStorage/getItem';
import updateItem from '../functions/updateItem';
import Wifi from '@/models/itemModels/Wifi';
import { useI18n } from '@/partials/context/I18nContext';

const selectStyles = {
  control: base => ({ ...base, textAlign: 'left' })
};

function WifiSecurityType () {
  const { getMessage } = useI18n();
  const { data, setData, setItem } = usePopupState();

  const securityTypeOptions = useMemo(() =>
    Wifi.SECURITY_TYPES.map(type => ({
      value: type,
      label: getMessage(`wifi_security_${type}`)
    })),
  [getMessage]);

  const handleTypeEditable = async () => {
    if (data.wifiSecurityTypeEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { securityType: item.content.securityType },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('wifiSecurityTypeEditable', false);
    } else {
      setData('wifiSecurityTypeEditable', true);
    }
  };

  const handleSelectChange = useCallback(async selectedOption => {
    const newValue = selectedOption ? selectedOption.value : null;

    const updatedItem = await updateItem(data.item, {
      content: { securityType: newValue },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  const handleHiddenEditable = async () => {
    if (data.hiddenEditable) {
      let item = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

      const updatedItem = await updateItem(data.item, {
        content: { hidden: item.content.hidden },
        internalData: { ...data.item.internalData }
      });

      item = null;

      setItem(updatedItem);
      setData('hiddenEditable', false);
    } else {
      setData('hiddenEditable', true);
    }
  };

  const hiddenOptions = useMemo(() => [
    { value: true, label: getMessage('details_wifi_hidden_yes') },
    { value: false, label: getMessage('details_wifi_hidden_no') }
  ], [getMessage]);

  const handleHiddenChange = useCallback(async selectedOption => {
    const newValue = selectedOption ? selectedOption.value : false;

    const updatedItem = await updateItem(data.item, {
      content: { hidden: newValue },
      internalData: { ...data.item.internalData }
    });

    setItem(updatedItem);
  }, [data.item, setItem]);

  return (
    <>
      <Field name="content.securityType">
        {({ input }) => (
          <div className={pI.passInput}>
            <div className={pI.passInputTop}>
              <label htmlFor="wifiSecurityType">{getMessage('details_wifi_type')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear}`}
                onClick={handleTypeEditable}
                tabIndex={-1}
              >
                {data.wifiSecurityTypeEditable ? getMessage('cancel') : getMessage('edit')}
              </button>
            </div>
            <div className={`${pI.passInputBottom} ${pI.switch}`}>
              <AdvancedSelect
                className='react-select-container'
                classNamePrefix='react-select'
                isSearchable={false}
                options={securityTypeOptions}
                value={securityTypeOptions.find(option => option.value === input.value)}
                onChange={handleSelectChange}
                onBlur={input.onBlur}
                styles={selectStyles}
                isDisabled={!data.wifiSecurityTypeEditable}
              />
            </div>
          </div>
        )}
      </Field>
      <Field name="content.hidden">
        {({ input }) => (
          <div className={pI.passInput}>
            <div className={pI.passInputTop}>
              <label htmlFor="hiddenNetwork">{getMessage('wifi_hidden')}</label>
              <button
                type='button'
                className={`${bS.btn} ${bS.btnClear}`}
                onClick={handleHiddenEditable}
                tabIndex={-1}
              >
                {data.hiddenEditable ? getMessage('cancel') : getMessage('edit')}
              </button>
            </div>
            <div className={`${pI.passInputBottom} ${pI.switch}`}>
              <AdvancedSelect
                className='react-select-container'
                classNamePrefix='react-select'
                isSearchable={false}
                options={hiddenOptions}
                value={hiddenOptions.find(option => option.value === (input.value || false))}
                onChange={handleHiddenChange}
                onBlur={input.onBlur}
                styles={selectStyles}
                isDisabled={!data.hiddenEditable}
              />
            </div>
          </div>
        )}
      </Field>
    </>
  );
}

export default WifiSecurityType;
