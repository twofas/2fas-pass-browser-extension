// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import usePopupStateStore from '../store/popupState';

/**
 * Custom hook for tracking and storing current pathname in popup state.
 * Automatically updates the href in the store when the location changes.
 * Resets data and scrollPosition when navigating to a different route.
 * @return {string} Current pathname from the location
 */
const useHref = () => {
  const location = useLocation();
  const setHref = usePopupStateStore(state => state.setHref);
  const setData = usePopupStateStore(state => state.setData);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const href = usePopupStateStore(state => state.href);

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname !== href) {
      setHref(pathname);
      setScrollPosition(0);

      usePopupStateStore.setState({ data: {} });
    }
  }, [location.pathname, setHref, setData, setScrollPosition, href]);

  return location.pathname;
};

export default useHref;