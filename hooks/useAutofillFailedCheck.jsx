// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';

/**
* Hook to check for pending autofill failure data when popup opens.
* If found, navigates with autofillT2Failed state to trigger KeepItem display.
* @return {void}
*/
const useAutofillFailedCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkedRef = useRef(false);

  const checkPendingFailure = useCallback(async () => {
    if (checkedRef.current) {
      return;
    }

    if (location.pathname !== '/') {
      return;
    }

    if (location?.state?.action === 'autofillT2Failed' || location?.state?.action === 'autofillCardT2Failed') {
      checkedRef.current = true;
      return;
    }

    checkedRef.current = true;

    let tabId;

    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      tabId = tabs[0]?.id;
    } catch {
      return;
    }

    if (!tabId) {
      return;
    }

    const failureKey = `session:autofillT2FailedPending-${tabId}`;
    let failureDataJson;

    try {
      failureDataJson = await storage.getItem(failureKey);
    } catch {
      return;
    }

    if (!failureDataJson) {
      return;
    }

    try {
      await storage.removeItem(failureKey);
    } catch { }

    let failureData;

    try {
      failureData = JSON.parse(failureDataJson);
    } catch {
      return;
    }

    if (!failureData || failureData.action !== 'autofillT2Failed') {
      return;
    }

    navigate('/', {
      state: {
        action: failureData.action,
        vaultId: failureData.vaultId,
        deviceId: failureData.deviceId,
        itemId: failureData.itemId,
        s_password: failureData.s_password,
        hkdfSaltAB: failureData.hkdfSaltAB,
        sessionKeyForHKDF: failureData.sessionKeyForHKDF
      },
      replace: true
    });
  }, [navigate, location.pathname, location?.state?.action]);

  useEffect(() => {
    checkPendingFailure();
  }, [checkPendingFailure]);
};

export default useAutofillFailedCheck;
