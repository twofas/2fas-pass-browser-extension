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
import Login from '@/partials/models/itemModels/Login';
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
* Function to render the details component for Login.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function LoginDetailsView (props) {
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

    if (data.item.isT3orT2WithSif) {
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
        stateData.content.s_password = { value: '', action: REQUEST_STRING_ACTIONS.GENERATE };
      } else {
        stateData.content.s_password = { value: data?.item?.internalData?.editedSif ? valueToNFKD(data.item.internalData.editedSif) : '', action: REQUEST_STRING_ACTIONS.SET };
      }
    }

    const hasEditedUris = data?.domainsEditable ? Object.values(data.domainsEditable).some(v => v === true) : false;
    const hasNewUris = e?.content?.uris?.some(uri => uri?.new);
    const hasRemovedUris = (data?.urisRemoved || 0) > 0;

    const originalUrisCount = props.originalItem?.content?.uris?.length || 0;
    const currentUrisCount = e?.content?.uris?.length || 0;
    const urisCountChanged = originalUrisCount !== currentUrisCount;

    const hasUriChanges = hasEditedUris || hasNewUris || hasRemovedUris || urisCountChanged;

    if (hasUriChanges) {
      const processedUris = (e.content.uris || []).map(uri => {
        return {
          text: uri?.text ? valueToNFKD(uri.text) : '',
          matcher: uri?.matcher
        };
      });

      e.content.uris = processedUris;
      stateData.content.uris = processedUris;
    }

    if (data.tierEditable) {
      const originalItem = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);
      
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
            formData={{ form, originalItem: props.originalItem }}
            sifDecryptError={data.sifDecryptError}
          />
          {generateURLs({ formData: { inputError } })}
          <SecurityType key={`security-type-${data.item.id}`} />
          <Tags key={`tags-${data.item.id}`} />
          <Notes key={`notes-${data.item.id}`} />
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
