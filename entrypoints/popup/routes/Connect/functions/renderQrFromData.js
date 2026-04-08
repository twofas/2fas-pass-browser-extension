// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

const renderQrFromData = async qrData => {
  if (!qrData) {
    return null;
  }

  try {
    const { default: qrcode } = await import('qrcode');

    return await qrcode.toDataURL(qrData, {
      type: 'image/jpeg',
      errorCorrectionLevel: 'L',
      quality: 1,
      width: 750
    });
  } catch {
    return null;
  }
};

export default renderQrFromData;
