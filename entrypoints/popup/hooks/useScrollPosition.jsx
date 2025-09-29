// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import usePopupStateStore from '../store/popupState';

/**
 * Custom hook for managing scroll position of components.
 * Stores scroll position in zustand store and restores it when component mounts.
 * @param {string} componentName - Name of the component (must match store keys: thisTab, details, addNew, etc.)
 * @param {React.RefObject} scrollableRef - Reference to the scrollable element
 * @param {boolean} loading - Loading state to determine when to restore scroll position
 * @return {Object} Object containing saveScrollPosition and restoreScrollPosition functions
 */
const useScrollPosition = (componentName, scrollableRef, loading = false) => {
  const popupState = usePopupStateStore(state => state[componentName]);
  const setPopupState = usePopupStateStore(state => state[`set${componentName.charAt(0).toUpperCase()}${componentName.slice(1)}`]);
  const hasRestoredRef = useRef(false);

  const saveScrollPosition = useCallback(() => {
    if (!scrollableRef?.current) {
      return;
    }

    const scrollTop = scrollableRef.current.scrollTop;

    if (setPopupState) {
      setPopupState('scrollPosition', scrollTop);
    }
  }, [scrollableRef, setPopupState]);

  const restoreScrollPosition = useCallback(() => {
    if (!scrollableRef?.current || popupState?.scrollPosition === undefined) {
      return;
    }

    const scrollTop = popupState.scrollPosition;

    if (scrollTop !== undefined) {
      scrollableRef.current.scrollTo({
        top: scrollTop,
        left: 0,
        behavior: 'instant'
      });
    }
  }, [scrollableRef, popupState?.scrollPosition]);

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
    if (!loading && !hasRestoredRef.current && scrollableRef?.current && popupState?.scrollPosition !== undefined) {
      requestAnimationFrame(() => {
        restoreScrollPosition();
        hasRestoredRef.current = true;
      });
    }
  }, [loading, scrollableRef, popupState?.scrollPosition, restoreScrollPosition]);

  useEffect(() => {
    return () => {
      if (scrollableRef?.current) {
        const scrollTop = scrollableRef.current.scrollTop;

        if (setPopupState && scrollTop > 0) {
          setPopupState('scrollPosition', scrollTop);
        }
      }
    };
  }, [scrollableRef, setPopupState]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollPosition: popupState?.scrollPosition
  };
};

export default useScrollPosition;
