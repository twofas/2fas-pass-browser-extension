// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../ShareImport.module.scss';
import pI from '@/partials/global-styles/pass-input.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Form, Field } from 'react-final-form';
import { getCurrentDevice } from '@/partials/functions';
import usePopupState from '../../../store/popupState/usePopupState';
import Wifi from '@/models/itemModels/Wifi';
import { PULL_REQUEST_TYPES } from '@/constants';
import AdvancedSelect from '@/partials/components/AdvancedSelect';
import { useI18n } from '@/partials/context/I18nContext';

const DEFAULT_SECURITY_TYPE = 'wpa2';

const selectStyles = {
  control: base => ({ ...base, textAlign: 'left' })
};

function WifiShareImportView () {
  const { getMessage } = useI18n();
  const navigate = useNavigate();
  const { data, setData } = usePopupState();
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

  const validate = useCallback(values => {
    const errors = {};

    if (!values?.name || values.name.length <= 0) {
      errors.name = getMessage('add_new_validate_wifi_name_required');
    } else if (values.name.length > 255) {
      errors.name = getMessage('add_new_validate_wifi_name_length');
    }

    if (values?.ssid && values.ssid.length > 255) {
      errors.ssid = getMessage('add_new_validate_wifi_ssid_length');
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

    const formData = {
      contentType: Wifi.contentType,
      content: {
        name: e.name ? e.name : '',
        ssid: e.ssid ? e.ssid : '',
        securityType: data?.securityType || DEFAULT_SECURITY_TYPE,
        hidden: data?.hidden || false,
        s_wifi_password: e.password ? e.password : ''
      }
    };

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.ADD_DATA,
        from: 'share-import',
        data: formData,
        model: Wifi.contentType,
        deviceId
      }
    });
  }, [validate, navigate, getMessage, data?.securityType, data?.hidden]);

  return (
    <Form onSubmit={onSubmit} initialValues={data} render={({ handleSubmit, submitting, values }) => (
      <form onSubmit={handleSubmit}>
        <Field name='name'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'name' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-name'>{getMessage('wifi_name')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_wifi_name')}
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
        <Field name='ssid'>
          {({ input }) => (
            <div className={`${pI.passInput} ${inputError === 'ssid' ? pI.error : ''}`}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-ssid'>{getMessage('wifi_ssid')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_wifi_ssid')}
                  id='share-import-ssid'
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
        <Field name='password'>
          {({ input }) => (
            <div className={pI.passInput}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-wifi-password'>{getMessage('wifi_password')}</label>
              </div>
              <div className={pI.passInputBottom}>
                <input
                  type='text'
                  {...input}
                  placeholder={getMessage('placeholder_wifi_password')}
                  id='share-import-wifi-password'
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
              </div>
            </div>
          )}
        </Field>
        <Field name='securityType'>
          {({ input }) => (
            <div className={pI.passInput}>
              <div className={pI.passInputTop}>
                <label htmlFor='share-import-security-type'>{getMessage('add_new_wifi_type')}</label>
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
                id='share-import-hidden-network'
                checked={data?.hidden || false}
                onChange={() => { setData('hidden', !data?.hidden); }}
              />
              <label htmlFor='share-import-hidden-network'>
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
        <div className={S.shareImportButtons}>
          <button
            type='submit'
            className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
            disabled={
              submitting ||
              !values?.name || values.name.length === 0
                ? 'disabled' : ''
            }
          >
            {getMessage('share_import_add_item')}
          </button>
        </div>
      </form>
    )}
    />
  );
}

export default WifiShareImportView;
