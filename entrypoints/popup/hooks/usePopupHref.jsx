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
 * Resets data to defaults and scrollPosition to 0 on every route change after hydration.
 * Excludes specific routes from tracking: /fetch, /fetch/*, /blocked
 * @param {boolean} hydrationComplete - Whether Zustand hydration is complete
 * @return {string} Current pathname from the location
 */
const usePopupHref = (hydrationComplete = false) => {
  const location = useLocation();
  const hrefArray = usePopupStateStore(state => state.href);
  const setHref = usePopupStateStore(state => state.setHref);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const lastPathnameRef = useRef(null);
  const changeCountRef = useRef(0);
  const initialHrefLengthRef = useRef(null);

  useEffect(() => {
    if (!hydrationComplete) {
      return;
    }

    if (initialHrefLengthRef.current === null) {
      initialHrefLengthRef.current = hrefArray.length;
    }

    const pathname = location.pathname;
    const excludedPaths = ['/fetch', '/blocked'];
    const isExcluded = excludedPaths.includes(pathname) || pathname.startsWith('/fetch/');

    if (isExcluded) {
      setScrollPosition(pathname, 0);
      return;
    }

    if (pathname !== lastPathnameRef.current) {
      changeCountRef.current += 1;

      const isReturningFromFetch = location?.state?.from === 'fetch';
      const isBackNavigation = location?.state?.isBackNavigation === true;
      const isUserNavigation = changeCountRef.current > 2 && !isReturningFromFetch;
      const isInitialRootLoad = pathname === '/' && changeCountRef.current === 1 && initialHrefLengthRef.current > 0;

      lastPathnameRef.current = pathname;

      if (!isBackNavigation && !isInitialRootLoad) {
        setHref(pathname);
      }

      if (isUserNavigation) {
        setScrollPosition(pathname, 0);
      }
    }
  }, [location.pathname, location.state, hrefArray.length, setHref, setScrollPosition, hydrationComplete]);

  return location.pathname;
};

export default usePopupHref;