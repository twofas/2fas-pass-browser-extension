// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useContext, useMemo, useState } from 'react';

const WSContext = createContext();

/** 
* Function to provide WebSocket context.
* @param {ReactNode} children - The child components.
* @return {JSX.Element} The context provider.
*/
export const WSProvider = ({ children }) => {
  const [wsActive, setWsActive] = useState(false);

  const wsActivate = () => {
    setWsActive(true);
  };

  const wsDeactivate = () => {
    setWsActive(false);
  };

  const value = useMemo(
    () => ({
      wsActive,
      wsActivate,
      wsDeactivate
    }),
    [wsActive]
  );

  return <WSContext.Provider value={value}>{children}</WSContext.Provider>;
};

export const useWS = () => {
  return useContext(WSContext);
};
