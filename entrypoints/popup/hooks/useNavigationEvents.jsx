// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import usePopupStateStore from '../store/popupState';

const IGNORED_PATHS = ['/password-generator'];

/**
 * Hook to handle browser back/forward navigation events.
 * Handles mouse back button clicks and touchpad swipe gestures.
 * Uses the same logic as NavigationButton for path resolution.
 * @return {void}
 */
const useNavigationEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hrefArray = usePopupStateStore(s => s.href);
  const popHref = usePopupStateStore(s => s.popHref);
  const setHref = usePopupStateStore(s => s.setHref);

  const isHandlingNavigation = useRef(false);
  const lastKnownPathRef = useRef(location.pathname);

  const navigateRef = useRef(navigate);
  const hrefArrayRef = useRef(hrefArray);
  const popHrefRef = useRef(popHref);
  const setHrefRef = useRef(setHref);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    hrefArrayRef.current = hrefArray;
  }, [hrefArray]);

  useEffect(() => {
    popHrefRef.current = popHref;
  }, [popHref]);

  useEffect(() => {
    setHrefRef.current = setHref;
  }, [setHref]);

  const findPreviousValidPath = useCallback((fromPath, hrefList, currentPath) => {
    const fromIndex = hrefList.lastIndexOf(fromPath);

    if (fromIndex === -1) {
      return { previousPath: '/', popCount: 1 };
    }

    let prevPath = null;
    let popCount = 1;

    for (let i = fromIndex - 1; i >= 0; i--) {
      const pathAtIndex = hrefList[i];

      if (pathAtIndex === fromPath || pathAtIndex === currentPath) {
        popCount++;
        continue;
      }

      if (IGNORED_PATHS.includes(pathAtIndex)) {
        popCount++;
        continue;
      }

      prevPath = pathAtIndex;
      popCount = fromIndex - i;
      break;
    }

    if (!prevPath) {
      const segments = fromPath.split('/').filter(s => s);

      if (segments.length > 0) {
        segments.pop();
        prevPath = '/' + segments.join('/') + (segments.length > 0 ? '/' : '');
      } else {
        prevPath = '/';
      }
    }

    return { previousPath: prevPath, popCount };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (isHandlingNavigation.current) {
        return;
      }

      const targetPath = (window.location.hash.replace('#', '') || '/');
      const previousPath = lastKnownPathRef.current;

      if (targetPath === previousPath) {
        return;
      }

      isHandlingNavigation.current = true;

      const currentHrefArray = hrefArrayRef.current;
      const previousIndex = currentHrefArray.lastIndexOf(previousPath);

      let isBackNavigation = false;

      if (previousIndex === -1) {
        isBackNavigation = currentHrefArray.includes(targetPath);
      } else {
        for (let i = previousIndex - 1; i >= 0; i--) {
          if (currentHrefArray[i] === targetPath) {
            isBackNavigation = true;
            break;
          }
        }
      }

      if (isBackNavigation) {
        if (IGNORED_PATHS.includes(targetPath)) {
          const { previousPath: validPath, popCount } = findPreviousValidPath(targetPath, currentHrefArray, previousPath);

          for (let i = 0; i < popCount; i++) {
            popHrefRef.current();
          }

          lastKnownPathRef.current = validPath;
          navigateRef.current(validPath, { state: { isBackNavigation: true }, replace: true });
        } else {
          popHrefRef.current();
          lastKnownPathRef.current = targetPath;
          navigateRef.current(targetPath, { state: { isBackNavigation: true }, replace: true });
        }
      } else {
        if (IGNORED_PATHS.includes(targetPath)) {
          navigateRef.current(previousPath, { replace: true });
        } else {
          lastKnownPathRef.current = targetPath;
          setHrefRef.current(targetPath);
        }
      }

      requestAnimationFrame(() => {
        isHandlingNavigation.current = false;
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [findPreviousValidPath]);

  useEffect(() => {
    if (!isHandlingNavigation.current && !IGNORED_PATHS.includes(location.pathname)) {
      lastKnownPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isSafari) {
      return;
    }

    const handleWheel = e => {
      const isAtLeftEdge = window.scrollX <= 0;
      const isAtRightEdge = window.scrollX >= document.documentElement.scrollWidth - window.innerWidth;
      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY);

      if (isHorizontalScroll && ((e.deltaX < 0 && isAtLeftEdge) || (e.deltaX > 0 && isAtRightEdge))) {
        e.preventDefault();
      }
    };

    const handleTouchStart = e => {
      if (e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      const edgeThreshold = 30;

      if (touch.pageX < edgeThreshold || touch.pageX > window.innerWidth - edgeThreshold) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
};

export default useNavigationEvents;
