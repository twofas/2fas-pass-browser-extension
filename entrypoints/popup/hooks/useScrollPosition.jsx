// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import usePopupState from '../store/popupState/usePopupState';

/**
 * Custom hook for managing scroll position.
 * Stores scroll position in zustand store scoped by pathname.
 * @param {React.RefObject} scrollableRef - Reference to the scrollable element
 * @param {boolean} loading - Loading state to determine when to restore scroll position
 * @return {Object} Object containing saveScrollPosition, restoreScrollPosition and scrollPosition
 */
const useScrollPosition = (scrollableRef, loading = false) => {
  const { pathname, scrollPosition, setScrollPosition } = usePopupState();
  const hasRestoredRef = useRef(false);
  const isRestoringRef = useRef(false);
  const targetScrollPositionRef = useRef(null);

  const saveScrollPosition = useCallback(() => {
    if (!scrollableRef?.current) {
      return;
    }

    if (isRestoringRef.current) {
      return;
    }

    const scrollTop = scrollableRef.current.scrollTop;
    setScrollPosition(scrollTop);
  }, [setScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    const targetPosition = targetScrollPositionRef.current;

    if (!scrollableRef?.current || targetPosition === undefined || targetPosition === null) {
      return;
    }

    scrollableRef.current.scrollTo({
      top: targetPosition,
      left: 0,
      behavior: 'instant'
    });
  }, []);

  useEffect(() => {
    const scrollElement = scrollableRef?.current;

    if (!scrollElement) {
      return;
    }

    let scrollTimeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [saveScrollPosition, loading]);

  useEffect(() => {
    const shouldRestore = !loading && !hasRestoredRef.current && scrollableRef?.current && scrollPosition !== undefined;

    if (shouldRestore) {
      isRestoringRef.current = true;
      targetScrollPositionRef.current = scrollPosition;

      requestAnimationFrame(() => {
        restoreScrollPosition();

        requestAnimationFrame(() => {
          const currentScroll = scrollableRef.current?.scrollTop;
          const targetScroll = targetScrollPositionRef.current;

          if (currentScroll !== targetScroll && targetScroll !== null) {
            restoreScrollPosition();
          }

          hasRestoredRef.current = true;

          setTimeout(() => {
            const finalScroll = scrollableRef.current?.scrollTop;
            const finalTarget = targetScrollPositionRef.current;

            if (finalScroll !== finalTarget && finalTarget !== null) {
              restoreScrollPosition();
            }

            setTimeout(() => {
              isRestoringRef.current = false;
              targetScrollPositionRef.current = null;
            }, 200);
          }, 100);
        });
      });
    }
  }, [loading, scrollPosition, restoreScrollPosition]);

  useEffect(() => {
    hasRestoredRef.current = false;
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (scrollableRef?.current && !isRestoringRef.current) {
        const scrollTop = scrollableRef.current.scrollTop;

        if (scrollTop > 0) {
          setScrollPosition(scrollTop);
        }
      }
    };
  }, [setScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollPosition,
    scrollableRef
  };
};

export default useScrollPosition;
