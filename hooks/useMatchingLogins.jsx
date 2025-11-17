// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useState, useEffect, useCallback } from 'react';

let matchingLoginsLengthState = null;
const subscribers = new Set();

const notifySubscribers = value => {
  matchingLoginsLengthState = value;
  subscribers.forEach(callback => callback(value));
};

/**
* Custom hook for managing matching logins length across components.
* Uses a shared state pattern with subscribers to synchronize state between components.
* @return {Object} Object containing matchingLoginsLength and changeMatchingLoginsLength function.
*/
export const useMatchingLogins = () => {
  const [matchingLoginsLength, setMatchingLoginsLength] = useState(matchingLoginsLengthState);

  const changeMatchingLoginsLength = useCallback(value => {
    notifySubscribers(value);
  }, []);

  useEffect(() => {
    const updateState = newValue => {
      setMatchingLoginsLength(newValue);
    };

    subscribers.add(updateState);

    if (matchingLoginsLengthState !== null) {
      setMatchingLoginsLength(matchingLoginsLengthState);
    }

    return () => {
      subscribers.delete(updateState);
    };
  }, []);

  return {
    matchingLoginsLength,
    changeMatchingLoginsLength
  };
};
