// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';

export const useBackgroundWS = ({ onLogin } = {}) => {
  const [wsState, setWsState] = useState(() => window.__wsInitialState || null);
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  const onLoginRef = useRef(onLogin);
  navigateRef.current = navigate;
  onLoginRef.current = onLogin;

  const processToast = useCallback(toast => {
    if (toast.toastId) {
      showToast(toast.message, toast.type, toast.autoClose !== false, { toastId: toast.toastId });
    } else {
      showToast(toast.message, toast.type, toast.autoClose !== false);
    }
  }, []);

  useEffect(() => {
    const initialState = window.__wsInitialState;
    const pendingUpdates = window.__wsPendingUpdates;

    window.__wsInitialState = null;
    window.__wsPendingUpdates = null;

    if (initialState) {
      setWsState(initialState);
    }

    if (pendingUpdates?.toasts?.length > 0) {
      pendingUpdates.toasts.forEach(processToast);
    }

    if (pendingUpdates?.navigation) {
      navigateRef.current(pendingUpdates.navigation.path, pendingUpdates.navigation.options);
    }

    if (!initialState) {
      browser.runtime.sendMessage({
        action: REQUEST_ACTIONS.WS_GET_STATE,
        target: REQUEST_TARGETS.BACKGROUND_WS
      }).then(response => {
        if (response?.state) {
          setWsState(response.state);
        }

        if (response?.pendingUpdates?.toasts?.length > 0) {
          response.pendingUpdates.toasts.forEach(processToast);
        }

        if (response?.pendingUpdates?.navigation) {
          navigateRef.current(response.pendingUpdates.navigation.path, response.pendingUpdates.navigation.options);
        }
      }).catch(() => {});
    }

    const handler = message => {
      if (message.action !== REQUEST_ACTIONS.WS_STATE_UPDATE) {
        return;
      }

      switch (message.updateType) {
        case 'stateChange': {
          setWsState(prev => ({ ...prev, ...message.payload }));
          break;
        }

        case 'toast': {
          processToast(message.payload);
          break;
        }

        case 'navigate': {
          navigateRef.current(message.payload.path, message.payload.options);
          break;
        }

        case 'login': {
          if (onLoginRef.current) {
            onLoginRef.current();
          } else {
            navigateRef.current('/');
          }

          break;
        }
      }
    };

    browser.runtime.onMessage.addListener(handler);

    return () => {
      browser.runtime.onMessage.removeListener(handler);
    };
  }, [processToast]);

  const sendCommand = useCallback(async (action, data = {}) => {
    try {
      return await browser.runtime.sendMessage({
        action,
        target: REQUEST_TARGETS.BACKGROUND_WS,
        ...data
      });
    } catch (e) {
      await CatchError(e);
      return { status: 'error', message: e.message };
    }
  }, []);

  return {
    wsState,
    wsActive: wsState?.active ?? false,
    sendCommand
  };
};
