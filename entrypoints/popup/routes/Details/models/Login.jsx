// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useState, useEffect, lazy, useCallback, useRef } from 'react';
import generateURLs from '../functions/generateURLs';
import getEditableAmount from '../functions/getEditableAmount';
import { Form } from 'react-final-form';
import { valueToNFKD } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';

import URIMatcher from '@/partials/URIMatcher';
import { PULL_REQUEST_TYPES } from '@/constants';

const Name = lazy(() => import('../components/Name'));
const Username = lazy(() => import('../components/Username'));
const Password = lazy(() => import('../components/Password'));
const SecurityType = lazy(() => import('../components/SecurityType'));
const Tags = lazy(() => import('../components/Tags'));
const Notes = lazy(() => import('../components/Notes'));
const DangerZone = lazy(() => import('../components/DangerZone'));

/** 
* Function to render the details component.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function Login (props) {
  const location = useLocation();
  const navigate = useNavigate();

  const data = usePopupStateStore(state => state.data);
  const setData = usePopupStateStore(state => state.setData);

  // const [formValues, setFormValues] = useState(getInitialFormValues());
  const [dangerZoneOpened, setDangerZoneOpened] = useState(false);
  const [nameEditable, setNameEditable] = useState(false);
  const [usernameEditable, setUsernameEditable] = useState(false);
  const [passwordEditable, setPasswordEditable] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [domainsEditable, setDomainsEditable] = useState([]);
  const [passwordMobile, setPasswordMobile] = useState(false);
  const [usernameMobile, setUsernameMobile] = useState(false);
  const [tierEditable, setTierEditable] = useState(false);
  const [notesEditable, setNotesEditable] = useState(false);
  const [tagsEditable, setTagsEditable] = useState(false);
  const [inputError, setInputError] = useState(undefined);

  const handleRemoveUri = useCallback((index, form) => {
    // const currentValues = form.getState().values;
    // const newUris = currentValues.uris.filter((_, i) => i !== index);

    // form.change('uris', newUris);

    // const newDomainsEditable = domainsEditable.filter((_, i) => i !== index);
    // setDomainsEditable(newDomainsEditable);
    // setData('domainsEditable', newDomainsEditable);

    // const updatedFormValues = {
    //   ...currentValues,
    //   uris: newUris
    // };

    // setFormValues(updatedFormValues);
    // setData('formValues', updatedFormValues);

  }, [domainsEditable, setData]);

  const handleAddUri = useCallback(form => {
    // const currentValues = form.getState().values;
    // const currentUris = currentValues.uris || [];
    // const newUri = {
    //   text: '',
    //   matcher: URIMatcher.M_DOMAIN_TYPE,
    //   _tempId: `new-${Date.now()}-${Math.random()}`
    // };

    // const newUris = [...currentUris, newUri];
    // form.change('uris', newUris);

    // const newDomainsEditable = [...domainsEditable, true];
    // setDomainsEditable(newDomainsEditable);
    // setData('domainsEditable', newDomainsEditable);

    // const updatedFormValues = {
    //   ...currentValues,
    //   uris: newUris
    // };

    // setFormValues(updatedFormValues);
    // setData('formValues', updatedFormValues);
  }, [domainsEditable, setData]);

  const validate = values => {
    console.log(values);

    // const errors = {};

    // if (!values.name || values.name?.length <= 0) {
    //   errors.name = browser.i18n.getMessage('details_name_required');
    // } else if (values.name?.length > 255) {
    //   errors.name = browser.i18n.getMessage('details_name_max_length');
    // } else if (values.username?.length > 255) {
    //   errors.username = browser.i18n.getMessage('details_username_max_length');
    // }

    // values.uris.forEach((uri, index) => {
    //   if (uri?.text?.length > 2048) {
    //     errors[`uris[${index}]`] = browser.i18n.getMessage('details_uri_max_length');
    //   }
    // });

    // const errorKeys = Object.keys(errors);

    // if (errorKeys.length > 0) {
    //   showToast(errors[errorKeys[0]], 'error');
    //   setInputError(errorKeys[0]);
    //   return false;
    // }

    // return true;
  };

  const onSubmit = async e => {
    // setInputError(undefined);

    // if (!validate(e)) {
    //   return false;
    // }

    // e.uris = e.uris.map(uri => {
    //   return {
    //     text: uri?.text ? valueToNFKD(uri.text) : '',
    //     matcher: uri?.matcher
    //   };
    // });

    // const stateData = {
    //   itemId: service.id ? valueToNFKD(service.id) : null,
    //   deviceId: service?.deviceId
    // };

    // stateData.securityType = e?.securityType !== undefined ? (typeof e.securityType === 'number' ? e.securityType : e.securityType?.value) : (originalService || service)?.securityType;

    // if (nameEditable) {
    //   stateData.name = e.name ? valueToNFKD(e.name) : '';
    // }

    // if (usernameEditable) {
    //   if (usernameMobile) {
    //     stateData.usernameMobile = true;
    //   } else {
    //     stateData.username = e.username ? valueToNFKD(e.username) : '';
    //     stateData.usernameMobile = false;
    //   }
    // }

    // if (passwordEditable) {
    //   if (passwordMobile) {
    //     stateData.passwordMobile = true;
    //   } else {
    //     stateData.password = e.password ? valueToNFKD(e.password) : '';
    //     stateData.passwordMobile = false;
    //   }
    // }

    // if (notesEditable) {
    //   stateData.notes = e.notes ? valueToNFKD(e.notes) : '';
    // }

    // const hasUriChanges = domainsEditable.some(e => e) || e.uris?.some(uri => uri._tempId) || (service.uris?.length !== e.uris?.length);
    
    // if (hasUriChanges) {
    //   stateData.uris = e.uris;
    // }

    // if (tagsEditable) {
    //   stateData.tags = e.tags || [];
    // }

    // return navigate('/fetch', {
    //   state: {
    //     action: PULL_REQUEST_TYPES.UPDATE_DATA,
    //     from: 'details',
    //     data: stateData
    //   }
    // });
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={data.item}
      render={({ handleSubmit, form, submitting, values }) => (
        <form onSubmit={handleSubmit}>
          <Name
            key={`name-${data.item.id}-${props.storageVersion}`}
            formData={{ inputError }}
          />
          <Username
            key={`username-${data.item.id}-${props.storageVersion}`}
            formData={{ inputError }}
          />
          <Password
            key={`password-${data.item.id}-${props.storageVersion}`}
            data={{ service: data.item, passwordEditable, passwordVisible, passwordMobile, form }}
            actions={{
              setPasswordEditable: value => {
                setPasswordEditable(value);
                setData('passwordEditable', value);
              },
              setPasswordVisible: value => {
                setPasswordVisible(value);
                setData('passwordVisible', value);
              },
              setPasswordMobile: value => {
                setPasswordMobile(value);
                setData('passwordMobile', value);
              }
            }}
            generatorData={{ dangerZoneOpened, nameEditable, usernameEditable, domainsEditable, usernameMobile, tierEditable, notesEditable, passwordEditable, passwordVisible, passwordMobile }}
          />
          {generateURLs({
            data: { service: data.item, uris: values.uris, domainsEditable, inputError, form }, // originalService
            actions: {
              setDomainsEditable: value => {
                setDomainsEditable(value);
                setData('domainsEditable', value);
              },
              handleRemoveUri,
              handleAddUri,
              // updateFormValues
            }
          })}
          <SecurityType key={`security-type-${data.item.id}-${props.storageVersion}`} />
          <Tags
            key={`tags-${data.item.id}-${props.storageVersion}`}
            data={{ service: data.item, tagsEditable, form }}
            actions={{
              setTagsEditable: value => {
                setTagsEditable(value);
                setData('tagsEditable', value);
              }
            }}
          />
          <Notes key={`notes-${data.item.id}-${props.storageVersion}`} />
          <div className={S.detailsButton}>
            <button
              type="submit"
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={(getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable, tagsEditable, values.uris || []).amount <= 0 || submitting) ? 'disabled' : ''}
            >
              {browser.i18n.getMessage('update')}{getEditableAmount(nameEditable, usernameEditable, passwordEditable, domainsEditable, notesEditable, tierEditable, tagsEditable, values.uris || []).text}
            </button>
          </div>

          <DangerZone
            data={{ service: data.item, dangerZoneOpened, submitting }}
            actions={{
              setDangerZoneOpened: value => {
                setDangerZoneOpened(value);
                setData('dangerZoneOpened', value);
              }
            }}
          />
        </form>
      )}
    />
  );
}

export default Login;
