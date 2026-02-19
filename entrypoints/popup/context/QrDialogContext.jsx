// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const QrDialogContext = createContext(null);

/**
 * Provider component for managing QR dialog state.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - Child components.
 * @return {JSX.Element} The provider component.
 */
export function QrDialogProvider ({ children }) {
  const [qrItem, setQrItem] = useState(null);

  const showQr = useCallback(item => {
    setQrItem(item);
  }, []);

  const hideQr = useCallback(() => {
    setQrItem(null);
  }, []);

  const value = useMemo(() => ({
    qrItem,
    showQr,
    hideQr
  }), [qrItem, showQr, hideQr]);

  return (
    <QrDialogContext.Provider value={value}>
      {children}
    </QrDialogContext.Provider>
  );
}

const noOp = () => {};
const fallbackContext = {
  qrItem: null,
  showQr: noOp,
  hideQr: noOp
};

/**
 * Hook to access QR dialog context.
 * @return {Object} Context value with qrItem, showQr, hideQr.
 */
export function useQrDialog () {
  const context = useContext(QrDialogContext);
  return context || fallbackContext;
}

export default QrDialogContext;
