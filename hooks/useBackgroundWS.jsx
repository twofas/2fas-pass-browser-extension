// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import usePopupStateStore from '@/entrypoints/popup/store/popupState';

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

  useEffect(function subscribeToBackgroundWsState() {
    const initialState = window.__wsInitialState;
    window.__wsInitialState = null;

    if (initialState) {
      setWsState(initialState);
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
          logger.debug(LOGGER_CONSTANTS.CATEGORIES.WS, 'Popup-WS - toast', { type: message.payload?.type });
          processToast(message.payload);
          break;
        }

        case 'navigate': {
          logger.info(LOGGER_CONSTANTS.CATEGORIES.WS, 'Popup-WS - background navigate', {
            path: message.payload?.path,
            resetStore: !!message.payload?.resetStore
          });

          if (message.payload.resetStore) {
            const store = usePopupStateStore.getState();
            store.clearAllData();
            store.clearHref();
          }

          navigateRef.current(message.payload.path, message.payload.options);
          break;
        }

        case 'login': {
          logger.info(LOGGER_CONSTANTS.CATEGORIES.AUTH, 'Popup-WS - login signal from background');
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

    return function unsubscribeFromBackgroundWsState() {
      browser.runtime.onMessage.removeListener(handler);
    };
  }, [processToast]);

  const sendCommand = useCallback(async (action, data = {}) => {
    try {
      logger.debug(LOGGER_CONSTANTS.CATEGORIES.WS, 'Popup-WS - sendCommand', {
        action,
        fetchAction: data?.fetchAction,
        from: data?.from
      });

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
