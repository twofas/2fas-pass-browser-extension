// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import usePopupStateStore from '../store/popupState';

const defaultData = {
  '/password-generator': {
    characters: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSpecialChars: true
  }
};

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
  const setHref = usePopupStateStore(state => state.setHref);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const lastPathnameRef = useRef(null);
  const changeCountRef = useRef(0);

  useEffect(() => {
    if (!hydrationComplete) {
      return;
    }

    const pathname = location.pathname;
    const excludedPaths = ['/fetch', '/blocked'];
    const isExcluded = excludedPaths.includes(pathname) || pathname.startsWith('/fetch/');

    if (isExcluded) {
      setHref('/');
      setScrollPosition(0);

      const defaultDataForPath = defaultData['/'] || {};

      usePopupStateStore.setState({
        data: {
          ...defaultDataForPath
        }
      });

      return;
    }

    if (pathname !== lastPathnameRef.current) {
      changeCountRef.current += 1;

      const isReturningFromFetch = location?.state?.from === 'fetch';
      const isUserNavigation = changeCountRef.current > 2 && !isReturningFromFetch;

      lastPathnameRef.current = pathname;
      setHref(pathname);

      if (isUserNavigation) {
        setScrollPosition(0);

        const defaultDataForPath = defaultData[pathname] || {};

        usePopupStateStore.setState({
          data: {
            ...defaultDataForPath
          }
        });
      }
    }
  }, [location.pathname, location.state, setHref, setScrollPosition, hydrationComplete]);

  return location.pathname;
};

export default usePopupHref;