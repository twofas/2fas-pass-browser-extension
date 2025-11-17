// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect } from 'react';
import TwoFasWebSocket from '@/partials/WebSocket';

// Global state
let wsActiveState = false;

/**
* Hook to manage WebSocket active state globally.
* Automatically syncs with TwoFasWebSocket instance state.
* @return {Object} Object containing wsActive state.
*/
export const useWS = () => {
  const [wsActive, setWsActive] = useState(wsActiveState);

  useEffect(() => {
    const handleStateChange = isActive => {
      wsActiveState = isActive;
      setWsActive(isActive);
    };

    // Register listener with TwoFasWebSocket
    TwoFasWebSocket.addStateListener(handleStateChange);

    // Check if WebSocket is already active
    try {
      const instance = TwoFasWebSocket.getInstance();

      if (instance && instance.socket && instance.socket.readyState === WebSocket.OPEN) {
        wsActiveState = true;
        setWsActive(true);
      }
    } catch {
      // No instance exists, state remains false
    }

    return () => {
      TwoFasWebSocket.removeStateListener(handleStateChange);
    };
  }, []);


  return {
    wsActive
  };
};
