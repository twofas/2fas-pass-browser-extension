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
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';
import Wifi from '@/models/itemModels/Wifi';
import { PULL_REQUEST_TYPES } from '@/constants';
import { useI18n } from '@/partials/context/I18nContext';
import { QrDialogProvider } from '@/entrypoints/popup/context/QrDialogContext';

const Name = lazy(() => import('../../components/Name'));
const ShowQrCode = lazy(() => import('../../components/ShowQrCode'));
const QrDialog = lazy(() => import('@/entrypoints/popup/components/QrDialog'));
const WifiSsid = lazy(() => import('../../components/WifiSsid'));
const WifiPassword = lazy(() => import('../../components/WifiPassword'));
const WifiSecurityType = lazy(() => import('../../components/WifiSecurityType'));
const SecurityType = lazy(() => import('../../components/SecurityType'));
const Tags = lazy(() => import('../../components/Tags'));
const Notes = lazy(() => import('../../components/Notes'));
const DangerZone = lazy(() => import('../../components/DangerZone'));

function WifiDetailsView (props) {
  const { getMessage } = useI18n();
  const { data } = usePopupState();
  const [inputError, setInputError] = useState(undefined);

  const navigate = useNavigate();

  const validate = values => {
    const errors = {};

    if (!values?.content?.name || values?.content?.name?.length <= 0) {
      errors.name = getMessage('details_name_required');
    } else if (values.content?.name?.length > 255) {
      errors.name = getMessage('details_name_max_length');
    }

    if (values?.content?.ssid && values?.content?.ssid?.length > 255) {
      errors.ssid = getMessage('details_wifi_ssid_max_length');
    }

    if (data.notesEditable) {
      if (values?.content?.notes && values?.content?.notes?.length > 16384) {
        errors.notes = getMessage('details_wifi_notes_max_length');
      }
    }

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
      contentType: Wifi.contentType,
      deviceId: e.deviceId,
      itemId: e.id,
      vaultId: e.vaultId,
      content: {}
    };

    if (props.originalItem?.isT3orT2WithSif) {
      stateData.sifFetched = true;
    }

    if (data.nameEditable) {
      stateData.content.name = e?.content?.name ? e.content.name : '';
    }

    if (data.ssidEditable) {
      stateData.content.ssid = e?.content?.ssid ? e.content.ssid : '';
    }

    if (data.wifiPasswordEditable) {
      stateData.content.s_wifi_password = data.editedSif || '';
    }

    if (data.wifiSecurityTypeEditable) {
      stateData.content.securityType = e?.content?.securityType;
    }

    if (data.hiddenEditable) {
      stateData.content.hidden = e?.content?.hidden;
    }

    if (data.tierEditable) {
      if (props.originalItem?.securityType !== e.securityType) {
        stateData.securityType = e.securityType;
      }
    }

    if (data.tagsEditable) {
      stateData.tags = e.tags || [];
    }

    if (data.notesEditable) {
      stateData.content.notes = e?.content?.notes ? e.content.notes : '';
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
    <QrDialogProvider>
      <Form
        onSubmit={onSubmit}
        initialValues={data.item}
        render={({ handleSubmit, form, submitting }) => (
          <form onSubmit={handleSubmit}>
            <Name
              key={`name-${data.item.id}`}
              formData={{ inputError }}
            />
            <ShowQrCode key={`show-qr-${data.item.id}`} originalItem={props.originalItem} />
            <WifiSsid
              key={`ssid-${data.item.id}`}
              formData={{ inputError }}
            />
            <WifiPassword
              key={`wifi-password-${data.item.id}`}
              formData={{ form, originalItem: props.originalItem }}
              sifDecryptError={data.sifDecryptError}
            />
            <WifiSecurityType key={`wifi-security-type-${data.item.id}`} />
            <SecurityType key={`security-type-${data.item.id}`} />
            <Tags key={`tags-${data.item.id}`} />
            <Notes key={`notes-${data.item.id}`} />
            <div className={S.detailsButton}>
              <button
                type="submit"
                className={`${bS.btn} ${bS.btnTheme} ${bS.btnSimpleAction}`}
                disabled={(getEditableAmount().amount <= 0 || submitting) ? 'disabled' : ''}
              >
                {getMessage('update')}{getEditableAmount().text}
              </button>
            </div>

            <DangerZone
              key={`danger-zone-${data.item.id}`}
              formData={{ submitting }}
            />
          </form>
        )}
      />
      <QrDialog />
    </QrDialogProvider>
  );
}

export default WifiDetailsView;
