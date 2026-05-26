// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback, useEffect, useRef } from 'react';
import usePopupState from '@/entrypoints/popup/store/popupState/usePopupState';

const SEARCH_BLUR_DEBOUNCE_MS = 250;

/**
* Hook for managing search filter state in popup.
* @return {Object} Object with handleSearchChange, clearSearch, handleSearchBlur, handleSearchFocus callbacks.
*/
export const useSearchFilter = () => {
  const { setBatchData, data } = usePopupState();
  const blurTimeoutRef = useRef(null);
  const hasUserInteractedRef = useRef(false);
  const searchValueRef = useRef(data?.searchValue || '');
  searchValueRef.current = data?.searchValue || '';

  const cancelBlurTimeout = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }, []);

  const handleSearchChange = useCallback(e => {
    const value = e?.target?.value;

    if (value.trim().length > 0) {
      cancelBlurTimeout();
      setBatchData({ searchActive: true, searchValue: value });
    } else {
      cancelBlurTimeout();
      setBatchData({ searchValue: '' });
    }
  }, [setBatchData, cancelBlurTimeout]);

  const clearSearch = useCallback(() => {
    cancelBlurTimeout();
    setBatchData({ searchValue: '', searchActive: false });
  }, [setBatchData, cancelBlurTimeout]);

  const handleSearchBlur = useCallback(() => {
    cancelBlurTimeout();
    blurTimeoutRef.current = setTimeout(() => {
      blurTimeoutRef.current = null;

      if (!hasUserInteractedRef.current) {
        return;
      }

      const searchEl = document.getElementById('search');

      if (searchEl && document.activeElement === searchEl) {
        return;
      }

      setBatchData({ searchActive: false });
    }, SEARCH_BLUR_DEBOUNCE_MS);
  }, [setBatchData, cancelBlurTimeout]);

  const handleSearchFocus = useCallback(e => {
    cancelBlurTimeout();

    const hasSearchValue = searchValueRef.current.length > 0;
    const isSpurious = !hasUserInteractedRef.current && !hasSearchValue;

    if (isSpurious) {
      try { e?.target?.blur(); } catch {}
      return;
    }

    setBatchData({ searchActive: true });
  }, [setBatchData, cancelBlurTimeout]);

  useEffect(function trackUserInteractionForBlurSuppression() {
    const markInteracted = () => {
      hasUserInteractedRef.current = true;
    };

    document.addEventListener('mousedown', markInteracted, true);
    document.addEventListener('keydown', markInteracted, true);
    document.addEventListener('wheel', markInteracted, { passive: true, capture: true });
    document.addEventListener('touchstart', markInteracted, { passive: true, capture: true });

    return function untrackUserInteractionListeners() {
      document.removeEventListener('mousedown', markInteracted, true);
      document.removeEventListener('keydown', markInteracted, true);
      document.removeEventListener('wheel', markInteracted, true);
      document.removeEventListener('touchstart', markInteracted, true);
    };
  }, []);

  useEffect(function cleanupBlurTimeoutOnUnmount() {
    return function clearPendingBlurTimeout() {
      cancelBlurTimeout();
    };
  }, [cancelBlurTimeout]);

  return { handleSearchChange, clearSearch, handleSearchBlur, handleSearchFocus };
};
