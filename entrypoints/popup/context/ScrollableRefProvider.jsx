// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { createContext, useRef } from 'react';

/**
 * Context for storing and sharing the scrollable ref from the active route.
 * This allows the TopBar to scroll to the top of the scrollable container.
 */
export const ScrollableRefContext = createContext(null);

/**
 * Provider component that manages the scrollable ref for the entire app.
 * @param {Object} props - The component props
 * @param {React.ReactNode} props.children - Child components
 * @return {JSX.Element} The provider wrapper
 */
export const ScrollableRefProvider = ({ children }) => {
  const scrollableRef = useRef(null);

  const value = {
    ref: scrollableRef,
    setRef: domElement => {
      scrollableRef.current = domElement;
    }
  };

  return (
    <ScrollableRefContext.Provider value={value}>
      {children}
    </ScrollableRefContext.Provider>
  );
};
