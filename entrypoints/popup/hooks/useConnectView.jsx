// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect } from 'react';

// Shared state outside of React components
let sharedConnectView = null;
const subscribers = new Set();

/**
 * Custom hook for managing the Connect component's view state.
 * @returns {Object} Object containing connectView state and setConnectView function
 */
const useConnectView = () => {
  const [connectView, setLocalConnectView] = useState(sharedConnectView);

  useEffect(() => {
    // Subscribe to changes
    const updateLocal = value => {
      setLocalConnectView(value);
    };

    subscribers.add(updateLocal);

    // Sync with current shared state on mount
    if (sharedConnectView !== connectView) {
      setLocalConnectView(sharedConnectView);
    }

    return () => {
      subscribers.delete(updateLocal);
    };
  }, []);

  const setConnectView = value => {
    sharedConnectView = value;
    // Notify all subscribers
    subscribers.forEach(subscriber => subscriber(value));
  };

  return {
    connectView,
    setConnectView
  };
};

export default useConnectView;