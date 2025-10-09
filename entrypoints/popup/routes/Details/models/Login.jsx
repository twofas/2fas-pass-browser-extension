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
  const data = usePopupStateStore(state => state.data);
  const [inputError, setInputError] = useState(undefined);

  const validate = values => {
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
      render={({ handleSubmit, form, submitting }) => ( // form, values
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
            formData={{ form }}
          />
          {generateURLs({ formData: { inputError, storageVersion: props.storageVersion } })}
          <SecurityType key={`security-type-${data.item.id}-${props.storageVersion}`} />
          <Tags key={`tags-${data.item.id}-${props.storageVersion}`} />
          <Notes key={`notes-${data.item.id}-${props.storageVersion}`} />
          <div className={S.detailsButton}>
            <button
              type="submit"
              className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
              disabled={(getEditableAmount().amount <= 0 || submitting) ? 'disabled' : ''}
            >
              {browser.i18n.getMessage('update')}{getEditableAmount().text}
            </button>
          </div>

          <DangerZone
            key={`danger-zone-${data.item.id}-${props.storageVersion}`}
            formData={{ submitting }}
          />
        </form>
      )}
    />
  );
}

export default Login;
