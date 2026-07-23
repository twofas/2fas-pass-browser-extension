// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect } from 'react';

const WS_LIVENESS_POLL_MS = 10000;

// Auxiliary liveness leg for session views (PushSent, Fetch). Every WS_GET_STATE poll wakes
// the background SW, which resumes/enforces the WS session and returns pendingUpdates.toasts
// that are consumed on read — so they must be shown here or they are lost. View switching
// itself still arrives via the existing WS_STATE_UPDATE -> bgState pipeline; this hook never
// touches the view.
export const useWsLiveness = enabled => {
  useEffect(function pollWsLiveness () {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await browser.runtime.sendMessage({
          action: REQUEST_ACTIONS.WS_GET_STATE,
          target: REQUEST_TARGETS.BACKGROUND_WS
        });

        if (cancelled) {
          return;
        }

        if (response?.pendingUpdates?.toasts?.length > 0) {
          response.pendingUpdates.toasts.forEach(toast => {
            if (toast.toastId) {
              showToast(toast.message, toast.type, toast.autoClose !== false, { toastId: toast.toastId });
            } else {
              showToast(toast.message, toast.type, toast.autoClose !== false);
            }
          });
        }
      } catch {}
    };

    poll();
    const intervalId = setInterval(poll, WS_LIVENESS_POLL_MS);

    return function stopWsLivenessPoll () {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [enabled]);
};
