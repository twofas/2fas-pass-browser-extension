// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Details.module.scss';
import bS from '@/partials/global-styles/buttons.module.scss';
import { useNavigate } from 'react-router';
import { useState, lazy } from 'react';
import getEditableAmount from './functions/getEditableAmount';
import { Form } from 'react-final-form';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';
import SecureNote from '@/partials/models/itemModels/SecureNote';
import { PULL_REQUEST_TYPES } from '@/constants';
import getItem from '@/partials/sessionStorage/getItem';

const Name = lazy(() => import('../../components/Name'));
const CardHolder = lazy(() => import('../../components/CardHolder'));
const SecurityType = lazy(() => import('../../components/SecurityType'));
const Tags = lazy(() => import('../../components/Tags'));
const Notes = lazy(() => import('../../components/Notes'));
const DangerZone = lazy(() => import('../../components/DangerZone'));

/** 
* Function to render the details component for Payment Card.
* @param {Object} props - The component props.
* @return {JSX.Element} The rendered component.
*/
function PaymentCardDetailsView (props) {
  const data = usePopupStateStore(state => state.data);
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();

  const validate = values => {
    const errors = {};

    // if (!values?.content?.name || values?.content?.name?.length <= 0) {
    //   errors.name = browser.i18n.getMessage('details_name_required');
    // } else if (values.content?.name?.length > 255) {
    //   errors.name = browser.i18n.getMessage('details_name_max_length');
    // }

    // const errorKeys = Object.keys(errors);

    // if (errorKeys.length > 0) {
    //   showToast(errors[errorKeys[0]], 'error');
    //   setInputError(errorKeys[0]);
    //   return false;
    // }

    return true;
  };

  const onSubmit = async e => {
    // setInputError(undefined);

    // if (!validate(e)) {
    //   return false;
    // }

    // const stateData = {
    //   contentType: SecureNote.contentType,
    //   deviceId: e.deviceId,
    //   itemId: e.id,
    //   vaultId: e.vaultId,
    //   content: {}
    // };

    // if (data.item.isT3orT2WithSif) {
    //   stateData.sifFetched = true;
    // }

    // if (data.nameEditable) {
    //   stateData.content.name = e?.content?.name ? e.content.name : '';
    // }

    // if (data.sifEditable) {
    //   stateData.content.s_text = data?.item?.internalData?.editedSif ? data.item.internalData.editedSif : (data?.item?.sifDecrypted ? data.item.sifDecrypted : '');
    // }

    // if (data.tierEditable) {
    //   const originalItem = await getItem(data.item.deviceId, data.item.vaultId, data.item.id);

    //   if (originalItem.securityType !== e.securityType) {
    //     stateData.securityType = e.securityType;
    //   }
    // }

    // if (data.tagsEditable) {
    //   stateData.tags = e.tags || [];
    // }

    // stateData.uiState = {
    //   nameEditable: data.nameEditable,
    //   sifEditable: data.sifEditable,
    //   sifVisible: data.sifVisible,
    //   tierEditable: data.tierEditable,
    //   tagsEditable: data.tagsEditable,
    //   sifDecryptError: data.sifDecryptError
    // };

    // return navigate('/fetch', {
    //   state: {
    //     action: PULL_REQUEST_TYPES.UPDATE_DATA,
    //     from: 'details',
    //     data: stateData
    //   }
    // });
  };

  console.log(props);

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
          <CardHolder
            key={`cardholder-${data.item.id}`}
            formData={{ inputError }}
          />
          {/* Card number */}
          {/* 50/50 Expiration date / Security Code */}
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

export default PaymentCardDetailsView;
