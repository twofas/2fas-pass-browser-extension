// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useEffect, useRef, useCallback } from 'react';
import usePopupState from '../store/popupState/usePopupState';

/**
 * Walks up the DOM (including the element itself) collecting every ancestor
 * whose computed overflowY is auto or scroll. Returns an array of candidate
 * scroll containers ordered from innermost to outermost. Safari's flex layout
 * sometimes makes the parent the actual scroll container instead of the inner
 * div, so we have to operate on every candidate rather than trust a single ref.
 * @param {HTMLElement} refEl - Starting element.
 * @return {HTMLElement[]} Candidate scroll elements.
 */
const collectScrollCandidates = refEl => {
  const candidates = [];

  if (!refEl) {
    return candidates;
  }

  candidates.push(refEl);

  let element = refEl.parentElement;

  while (element && element !== document.documentElement) {
    const { overflowY } = window.getComputedStyle(element);

    if (overflowY === 'auto' || overflowY === 'scroll') {
      candidates.push(element);
    }

    element = element.parentElement;
  }

  return candidates;
};

/**
 * Custom hook for managing scroll position.
 * Stores scroll position in zustand store scoped by pathname.
 * Probes all candidate scroll containers so it works in Safari, where flex
 * layout quirks can move the actual scroll container off the ref element.
 * Persists during scrolling (debounced) so the store stays current — closing
 * the popup is not a reliable trigger for the async storage write.
 * @param {React.RefObject} scrollableRef - Reference to the scrollable element
 * @param {boolean} loading - Loading state to determine when to restore scroll position
 * @return {Object} Object containing saveScrollPosition, restoreScrollPosition and scrollPosition
 */
const useScrollPosition = (scrollableRef, loading = false) => {
  const { pathname, scrollPosition, setScrollPosition } = usePopupState();
  const hasRestoredRef = useRef(false);
  const isRestoringRef = useRef(false);
  const targetScrollPositionRef = useRef(null);
  const lastScrollTopRef = useRef(0);

  const readScrollTop = useCallback(() => {
    const candidates = collectScrollCandidates(scrollableRef?.current);

    let maxScrollTop = 0;

    for (const el of candidates) {
      if (el.scrollTop > maxScrollTop) {
        maxScrollTop = el.scrollTop;
      }
    }

    return maxScrollTop;
  }, []);

  const applyScrollTop = useCallback(targetPosition => {
    const candidates = collectScrollCandidates(scrollableRef?.current);

    for (const el of candidates) {
      el.scrollTop = targetPosition;
    }
  }, []);

  const saveScrollPosition = useCallback(() => {
    if (!scrollableRef?.current || isRestoringRef.current) {
      return;
    }

    const scrollTop = readScrollTop();
    lastScrollTopRef.current = scrollTop;
    setScrollPosition(scrollTop);
  }, [readScrollTop, setScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    const targetPosition = targetScrollPositionRef.current;

    if (!scrollableRef?.current || targetPosition === undefined || targetPosition === null) {
      return;
    }

    applyScrollTop(targetPosition);
  }, [applyScrollTop]);

  useEffect(function trackScrollPosition() {
    const refElement = scrollableRef?.current;

    if (!refElement) {
      return;
    }

    const candidates = collectScrollCandidates(refElement);

    let scrollTimeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };

    for (const el of candidates) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }

    return function untrackScrollPosition() {
      for (const el of candidates) {
        el.removeEventListener('scroll', handleScroll);
      }

      clearTimeout(scrollTimeout);
    };
  }, [saveScrollPosition, loading]);

  useEffect(function restoreScrollPositionOnLoad() {
    const shouldRestore = !loading && !hasRestoredRef.current && scrollableRef?.current && scrollPosition !== undefined;

    if (shouldRestore) {
      isRestoringRef.current = true;
      targetScrollPositionRef.current = scrollPosition;

      requestAnimationFrame(() => {
        restoreScrollPosition();

        requestAnimationFrame(() => {
          const currentScroll = readScrollTop();
          const targetScroll = targetScrollPositionRef.current;

          if (currentScroll !== targetScroll && targetScroll !== null) {
            restoreScrollPosition();
          }

          hasRestoredRef.current = true;

          setTimeout(() => {
            const finalScroll = readScrollTop();
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
  }, [loading, scrollPosition, restoreScrollPosition, readScrollTop]);

  useEffect(function resetScrollRestoredOnPathChange() {
    hasRestoredRef.current = false;
  }, [pathname]);

  useEffect(function persistScrollPositionOnPageHide() {
    const handlePageHide = () => {
      if (isRestoringRef.current) {
        return;
      }

      const scrollTop = scrollableRef?.current ? readScrollTop() : lastScrollTopRef.current;

      if (scrollTop > 0) {
        setScrollPosition(scrollTop);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return function removePageHideListeners() {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setScrollPosition, readScrollTop]);

  useEffect(function persistScrollPositionOnUnmount() {
    return function persistScrollPosition() {
      if (isRestoringRef.current) {
        return;
      }

      const scrollTop = scrollableRef?.current ? readScrollTop() : lastScrollTopRef.current;

      if (scrollTop > 0) {
        setScrollPosition(scrollTop);
      }
    };
  }, [setScrollPosition, readScrollTop]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    scrollPosition,
    scrollableRef
  };
};

export default useScrollPosition;
