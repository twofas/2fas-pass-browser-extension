// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import usePopupStateStore from '../store/popupState';

/**
 * Custom hook for managing scroll position.
 * Stores scroll position in zustand store and restores it when component mounts.
 * @param {React.RefObject} scrollableRef - Reference to the scrollable element
 * @param {boolean} loading - Loading state to determine when to restore scroll position
 * @return {Object} Object containing saveScrollPosition, restoreScrollPosition and scrollPosition
 */
const useScrollPosition = (scrollableRef, loading = false) => {
  const scrollPosition = usePopupStateStore(state => state.scrollPosition);
  const setScrollPosition = usePopupStateStore(state => state.setScrollPosition);
  const hasRestoredRef = useRef(false);

  const saveScrollPosition = useCallback(() => {
    if (!scrollableRef?.current) {
      return;
    }

    const scrollTop = scrollableRef.current.scrollTop;
    setScrollPosition(scrollTop);
  }, [scrollableRef, setScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (!scrollableRef?.current || scrollPosition === undefined) {
      return;
    }

    if (scrollPosition !== undefined && scrollPosition > 0) {
      scrollableRef.current.scrollTo({
        top: scrollPosition,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [scrollableRef, scrollPosition]);

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
  }, [scrollableRef, saveScrollPosition]);

  useEffect(() => {
    if (!loading && !hasRestoredRef.current && scrollableRef?.current && scrollPosition !== undefined) {
      requestAnimationFrame(() => {
        restoreScrollPosition();
        hasRestoredRef.current = true;
      });
    }
  }, [loading, scrollableRef, scrollPosition, restoreScrollPosition]);

  useEffect(() => {
    return () => {
      if (scrollableRef?.current) {
        const scrollTop = scrollableRef.current.scrollTop;

        if (scrollTop > 0) {
          // Save the scroll position when component unmounts
          setScrollPosition(scrollTop);
        }
      }
    };
  }, [scrollableRef, setScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollPosition
  };
};

export default useScrollPosition;
