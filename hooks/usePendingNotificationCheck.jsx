// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import showPendingNotification from '@/partials/TwofasNotification/functions/showPendingNotification';

/**
* Hook that surfaces a notification persisted by storeNotificationFallback when the popup
* opens. Used so notifications that could not reach the in-page push channel (Safari has no
* native notifications API) are still shown to the user. Mirrors useAutofillFailedCheck.
* @return {void}
*/
const usePendingNotificationCheck = () => {
  const checkedRef = useRef(false);

  const checkPendingNotification = useCallback(async () => {
    if (checkedRef.current) {
      return;
    }

    checkedRef.current = true;

    await showPendingNotification();
  }, []);

  useEffect(function checkPendingNotificationOnMount() {
    checkPendingNotification();
  }, [checkPendingNotification]);
};

export default usePendingNotificationCheck;
