// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './ShowQrCode.module.scss';
import { useCallback, useMemo } from 'react';
import Wifi from '@/models/itemModels/Wifi';
import QrIcon from '@/assets/popup-window/qr.svg?react';
import { useQrDialog } from '@/entrypoints/popup/context/QrDialogContext';
import { useI18n } from '@/partials/context/I18nContext';

function ShowQrCode ({ originalItem }) {
  const { getMessage } = useI18n();
  const { showQr } = useQrDialog();

  const itemInstance = useMemo(() => {
    if (!originalItem) {
      return null;
    }

    if (originalItem instanceof Wifi) {
      return originalItem;
    }

    try {
      return new Wifi(originalItem);
    } catch (e) {
      CatchError(e);
      return null;
    }
  }, [originalItem]);

  const handleShowQr = useCallback(() => {
    if (itemInstance) {
      showQr(itemInstance);
    }
  }, [itemInstance, showQr]);

  if (!originalItem?.content?.ssid) {
    return null;
  }

  return (
    <div className={S.showQrCode}>
      <button
        type='button'
        className={S.showQrCodeButton}
        onClick={handleShowQr}
      >
        {getMessage('details_wifi_show_qr')}
        <QrIcon />
      </button>
    </div>
  );
}

export default ShowQrCode;
