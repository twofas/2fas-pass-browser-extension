// SPDX-License-Identifier: BUSL-1.1
//
// Copyright © 2025 Two Factor Authentication Service, Inc.
// Licensed under the Business Source License 1.1
// See LICENSE file for full terms

import { useCallback, useRef } from 'react';
import { getInputClickPosition } from '@/partials/functions';

/**
 * Hook for handling InputMask focus behavior to prevent select-all on focus.
 * PrimeReact InputMask selects all text when focused and mask is complete.
 * This hook overrides that behavior and positions cursor at click location.
 * @return {Object} Object containing handleMouseDown and handleFocus callbacks, and clickPositionRef.
 */
const useInputMaskFocus = () => {
  const clickPositionRef = useRef(null);

  const handleMouseDown = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      clickPositionRef.current = null;
      return;
    }

    if (document.activeElement === inputElement) {
      clickPositionRef.current = null;
      return;
    }

    clickPositionRef.current = getInputClickPosition(inputElement, e.clientX);
  }, []);

  const handleFocus = useCallback(e => {
    const inputElement = e.target;

    if (!inputElement || !inputElement.value) {
      return;
    }

    const savedClickPosition = clickPositionRef.current;

    clickPositionRef.current = null;

    setTimeout(() => {
      if (inputElement !== document.activeElement) {
        return;
      }

      const valueLength = inputElement.value.length;
      const selectionStart = inputElement.selectionStart;
      const selectionEnd = inputElement.selectionEnd;

      if (selectionStart === 0 && selectionEnd === valueLength) {
        if (savedClickPosition !== null) {
          inputElement.setSelectionRange(savedClickPosition, savedClickPosition);
        } else {
          inputElement.setSelectionRange(valueLength, valueLength);
        }
      }
    }, 101);
  }, []);

  return { handleMouseDown, handleFocus, clickPositionRef };
};

export default useInputMaskFocus;
