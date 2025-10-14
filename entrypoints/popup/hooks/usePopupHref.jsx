// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import usePopupStateStore from '../store/popupState';

/**
 * Custom hook for tracking and storing current pathname in popup state.
 * Automatically updates the href in the store when the location changes.
 * Resets data and scrollPosition when navigating to a different route.
 * Excludes specific routes from tracking: /fetch, /fetch/*, /connect, /blocked
 * @return {string} Current pathname from the location
 */
const usePopupHref = () => {
  const location = useLocation();
  const setHref = usePopupStateStore(state => state.setHref);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const lastPathnameRef = useRef(null);
  const changeCountRef = useRef(0);

  useEffect(() => {
    const pathname = location.pathname;

    const excludedPaths = ['/fetch', '/blocked'];
    const isExcluded = excludedPaths.includes(pathname) || pathname.startsWith('/fetch/');

    if (isExcluded) {
      setHref('/');
      return;
    }

    if (pathname !== lastPathnameRef.current) {
      changeCountRef.current += 1;

      const shouldResetData = changeCountRef.current > 2;

      lastPathnameRef.current = pathname;
      setHref(pathname);

      if (shouldResetData) {
        setScrollPosition(0);
        usePopupStateStore.setState({ data: {} });
      }
    }
  }, [location.pathname, setHref, setScrollPosition]);

  return location.pathname;
};

export default usePopupHref;