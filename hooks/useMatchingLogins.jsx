// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useState } from 'react';

const MatchingLoginsContext = createContext();

/** 
* Function to provide matching logins context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const MatchingLoginsProvider = ({ children }) => {
  const [matchingLoginsLength, setMatchingLoginsLength] = useState(null);

  const changeMatchingLoginsLength = value => {
    setMatchingLoginsLength(value);
  };

  const value = useMemo(
    () => ({
      matchingLoginsLength,
      changeMatchingLoginsLength
    }),
    [matchingLoginsLength]
  );

  return <MatchingLoginsContext.Provider value={value}>{children}</MatchingLoginsContext.Provider>;
};

export const useMatchingLogins = () => {
  return useContext(MatchingLoginsContext);
};
