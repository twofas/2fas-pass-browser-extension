// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect } from 'react';

export const useWS = () => {
  const [wsActive, setWsActive] = useState(false);
  const [connectView, setConnectView] = useState(null);

  useEffect(() => {
    browser.runtime.sendMessage({
      action: REQUEST_ACTIONS.WS_GET_STATE,
      target: REQUEST_TARGETS.BACKGROUND_WS
    }).then(response => {
      setWsActive(response?.state?.active ?? false);
      setConnectView(response?.state?.connectView ?? null);
    }).catch(() => {});

    const handler = message => {
      if (message.action === REQUEST_ACTIONS.WS_STATE_UPDATE && message.updateType === 'stateChange') {
        if ('active' in message.payload) {
          setWsActive(message.payload.active);
        }

        if ('connectView' in message.payload) {
          setConnectView(message.payload.connectView);
        }
      }
    };

    browser.runtime.onMessage.addListener(handler);

    return () => {
      browser.runtime.onMessage.removeListener(handler);
    };
  }, []);

  return { wsActive, connectView };
};
