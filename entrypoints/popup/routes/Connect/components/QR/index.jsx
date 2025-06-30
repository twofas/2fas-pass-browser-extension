// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Connect.module.scss';
import { useState, useEffect } from 'react';
import qrcode from 'qrcode';

/** 
* Function to generate a QR code.
* @param {string} ephemeralPublicKey - The ephemeral public key.
* @param {string} sessionID - The session ID.
* @param {string} signature - The signature.
* @return {Promise<string>} A promise that resolves to the generated QR code.
*/
function QR (props) {
  const [qrTextIndex, setQrText] = useState(-1);
  const [qrCode, setQrCode] = useState();
  const [qrLoading, setQrLoading] = useState(true);

  let qrAnimationInterval = null;

  const QRLoadingAnimation = async () => {
    if (props.qrCode && props.qrCode.length > 0) {
      return;
    }

    let qrTextI;
    const qrTexts = [
      browser.i18n.getMessage('connect_qr_placeholder_1'),
      browser.i18n.getMessage('connect_qr_placeholder_2'),
      browser.i18n.getMessage('connect_qr_placeholder_3')
    ];

    do {
      qrTextI = Math.floor(Math.random() * qrTexts.length);
    } while (qrTextI === qrTextIndex);

    const qrText = qrTexts[qrTextI].toLowerCase().replace(/ /g, '');
    const qrCode = await qrcode.toDataURL(qrText, { type: 'image/jpeg', errorCorrectionLevel: 'h', quality: 0.5, width: 197, margin: 0 });

    setQrText(qrTextI);
    setQrCode(qrCode);
  };

  useEffect(() => {
    if (props?.qrCode && props?.qrCode.length > 0) {
      clearInterval(qrAnimationInterval);
      setQrCode(props.qrCode);
      setQrLoading(false);
    }

    qrAnimationInterval = setInterval(async () => {
      await QRLoadingAnimation();
    }, 1000);

    return () => {
      clearInterval(qrAnimationInterval);
    };
  }, [props.qrCode]);

  return (
    <img src={qrCode} className={`${qrLoading ? S.loading : ''}`} />
  );
}

export default QR;
