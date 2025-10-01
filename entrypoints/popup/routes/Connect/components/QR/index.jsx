// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import S from '../../Connect.module.scss';
import { useMemo, memo } from 'react';

/**
* QR code display component.
* @param {Object} props - Component props.
* @param {string} props.qrCode - The QR code data URL to display.
* @return {JSX.Element} The rendered QR component.
*/
function QR (props) {
  const isLoading = !props.qrCode;

  const displaySrc = useMemo(() => {
    if (props.qrCode) {
      return props.qrCode;
    }

    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 197 197"%3E%3Crect width="197" height="197" fill="%23ffffff"/%3E%3C/svg%3E';
  }, [props.qrCode]);

  return (
    <img src={displaySrc} className={`${isLoading ? S.loading : ''}`} alt="QR Code" />
  );
}

export default memo(QR);
