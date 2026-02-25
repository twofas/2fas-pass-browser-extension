// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../AddNew.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { memo, useState, useMemo, useCallback } from 'react';
import usePopupState from '../../../store/popupState/usePopupState';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice } from '@/partials/functions';
import Wifi from '@/models/itemModels/Wifi';
import { useNavigate, useLocation } from 'react-router';
import { PULL_REQUEST_TYPES } from '@/constants';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { useI18n } from '@/partials/context/I18nContext';

const DEFAULT_SECURITY_TYPE = 'wpa2';

const selectStyles = {
  control: base => ({ ...base, textAlign: 'left' })
};

/**
* WifiAddNewView component for adding a new Wi-Fi network.
* @return {JSX.Element} The rendered component.
*/
function WifiAddNewView () {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, setData, setBatchData } = usePopupState();

  const [inputError, setInputError] = useState(undefined);

  const securityTypeOptions = useMemo(() =>
    Wifi.SECURITY_TYPES.map(type => ({
      value: type,
      label: getMessage(`wifi_security_${type}`)
    })),
  [getMessage]);

  const handleSecurityTypeChange = useCallback(selectedOption => {
    const newValue = selectedOption ? selectedOption.value : DEFAULT_SECURITY_TYPE;
    setData('securityType', newValue);
  }, [setData]);

  const isNameInvalid = useMemo(() => {
    const name = data?.name;

    if (!name || name.length === 0) {
      return false;
    }

    return name.length > 255;
  }, [data?.name]);

  const validate = values => {
    const errors = {};

    if (!values?.name || values?.name?.length <= 0) {
      errors.name = getMessage('add_new_validate_wifi_name_required');
    } else if (values.name?.length > 255) {
      errors.name = getMessage('add_new_validate_wifi_name_length');
    }

    if (values?.ssid && values.ssid?.length > 255) {
      errors.ssid = getMessage('add_new_validate_wifi_ssid_length');
    }

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!data?.securityType) {
      setData('securityType', DEFAULT_SECURITY_TYPE);
    }

    if (data?.hidden === undefined) {
      setData('hidden', false);
    }
  }, []);

  useEffect(() => {
    if (location?.state?.data) {
      const stateData = location.state.data;
      const batchUpdate = {};

      if (stateData.name) batchUpdate.name = stateData.name;
      if (stateData.ssid) batchUpdate.ssid = stateData.ssid;
      if (stateData.securityType) batchUpdate.securityType = stateData.securityType;
      if (stateData.hidden !== undefined) batchUpdate.hidden = stateData.hidden;
      if (stateData.wifiPassword) batchUpdate.wifiPassword = stateData.wifiPassword;

      if (Object.keys(batchUpdate).length > 0) {
        setBatchData(batchUpdate);
      }
    }
  }, [location?.state?.data, setBatchData]);

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    // FUTURE - change to select device
    const device = await getCurrentDevice();

    if (!device) {
      return showToast(getMessage('error_no_current_device'), 'error');
    }

    const deviceId = device.id;

    const formData = {
      contentType: Wifi.contentType,
      content: {
        name: e.name ? e.name : '',
        ssid: e.ssid ? e.ssid : '',
        securityType: data?.securityType || DEFAULT_SECURITY_TYPE,
        hidden: data?.hidden || false,
        s_wifi_password: e.wifiPassword ? e.wifiPassword : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'add-new',
        data: formData,
        originalData: e,
        model: Wifi.contentType,
        deviceId
      }
    });
  };

  return (
    <>
      <h2>{getMessage('add_new_header_wifi')}</h2>
      <h3>{getMessage('add_new_subheader')}</h3>

      <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting }) => ( // form
        <form onSubmit={handleSubmit}>
          <Field name='name'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-name'>{getMessage('wifi_name')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type='text'
                    {...input}
                    className={isNameInvalid ? pI.inputTextError : ''}
                    placeholder={getMessage('placeholder_wifi_name')}
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
          <Field name='ssid'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'ssid' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-ssid'>{getMessage('wifi_ssid')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type='text'
                    {...input}
                    placeholder={getMessage('placeholder_wifi_ssid')}
                    id='add-new-ssid'
                    dir='ltr'
                    spellCheck='false'
                    autoCorrect='off'
                    autoComplete='off'
                    autoCapitalize='off'
                    onChange={e => {
                      input.onChange(e);
                      setData('ssid', e.target.value);
                    }}
                  />
                </div>
              </div>
            )}
          </Field>
          <Field name='wifiPassword'>
            {({ input }) => (
              <div className={`${pI.passInput} ${inputError === 'wifiPassword' ? pI.error : ''}`}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-wifi-password'>{getMessage('wifi_password')}</label>
                </div>
                <div className={pI.passInputBottom}>
                  <input
                    type='text'
                    {...input}
                    placeholder={getMessage('placeholder_wifi_password')}
                    id='add-new-wifi-password'
                    dir='ltr'
                    spellCheck='false'
                    autoCorrect='off'
                    autoComplete='off'
                    autoCapitalize='off'
                    onChange={e => {
                      input.onChange(e);
                      setData('wifiPassword', e.target.value);
                    }}
                  />
                </div>
              </div>
            )}
          </Field>
          <Field name='securityType'>
            {({ input }) => (
              <div className={pI.passInput}>
                <div className={pI.passInputTop}>
                  <label htmlFor='add-new-security-type'>{getMessage('add_new_wifi_type')}</label>
                </div>
                <div className={`${pI.passInputBottom} ${pI.switch}`}>
                  <AdvancedSelect
                    className='react-select-container'
                    classNamePrefix='react-select'
                    isSearchable={false}
                    options={securityTypeOptions}
                    value={securityTypeOptions.find(option => option.value === (data?.securityType || DEFAULT_SECURITY_TYPE))}
                    onChange={handleSecurityTypeChange}
                    onBlur={input.onBlur}
                    styles={selectStyles}
                  />
                </div>
              </div>
            )}
          </Field>
          <div className={pI.passInput}>
            <div className={pI.passInputAdditional}>
              <div className={`${bS.passToggle} ${bS.loaded}`}>
                <input
                  type='checkbox'
                  name='hidden-network'
                  id='hidden-network'
                  checked={data?.hidden || false}
                  onChange={() => {
                    setData('hidden', !data?.hidden);
                  }}
                />
                <label htmlFor='hidden-network'>
                  <span className={bS.passToggleBox}>
                    <span className={bS.passToggleBoxCircle}></span>
                  </span>

                  <span className={bS.passToggleText}>
                    <span>{getMessage('wifi_hidden')}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className={S.addNewButtons}>
            <button
              type='submit'
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={
                submitting ||
                !data?.name || data?.name?.length === 0
                ? 'disabled' : ''
              }
            >
              {getMessage('continue')}
            </button>
          </div>
        </form>
      )}
      />
    </>
  );
}

export default memo(WifiAddNewView);
