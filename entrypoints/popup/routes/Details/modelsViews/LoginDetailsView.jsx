// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useNavigate } from 'react-router';
import { useState, lazy } from 'react';
import generateURLs from '../functions/generateURLs';
import getEditableAmount from '../functions/getEditableAmount';
import { Form } from 'react-final-form';
import { valueToNFKD } from '@/partials/functions';
import usePopupStateStore from '../../../store/popupState';
import Login from '@/partials/models/Login';
import { PULL_REQUEST_TYPES, REQUEST_STRING_ACTIONS } from '@/constants';
import getItem from '@/partials/sessionStorage/getItem';

const Name = lazy(() => import('../components/Name'));
const Username = lazy(() => import('../components/Username'));
const Password = lazy(() => import('../components/Password'));
const SecurityType = lazy(() => import('../components/SecurityType'));
const Tags = lazy(() => import('../components/Tags'));
const Notes = lazy(() => import('../components/Notes'));
const DangerZone = lazy(() => import('../components/DangerZone'));

/** 
* Function to render the details component.
* @return {JSX.Element} The rendered component.
*/
function LoginDetailsView () {
  const data = usePopupStateStore(state => state.data);
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();

  const validate = values => {
    const errors = {};

    if (!values?.content?.name || values?.content?.name?.length <= 0) {
      errors.name = browser.i18n.getMessage('details_name_required');
    } else if (values.content?.name?.length > 255) {
      errors.name = browser.i18n.getMessage('details_name_max_length');
    } else if (values.content?.username?.length > 255) {
      errors.username = browser.i18n.getMessage('details_username_max_length');
    }

    values.content?.uris.forEach((uri, index) => {
      if (uri?.text?.length > 2048) {
        errors[`uris[${index}]`] = browser.i18n.getMessage('details_uri_max_length');
      }
    });

    const errorKeys = Object.keys(errors);

    if (errorKeys.length > 0) {
      showToast(errors[errorKeys[0]], 'error');
      setInputError(errorKeys[0]);
      return false;
    }

    return true;
  };

  const onSubmit = async e => {
    setInputError(undefined);

    if (!validate(e)) {
      return false;
    }

    const stateData = {
      contentType: Login.contentType,
      deviceId: e.deviceId,
      itemId: e.id,
      vaultId: e.vaultId,
      content: {}
    };

    if (data.item.securityType === SECURITY_TIER.HIGHLY_SECRET && data.item.sifExists) {
      stateData.sifFetched = true;
    }

    if (data.nameEditable) {
      stateData.content.name = e?.content?.name ? valueToNFKD(e.content.name) : '';
    }

    if (data.usernameEditable) {
      if (data.usernameMobile) {
        stateData.content.username = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      } else {
        stateData.content.username = { value: e?.content?.username ? valueToNFKD(e.content.username) : '', action: REQUEST_STRING_ACTIONS.SET };
      }
    }

    if (data.passwordEditable) {
      if (data.passwordMobile) {
        stateData.content.password = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      } else {
        stateData.content.password = { value: e?.content?.s_password ? valueToNFKD(e.content.s_password) : '', action: REQUEST_STRING_ACTIONS.SET };
      }
    }

    const hasUriChanges = (data?.domainsEditable && Array.isArray(data?.domainsEditable) && data.domainsEditable.some(e => e)) || e?.content?.uris?.some(uri => uri?.new);
    
    if (hasUriChanges) {
      e.content.uris = e.content.uris.map(uri => {
        return {
          text: uri?.text ? valueToNFKD(uri.text) : '',
          matcher: uri?.matcher
        };
      });

      stateData.content.uris = e.content.uris;
    }

    if (data.tierEditable) {
      const originalItem = await getItem(data.item.id);
      
      if (originalItem.securityType !== e.securityType) {
        stateData.securityType = e.securityType;
      }
    }

    if (data.tagsEditable) {
      stateData.tags = e.tags || [];
    }

    if (data.notesEditable) {
      stateData.content.notes = e?.content?.notes ? valueToNFKD(e.content.notes) : '';
    }

    return navigate('/fetch', {
      state: {
        action: PULL_REQUEST_TYPES.UPDATE_DATA,
        from: 'details',
        data: stateData
      }
    });
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={data.item}
      render={({ handleSubmit, form, submitting }) => ( // form, values
        <form onSubmit={handleSubmit}>
          <Name
            key={`name-${data.item.id}`}
            formData={{ inputError }}
          />
          <Username
            key={`username-${data.item.id}`}
            formData={{ inputError }}
          />
          <Password
            key={`password-${data.item.id}`}
            formData={{ form }}
          />
          {generateURLs({ formData: { inputError } })}
          <SecurityType
            key={`security-type-${data.item.id}`}
            formData={{ form }}
          />
          <Tags
            key={`tags-${data.item.id}`}
            formData={{ form }}
          />
          <Notes
            key={`notes-${data.item.id}`}
            formData={{ form }}
          />
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
            key={`danger-zone-${data.item.id}`}
            formData={{ submitting }}
          />
        </form>
      )}
    />
  );
}

export default LoginDetailsView;
