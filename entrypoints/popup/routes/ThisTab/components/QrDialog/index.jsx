// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from './QrDialog.module.scss';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/partials/context/I18nContext';
import { useQrDialog } from '../../context/QrDialogContext';
import CloseIcon from '@/assets/popup-window/cancel.svg?react';

/**
* QR code dialog for WiFi networks.
* Renders a single shared dialog — hidden by default, shown when qrItem is set.
* @return {JSX.Element} The rendered component.
*/
function QrDialog () {
  const { getMessage } = useI18n();
  const { qrItem, hideQr } = useQrDialog();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const itemIdRef = useRef(null);

  const generateQrCode = useCallback(async item => {
    setQrDataUrl(null);

    try {
      const wifiUri = await item.generateWifiUri();
      const { default: qrcode } = await import('qrcode');
      const dataUrl = await qrcode.toDataURL(wifiUri, {
        type: 'image/png',
        errorCorrectionLevel: 'M',
        margin: 0,
        width: 484
      });

      setQrDataUrl(dataUrl);
    } catch (e) {
      await CatchError(e);
      hideQr();
    }

  }, [hideQr]);

  useEffect(() => {
    if (qrItem && qrItem.id !== itemIdRef.current) {
      itemIdRef.current = qrItem.id;
      generateQrCode(qrItem);
    }

    if (!qrItem) {
      itemIdRef.current = null;
      setQrDataUrl(null);
    }
  }, [qrItem, generateQrCode]);

  const handleBackdropClick = useCallback(() => {
    hideQr();
  }, [hideQr]);

  const handleCloseClick = useCallback(() => {
    hideQr();
  }, [hideQr]);

  const isOpen = !!qrItem;

  return (
    <div className={`${S.qrDialog} ${isOpen ? S.open : ''}`}>
      <div className={S.qrDialogBackdrop} onClick={handleBackdropClick} />
      <div className={S.qrDialogBox}>
        <button
          className={S.qrDialogClose}
          onClick={handleCloseClick}
          type='button'
        >
          <CloseIcon />
        </button>

        <div className={S.qrDialogTitle}>
          <span>{getMessage('this_tab_qr_dialog_title')}</span>
          <span>&ldquo;{qrItem?.content?.ssid}&rdquo;</span>
        </div>

        <div className={S.qrDialogQrContainer}>
          <img
            src={qrDataUrl || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}
            alt={qrItem?.content?.ssid || ''}
          />
        </div>
      </div>
    </div>
  );
}

export default QrDialog;
